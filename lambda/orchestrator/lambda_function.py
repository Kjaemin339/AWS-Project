"""
기업맞손 Phase 4 — Orchestrator Lambda
도구 7개: search_programs, verify_certifications, generate_draft,
         calc_expected_effect, get_matched_programs, explain_program, revise_draft

도구 1~4: API Gateway에서 직접 함수 호출
도구 5~7: Strands Agent가 챗봇 컨텍스트에서 자체 선택
"""

import json
import os
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

# ─── 환경변수 ───
PROGRAMS_TABLE = os.environ.get("PROGRAMS_TABLE", "gbmatch-programs")
HISTORY_TABLE = os.environ.get("HISTORY_TABLE", "gbmatch-matching-history")
DRAFTS_BUCKET = os.environ.get("DRAFTS_BUCKET", "gbmatch-drafts-973106207635")
MOCK_MODE = os.environ.get("MOCK_MODE", "true").lower() == "true"
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
# Nova → Claude Haiku 4.5로 전환 (on-demand 직접 호출 불가, cross-region inference profile 경유 필요)
LLM_MODEL_ID = os.environ.get("LLM_MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0")

# ─── AWS 클라이언트 ───
dynamodb = boto3.resource("dynamodb")
programs_table = dynamodb.Table(PROGRAMS_TABLE)
history_table = dynamodb.Table(HISTORY_TABLE)
s3 = boto3.client("s3")
bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)


# ═══════════════════════════════════════════════════════════════
# 공통 유틸
# ═══════════════════════════════════════════════════════════════

def invoke_llm(model_id, prompt, max_tokens=1024):
    """Bedrock Converse API 사용 — 모델 무관 통일 인터페이스 (Nova/Claude 등)"""
    resp = bedrock.converse(
        modelId=model_id,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": max_tokens}
    )
    return resp["output"]["message"]["content"][0]["text"]


GUARDRAIL_ID = os.environ.get("GUARDRAIL_ID", "lxw6zw9bsg6q")
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION", "1")


def invoke_llm_with_guardrail(model_id, prompt, max_tokens=1024, grounding_source=""):
    """Guardrail의 contextual grounding으로 환각 체크하며 LLM 호출"""
    try:
        resp = bedrock.converse(
            modelId=model_id,
            messages=[{"role": "user", "content": [
                {"guardContent": {"text": {"text": grounding_source, "qualifiers": ["grounding_source"]}}},
                {"text": prompt}
            ]}],
            inferenceConfig={"maxTokens": max_tokens},
            guardrailConfig={"guardrailIdentifier": GUARDRAIL_ID, "guardrailVersion": GUARDRAIL_VERSION}
        )
        return resp["output"]["message"]["content"][0]["text"]
    except Exception:
        return invoke_llm(model_id, prompt, max_tokens)


def split_multi_value(field_value):
    if not field_value:
        return []
    return [v.strip() for v in field_value.split("|") if v.strip()]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# 스펙 v2.4 6-1절: 근로자수/업력 코드값 → LLM 프롬프트에 넣을 한국어 라벨
EMPLOYEE_COUNT_LABELS = {
    "EI01": "1~5명 미만",
    "EI02": "5~10명",
    "EI03": "10~20명",
    "EI04": "20~50명",
    "EI05": "50~100명",
    "EI06": "100명 이상",
}

BUSINESS_AGE_LABELS = {
    "OI01": "3년 미만",
    "OI02": "3~5년",
    "OI03": "5~7년",
    "OI04": "7~10년",
    "OI05": "10~20년",
    "OI06": "20년 이상",
}


def _employee_count_label(code):
    return EMPLOYEE_COUNT_LABELS.get(code, code)


def _business_age_label(code):
    return BUSINESS_AGE_LABELS.get(code, code)


# 스펙 v2.4 6-1절: 매출액 구간(선택 입력) 코드값 → 라벨
SALES_AMOUNT_LABELS = {
    "SI01": "5억 미만",
    "SI02": "5~10억",
    "SI03": "10~20억",
    "SI04": "20~50억",
    "SI05": "50~100억",
    "SI06": "100~300억",
    "SI07": "300억 이상",
}


def _sales_amount_label(code):
    return SALES_AMOUNT_LABELS.get(code, code)


def _location_text(profile):
    detail = profile.get("location_detail", "")
    return f"경상북도 {detail}" if detail else "경상북도"


# ═══════════════════════════════════════════════════════════════
# 도구 1: search_programs (직접 함수 호출)
# ═══════════════════════════════════════════════════════════════

def search_programs(profile):
    """
    1단계: 하드필터 (업종/지역/규모/업력/마감일) → candidate_program_ids
    2단계: KB 순위화 (현재 미구현, candidate_program_ids를 그대로 반환)
    3단계: LLM 근거 생성
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    user_area = profile.get("area_code", "4700")
    user_employee = profile.get("employee_count_code", "")
    user_biz_age = profile.get("business_age_code", "")
    user_induty = profile.get("induty", "")
    user_is_preliminary = profile.get("preliminary_startup_yn", "N") == "Y"

    all_programs = programs_table.scan()["Items"]

    candidates = []
    for prog in all_programs:
        # 마감일 체크
        deadline = prog.get("deadline", "")
        if deadline < today:
            continue

        # 지역 체크: 공고의 area_code에 사용자 지역(4700) 또는 전국(1000) 포함
        prog_areas = split_multi_value(prog.get("area_code", ""))
        if user_area not in prog_areas and "1000" not in prog_areas:
            continue

        # 업종 체크: 완화 매칭 (부분 포함)
        prog_induty = prog.get("induty", "")
        if prog_induty and prog_induty not in ("전체", "공통"):
            prog_induty_values = split_multi_value(prog_induty)
            induty_match = any(
                user_induty in pv or pv in user_induty
                for pv in prog_induty_values
            )
            if not induty_match and user_induty:
                continue

        # 근로자수 체크
        if user_employee:
            prog_emply = split_multi_value(prog.get("employee_count_code", ""))
            if prog_emply and user_employee not in prog_emply:
                continue

        # 업력 체크
        if user_is_preliminary:
            if prog.get("preliminary_startup_yn") == "N":
                prog_biz_age = split_multi_value(prog.get("business_age_code", ""))
                if prog_biz_age:
                    continue
        else:
            if user_biz_age:
                prog_biz_age = split_multi_value(prog.get("business_age_code", ""))
                if prog_biz_age and user_biz_age not in prog_biz_age:
                    continue

        candidates.append(prog)

    candidate_program_ids = [p["program_id"] for p in candidates]

    # ─── 2단계: LLM 리랭킹 (KB 대체 — 랩 환경 PassRole 제약으로 KB 생성 불가) ───
    ranked_programs = _rerank_with_llm(profile, candidates) if len(candidates) > 5 else candidates

    if not ranked_programs:
        failed_filters = _diagnose_failed_filters(profile, all_programs, today)
        return {
            "matched": False,
            "candidate_program_ids": [],
            "programs": [],
            "message": "조건에 맞는 공고가 없습니다.",
            "failed_filters": failed_filters,
            "suggestion": "다음 조건을 완화해 보세요: " + ", ".join(failed_filters)
        }

    # ─── 3단계: LLM 매칭 근거 생성 ───
    top_programs = ranked_programs[:5]
    rationale = _generate_match_rationale(profile, top_programs)

    return {
        "matched": True,
        "candidate_program_ids": candidate_program_ids,
        "programs": [
            {
                "program_id": p["program_id"],
                "title": p.get("title", ""),
                "support_type_name": p.get("support_type_name", ""),
                "area_name": p.get("area_name", ""),
                "deadline": p.get("deadline", ""),
                "max_support_amount": int(p.get("max_support_amount") or 0),
                "support_scale": p.get("support_scale", ""),
                "attachment_url": p.get("attachment_url", ""),
                "attachment_name": p.get("attachment_name", "")
            }
            for p in top_programs
        ],
        "rationale": rationale
    }


def _diagnose_failed_filters(profile, all_programs, today):
    failed = []
    user_area = profile.get("area_code", "4700")
    user_employee = profile.get("employee_count_code", "")
    user_biz_age = profile.get("business_age_code", "")
    user_induty = profile.get("induty", "")

    active_programs = [p for p in all_programs if p.get("deadline", "") >= today]
    if not active_programs:
        return ["마감일(모든 공고 마감)"]

    area_pass = [p for p in active_programs
                 if user_area in split_multi_value(p.get("area_code", ""))
                 or "1000" in split_multi_value(p.get("area_code", ""))]
    if not area_pass:
        failed.append("지역")

    if user_employee:
        emply_pass = [p for p in active_programs
                      if not split_multi_value(p.get("employee_count_code", ""))
                      or user_employee in split_multi_value(p.get("employee_count_code", ""))]
        if not emply_pass:
            failed.append("근로자수")

    if user_biz_age:
        age_pass = [p for p in active_programs
                    if not split_multi_value(p.get("business_age_code", ""))
                    or user_biz_age in split_multi_value(p.get("business_age_code", ""))]
        if not age_pass:
            failed.append("업력")

    if user_induty:
        induty_pass = [p for p in active_programs
                       if not p.get("induty") or p.get("induty") in ("전체", "공통")
                       or any(user_induty in v or v in user_induty
                              for v in split_multi_value(p.get("induty", "")))]
        if not induty_pass:
            failed.append("업종")

    return failed if failed else ["복합 조건"]


def _rerank_with_llm(profile, candidates):
    """LLM으로 candidate 목록을 적합도순으로 재정렬 (KB 대체)"""
    summaries = "\n".join([
        f"{i+1}. [{p['program_id']}] {p.get('title','')} "
        f"(분야: {p.get('biz_type_name','')}, 기관: {p.get('support_institution','')})"
        for i, p in enumerate(candidates[:20])
    ])

    prompt = f"""다음 기업 프로필에 가장 적합한 지원사업 순서대로 번호를 나열하세요.

기업: 업종={profile.get('induty','')}, 지역=경북, 근로자수={_employee_count_label(profile.get('employee_count_code',''))}, 업력={_business_age_label(profile.get('business_age_code',''))}, 희망={profile.get('desired_support','')}

후보 사업:
{summaries}

상위 10개 번호만 쉼표로 응답하세요 (예: 3,1,7,2,...). 설명 없이 번호만."""

    try:
        result = invoke_llm(LLM_MODEL_ID, prompt, max_tokens=64)
        nums = [int(n.strip()) - 1 for n in result.split(",") if n.strip().isdigit()]
        reranked = [candidates[n] for n in nums if 0 <= n < len(candidates)]
        remaining = [c for c in candidates if c not in reranked]
        return reranked + remaining
    except Exception:
        return candidates


def _generate_match_rationale(profile, programs):
    prog_summaries = "\n".join([
        f"- {p.get('title','')}: 지역={p.get('area_name','')}, "
        f"지원유형={p.get('support_type_name','')}, "
        f"마감={p.get('deadline','')}"
        for p in programs
    ])

    prompt = f"""다음 기업 프로필과 매칭된 지원사업 목록을 보고, 각 사업이 왜 이 기업에 적합한지 간결하게 설명하세요.

기업 프로필:
- 업종: {profile.get('induty', '')}
- 소재지: {_location_text(profile)}
- 근로자수 구간: {_employee_count_label(profile.get('employee_count_code', ''))}
- 업력 구간: {_business_age_label(profile.get('business_age_code', ''))}
- 희망 지원분야: {profile.get('desired_support', '')}

매칭된 사업:
{prog_summaries}

각 사업별로 1~2문장으로 매칭 근거를 작성하세요. 코드값을 사용하지 말고 한국어 텍스트로 작성하세요. 마크다운 문법(#, *, - 등)은 쓰지 말고 순수 텍스트로만 작성하세요."""

    return invoke_llm(LLM_MODEL_ID, prompt, max_tokens=512)


# ═══════════════════════════════════════════════════════════════
# 도구 2: verify_certifications (직접 함수 호출)
# ═══════════════════════════════════════════════════════════════

def verify_certifications(bizno):
    """
    사업자번호로 이노비즈/벤처/메인비즈 인증 보유 확인.
    MOCK_MODE=true → mock 응답, false → 실제 증명서 API 호출.
    429 재시도: 최대 1회, retryAfterSeconds <= 5초일 때만.
    """
    if not bizno:
        return {"certifications": [], "message": "사업자번호 미입력"}

    cert_codes = [
        {"code": "y105", "name": "이노비즈", "matching_code": "EC06"},
        {"code": "y106", "name": "벤처기업", "matching_code": "EC08"},
        {"code": "y104", "name": "메인비즈", "matching_code": "EC07"},
    ]

    if MOCK_MODE:
        return _verify_mock(bizno, cert_codes)
    else:
        return _verify_real(bizno, cert_codes)


def _verify_mock(bizno, cert_codes):
    last_digit = int(bizno[-1]) if bizno and bizno[-1].isdigit() else 0
    results = []
    for cert in cert_codes:
        has_cert = (last_digit % 2 == 0)
        results.append({
            "cert_code": cert["code"],
            "cert_name": cert["name"],
            "matching_code": cert["matching_code"],
            "has_certification": has_cert,
            "result_code": "1" if has_cert else "2"
        })
    return {"certifications": results, "source": "mock"}


def _verify_real(bizno, cert_codes):
    import urllib.request
    import urllib.error
    import time

    api_token = os.environ.get("CERT_API_TOKEN", "")
    base_url = "https://api.smes.go.kr/certApi/v1/certification"
    results = []

    for cert in cert_codes:
        url = f"{base_url}?bizno={bizno}&certCode={cert['code']}"
        headers = {"Authorization": f"Bearer {api_token}"}
        req = urllib.request.Request(url, headers=headers)

        retry_count = 0
        while retry_count <= 1:
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                    results.append({
                        "cert_code": cert["code"],
                        "cert_name": cert["name"],
                        "matching_code": cert["matching_code"],
                        "has_certification": data.get("resultCd") == "1",
                        "result_code": data.get("resultCd", "2")
                    })
                    break
            except urllib.error.HTTPError as e:
                if e.code == 429 and retry_count == 0:
                    retry_after = int(e.headers.get("Retry-After", "10"))
                    if retry_after <= 5:
                        time.sleep(retry_after)
                        retry_count += 1
                        continue
                results.append({
                    "cert_code": cert["code"],
                    "cert_name": cert["name"],
                    "matching_code": cert["matching_code"],
                    "has_certification": False,
                    "result_code": "error",
                    "error": str(e.code)
                })
                break
            except Exception as e:
                results.append({
                    "cert_code": cert["code"],
                    "cert_name": cert["name"],
                    "matching_code": cert["matching_code"],
                    "has_certification": False,
                    "result_code": "error",
                    "error": str(e)
                })
                break

    return {"certifications": results, "source": "api"}


# ═══════════════════════════════════════════════════════════════
# 도구 3: generate_draft (직접 함수 호출)
# ═══════════════════════════════════════════════════════════════

def generate_draft(program_id, user_id, profile, certifications=None):
    """
    지원서 초안 생성.
    수치/링크는 마스터 테이블에서 그대로 삽입, LLM은 서술만 생성.
    """
    prog = programs_table.get_item(Key={"program_id": program_id}).get("Item")
    if not prog:
        return {"error": f"program_id '{program_id}' not found"}

    factual_data = {
        "title": prog.get("title", ""),
        "support_target": prog.get("support_target", ""),
        "area_name": prog.get("area_name", ""),
        "support_scale": prog.get("support_scale", ""),
        "deadline": prog.get("deadline", ""),
        "apply_url": prog.get("apply_url", ""),
        "detail_page_url": prog.get("detail_page_url", ""),
        "contact_info": prog.get("contact_info", ""),
        "support_content": prog.get("support_content", ""),
        "overview": prog.get("overview", ""),
        "attachment_url": prog.get("attachment_url", ""),
        "attachment_name": prog.get("attachment_name", "")
    }

    company_name = profile.get("company_name", "") or "(회사명 미입력)"
    sales_amount = _sales_amount_label(profile.get("sales_amount_code", ""))
    held_certs = [c.get("cert_name") for c in (certifications or []) if c.get("has_certification")]
    cert_text = ", ".join(held_certs) if held_certs else "없음"

    prompt = f"""다음 기업과 지원사업 정보를 바탕으로 지원서 초안의 서술 부분을 작성하세요.

기업 정보:
- 회사명: {company_name}
- 업종: {profile.get('induty', '')}
- 소재지: {_location_text(profile)}
- 근로자수: {_employee_count_label(profile.get('employee_count_code', ''))}
- 업력: {_business_age_label(profile.get('business_age_code', ''))}
- 매출액 구간: {sales_amount or '미입력'}
- 희망분야: {profile.get('desired_support', '')}
- 보유 인증: {cert_text}

사업 정보:
- 사업명: {factual_data['title']}
- 사업개요: {factual_data['overview']}
- 지원내용: {factual_data['support_content']}
- 지원대상: {factual_data['support_target']}

다음 3개 섹션을 작성하세요:
1. 사업 개요 (2~3문장)
2. 신청 사유 (회사명을 명시하고, 이 기업의 업종·소재지·근로자수·업력·매출액 구간·보유 인증 중 지원사업과 관련 있는 요소를 구체적으로 언급하며 왜 적합한지 3~4문장으로 작성. 보유 인증이 있으면 반드시 언급)
3. 기대효과 서술 (지원받으면 어떤 성과가 예상되는지, 2~3문장)

일반적이고 뻔한 표현 대신 위 기업 정보의 구체적인 수치·항목을 실제로 인용하여 작성하세요. 전문적이고 간결한 한국어로 작성하세요. 마크다운 문법(#, ##, ** 등)은 쓰지 말고 순수 텍스트로만 작성하세요."""

    narrative = invoke_llm_with_guardrail(
        LLM_MODEL_ID, prompt, max_tokens=1024,
        grounding_source=f"{factual_data['overview']}\n{factual_data['support_content']}\n{factual_data['support_target']}"
    )

    apply_link_text = ""
    if factual_data["apply_url"]:
        apply_link_text = f"\n\n온라인 신청: {factual_data['apply_url']}"
    elif factual_data["detail_page_url"]:
        apply_link_text = f"\n\n공고 상세페이지: {factual_data['detail_page_url']}"

    attachment_line = ""
    if factual_data["attachment_name"]:
        names = [n.strip() for n in factual_data["attachment_name"].split("@") if n.strip()]
        attachment_line = "\n  - 첨부파일: " + ", ".join(names)

    draft_content = f"""═══════════════════════════════════════
지원서 초안 — {factual_data['title']}
═══════════════════════════════════════

■ 사업 정보
  - 사업명: {factual_data['title']}
  - 지원대상: {factual_data['support_target']}
  - 지원규모: {factual_data['support_scale']}
  - 지역: {factual_data['area_name']}
  - 마감일: {factual_data['deadline']}
  - 문의처: {factual_data['contact_info']}{attachment_line}

■ 서술 내용
{narrative}

■ 신청 안내{apply_link_text}

═══════════════════════════════════════
생성일시: {now_iso()}
═══════════════════════════════════════
"""

    s3_key = f"drafts/{user_id}/{program_id}/{now_iso().replace(':', '-')}.txt"
    s3.put_object(
        Bucket=DRAFTS_BUCKET,
        Key=s3_key,
        Body=draft_content.encode("utf-8"),
        ContentType="text/plain; charset=utf-8"
    )

    return {
        "program_id": program_id,
        "draft_content": draft_content,
        "s3_key": s3_key,
        "factual_data": factual_data
    }


# ═══════════════════════════════════════════════════════════════
# 도구 4: calc_expected_effect (직접 함수 호출)
# ═══════════════════════════════════════════════════════════════

INDUSTRY_PARAMS = {
    "제조업": {"revenue_multiplier": 2.5, "cost_per_employee": 80000000, "profit_rate": 0.08},
    "전자부품": {"revenue_multiplier": 3.0, "cost_per_employee": 100000000, "profit_rate": 0.10},
    "기계": {"revenue_multiplier": 2.2, "cost_per_employee": 90000000, "profit_rate": 0.07},
    "자동차부품": {"revenue_multiplier": 2.8, "cost_per_employee": 95000000, "profit_rate": 0.09},
    "금속가공": {"revenue_multiplier": 2.0, "cost_per_employee": 70000000, "profit_rate": 0.06},
    "default": {"revenue_multiplier": 2.5, "cost_per_employee": 80000000, "profit_rate": 0.08},
}


def calc_expected_effect(program_id, profile):
    """
    program_id로 마스터 테이블에서 금액 조회 → 4개 지표 계산.
    금액을 파라미터로 직접 받지 않음.
    """
    prog = programs_table.get_item(Key={"program_id": program_id}).get("Item")
    if not prog:
        return {"error": f"program_id '{program_id}' not found"}

    support_amount = None
    max_amt = prog.get("max_support_amount")
    min_amt = prog.get("min_support_amount")

    if max_amt:
        support_amount = int(max_amt)
    elif min_amt:
        support_amount = int(min_amt)
    else:
        support_amount = _extract_amount_from_text(prog.get("support_scale", ""))

    if not support_amount:
        return {"error": "지원금액 정보를 확인할 수 없습니다."}

    user_induty = profile.get("induty", "제조업")
    params = INDUSTRY_PARAMS.get(user_induty, INDUSTRY_PARAMS["default"])

    expected_revenue = support_amount * params["revenue_multiplier"]
    expected_jobs = support_amount / params["cost_per_employee"]
    expected_profit = expected_revenue * params["profit_rate"]
    payback_period = 1 / (params["revenue_multiplier"] * params["profit_rate"])

    result = {
        "program_id": program_id,
        "support_amount": support_amount,
        "expected_revenue_increase": int(expected_revenue),
        "expected_job_creation": round(expected_jobs, 1),
        "expected_net_profit": int(expected_profit),
        "payback_period_years": round(payback_period, 2),
        "industry_params_used": user_induty,
        "formula_note": "회수기간 = 1/(매출승수x이익률)로, 지원금액과 무관한 비율 지표입니다. 금액 규모 차이는 예상순이익(절대값)으로 확인하세요."
    }

    explain_prompt = f"""다음 기대효과 수치를 기업 담당자가 이해하기 쉽게 한국어로 설명하세요:

사업명: {prog.get('title', '')}
지원금액: {support_amount:,}원
예상 매출증가: {int(expected_revenue):,}원
예상 고용창출: {round(expected_jobs, 1)}명
예상 순이익: {int(expected_profit):,}원/년
회수기간: {round(payback_period, 2)}년

3~4문장으로 간결하게 설명하세요. 회수기간은 업종 특성에 의한 비율 지표이며, 지원금액 규모에 따른 실질적 효과는 예상 순이익으로 판단해야 한다는 점을 언급하세요. 마크다운 문법은 쓰지 말고 순수 텍스트로만 작성하세요."""

    result["explanation"] = invoke_llm(LLM_MODEL_ID, explain_prompt, max_tokens=300)
    return result


def _extract_amount_from_text(text):
    if not text:
        return None
    prompt = f"""다음 텍스트에서 지원금액(최대 기준)을 숫자(원 단위)로만 답하세요. 숫자만 출력하세요.
텍스트: {text}"""
    try:
        result = invoke_llm(LLM_MODEL_ID, prompt, max_tokens=50)
        return int("".join(c for c in result if c.isdigit()))
    except (ValueError, TypeError):
        return None


# ═══════════════════════════════════════════════════════════════
# 도구 5: get_matched_programs (Agent 도구)
# ═══════════════════════════════════════════════════════════════

def get_matched_programs(user_id):
    response = history_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False,
        Limit=5
    )
    return {
        "user_id": user_id,
        "history": [_decimals_to_native(item) for item in response.get("Items", [])],
        "count": response.get("Count", 0)
    }


# ═══════════════════════════════════════════════════════════════
# 도구 6: explain_program (Agent 도구)
# ═══════════════════════════════════════════════════════════════

def explain_program(program_id):
    prog = programs_table.get_item(Key={"program_id": program_id}).get("Item")
    if not prog:
        return {"error": f"program_id '{program_id}' not found"}

    prompt = f"""다음 지원사업 정보를 기업 담당자가 이해하기 쉽게 상세히 설명하세요.

사업명: {prog.get('title', '')}
사업개요: {prog.get('overview', '')}
지원내용: {prog.get('support_content', '')}
지원대상: {prog.get('support_target', '')}
지원규모: {prog.get('support_scale', '')}
지역: {prog.get('area_name', '')}
마감일: {prog.get('deadline', '')}
신청방법: {prog.get('apply_method', '')}
문의처: {prog.get('contact_info', '')}

핵심 요건, 주의사항, 신청 시 팁을 포함해서 설명하세요. 마크다운 문법(#, ##, **, - 등)은 쓰지 말고 순수 텍스트로만 작성하세요."""

    explanation = invoke_llm(LLM_MODEL_ID, prompt, max_tokens=800)

    return {
        "program_id": program_id,
        "title": prog.get("title", ""),
        "explanation": explanation,
        "apply_url": prog.get("apply_url", ""),
        "detail_page_url": prog.get("detail_page_url", ""),
        "deadline": prog.get("deadline", ""),
        "contact_info": prog.get("contact_info", "")
    }


# ═══════════════════════════════════════════════════════════════
# 도구 7: revise_draft (Agent 도구)
# ═══════════════════════════════════════════════════════════════

def revise_draft(s3_key, user_id, revision_request):
    try:
        obj = s3.get_object(Bucket=DRAFTS_BUCKET, Key=s3_key)
        original_draft = obj["Body"].read().decode("utf-8")
    except Exception as e:
        return {"error": f"초안 로드 실패: {str(e)}"}

    prompt = f"""다음 지원서 초안을 사용자의 수정 요청에 맞게 수정하세요.

원본 초안:
{original_draft}

수정 요청: {revision_request}

전체 초안을 수정 요청을 반영하여 다시 작성하세요. 기존의 사업 정보(사업명, 지원대상, 금액, 마감일, 링크 등)는 그대로 유지하고 서술 부분만 수정하세요. 마크다운 문법은 쓰지 말고 순수 텍스트로만 작성하세요."""

    revised = invoke_llm(LLM_MODEL_ID, prompt, max_tokens=1500)

    new_key = s3_key.rsplit("/", 1)[0] + f"/revised_{now_iso().replace(':', '-')}.txt"
    s3.put_object(
        Bucket=DRAFTS_BUCKET,
        Key=new_key,
        Body=revised.encode("utf-8"),
        ContentType="text/plain; charset=utf-8"
    )

    return {
        "original_key": s3_key,
        "revised_key": new_key,
        "revised_content": revised
    }


# ═══════════════════════════════════════════════════════════════
# 도구 8: get_dashboard_stats (직접 함수 호출, 신규 /dashboard 라우트)
# 스펙에 없던 신규 도구 — 대시보드 화면의 정적 목업 데이터를 실집계로 대체
# ═══════════════════════════════════════════════════════════════

def get_dashboard_stats():
    """
    전체 사용자의 매칭이력을 집계해 대시보드 지표를 산출.
    현재 데이터 규모가 작아 Scan을 사용 (규모가 커지면 별도 집계 테이블/스트림 방식 검토 필요).
    """
    items = []
    resp = history_table.scan()
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        resp = history_table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        items.extend(resp.get("Items", []))

    total_sessions = len(items)
    total_programs_matched = 0
    category_counts = {}
    total_revenue = Decimal(0)
    total_jobs = Decimal(0)
    monthly_counts = {}

    for it in items:
        matched = it.get("matched_programs") or []
        total_programs_matched += len(matched)
        for p in matched:
            cat = p.get("support_type_name") or "기타"
            category_counts[cat] = category_counts.get(cat, 0) + 1

        effect = it.get("expected_effect")
        if effect and not effect.get("error"):
            total_revenue += Decimal(str(effect.get("expected_revenue_increase", 0) or 0))
            total_jobs += Decimal(str(effect.get("expected_job_creation", 0) or 0))

        ts = it.get("ts", "")
        month = ts[:7] if len(ts) >= 7 else "미상"
        monthly_counts[month] = monthly_counts.get(month, 0) + 1

    category_total = sum(category_counts.values()) or 1
    category_distribution = [
        {"label": k, "count": v, "pct": round(v / category_total * 100, 1)}
        for k, v in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    monthly_trend = [{"month": k, "count": v} for k, v in sorted(monthly_counts.items())][-6:]

    return {
        "total_sessions": total_sessions,
        "total_programs_matched": total_programs_matched,
        "total_expected_revenue": int(total_revenue),
        "total_expected_jobs": float(total_jobs),
        "category_distribution": category_distribution,
        "monthly_trend": monthly_trend,
    }


# ═══════════════════════════════════════════════════════════════
# 매칭이력 저장 (스펙 1-12: 세션 단위로 신규생성 후 UpdateItem 누적)
# ═══════════════════════════════════════════════════════════════

def _floats_to_decimal(obj):
    """DynamoDB는 float을 지원하지 않으므로 저장 전 Decimal로 변환"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _floats_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_floats_to_decimal(v) for v in obj]
    return obj


def _decimals_to_native(obj):
    """
    DynamoDB에서 읽어온 Decimal을 int/float로 되돌림.
    안 그러면 json.dumps(default=str)가 Decimal(0)을 문자열 "0"으로 직렬화해서
    JS 쪽에서 truthy한 값("0")으로 취급되는 버그가 생김 (예: 지원금액 0원 오표시).
    """
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: _decimals_to_native(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimals_to_native(v) for v in obj]
    return obj


def _save_history_session(user_id, ts, company_info, matched_programs, status):
    if not user_id:
        return
    try:
        history_table.put_item(Item=_floats_to_decimal({
            "user_id": user_id,
            "ts": ts,
            "company_info": company_info,
            "matched_programs": matched_programs,
            "status": status,
        }))
    except Exception:
        pass  # 이력 저장 실패로 매칭/초안 응답 자체를 막지 않음


def _update_history_session(user_id, ts, draft_text=None, draft_s3_key=None, expected_effect=None, status=None):
    if not user_id or not ts:
        return
    update_parts = []
    expr_values = {}
    expr_names = {}
    if draft_text is not None:
        update_parts.append("draft_text = :dt")
        expr_values[":dt"] = draft_text
    if draft_s3_key is not None:
        update_parts.append("draft_s3_key = :dk")
        expr_values[":dk"] = draft_s3_key
    if expected_effect is not None:
        update_parts.append("expected_effect = :ee")
        expr_values[":ee"] = _floats_to_decimal(expected_effect)
    if status is not None:
        update_parts.append("#st = :st")
        expr_names["#st"] = "status"
        expr_values[":st"] = status
    if not update_parts:
        return
    try:
        kwargs = {
            "Key": {"user_id": user_id, "ts": ts},
            "UpdateExpression": "SET " + ", ".join(update_parts),
            "ExpressionAttributeValues": expr_values,
        }
        if expr_names:
            kwargs["ExpressionAttributeNames"] = expr_names
        history_table.update_item(**kwargs)
    except Exception:
        pass


# ═══════════════════════════════════════════════════════════════
# 챗봇 자유 텍스트 라우팅 (Bedrock Agent 없이 경량 라우팅, 스펙 1-17)
# ═══════════════════════════════════════════════════════════════

def _route_chat_message(message):
    """자유 텍스트를 도구 3개 중 하나 또는 일반질문(general)으로 분류"""
    prompt = f"""사용자가 지원사업 매칭 챗봇에 다음과 같이 말했습니다: "{message}"

다음 중 사용자의 의도에 가장 가까운 것을 하나만 고르세요:
1 = explain_program (현재 보고 있는 지원사업의 자격요건·세부내용을 묻는 질문)
2 = revise_draft (이미 생성된 지원서 초안의 특정 부분을 수정해달라는 요청)
3 = get_matched_programs (과거 매칭 이력이나 이전 결과를 다시 보고 싶다는 요청)
4 = general (위 세 가지에 해당하지 않는 일반적인 질문이나 인사)

번호만 답하세요."""
    try:
        result = invoke_llm(LLM_MODEL_ID, prompt, max_tokens=5)
        digits = "".join(c for c in result if c.isdigit())
        choice = digits[0] if digits else "4"
        return {"1": "explain_program", "2": "revise_draft", "3": "get_matched_programs"}.get(choice, "general")
    except Exception:
        return "general"


def _general_chat_answer(message, program_id):
    context = ""
    if program_id:
        prog = programs_table.get_item(Key={"program_id": program_id}).get("Item")
        if prog:
            context = (
                f"현재 상담 중인 공고: {prog.get('title', '')}\n"
                f"사업개요: {prog.get('overview', '')}\n"
                f"지원내용: {prog.get('support_content', '')}"
            )

    prompt = f"""당신은 정부지원사업 매칭 서비스 '기업맞손'의 상담 챗봇입니다.
사용자 질문에 친절하고 간결하게(3문장 이내) 한국어로 답하세요. 마크다운 문법은 쓰지 말고 순수 텍스트로만 답하세요.

{context}

사용자 질문: {message}"""
    try:
        return invoke_llm(LLM_MODEL_ID, prompt, max_tokens=400)
    except Exception:
        return "죄송합니다, 지금은 답변을 생성할 수 없습니다. 잠시 후 다시 시도해주세요."


# ═══════════════════════════════════════════════════════════════
# Lambda 핸들러
# ═══════════════════════════════════════════════════════════════

def _api_response(status_code, body_dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body_dict, ensure_ascii=False, default=str)
    }


def lambda_handler(event, context):
    """
    API Gateway Proxy 통합 + 직접 호출 양쪽 지원.
    - API Gateway: event에 httpMethod/path/body(JSON string) 포함
    - 직접 호출(테스트): event에 action/body(dict) 포함
    """
    # API Gateway Proxy 형식 판별
    if "httpMethod" in event:
        path = event.get("resource", event.get("path", ""))
        raw_body = event.get("body", "{}")
        body = json.loads(raw_body) if raw_body else {}
        user_id = ""
        claims = (event.get("requestContext", {})
                  .get("authorizer", {})
                  .get("claims", {}))
        if claims:
            user_id = claims.get("sub", claims.get("email", ""))

        try:
            if path == "/profile":
                profile = body.get("profile", {})
                bizno = body.get("bizno", profile.get("bizno", ""))
                cert_result = verify_certifications(bizno) if bizno else None
                match_result = search_programs(profile)
                result = {"matching": match_result}
                if cert_result:
                    result["certifications"] = cert_result

                effective_user_id = user_id or body.get("user_id", "")
                session_ts = now_iso()
                if effective_user_id:
                    company_info = dict(profile)
                    if cert_result:
                        company_info["certifications"] = cert_result
                    status = "매칭 완료" if match_result.get("matched") else "매칭 결과 없음"
                    _save_history_session(
                        effective_user_id, session_ts, company_info,
                        match_result.get("programs", []), status
                    )
                    result["session_ts"] = session_ts

                return _api_response(200, result)

            elif path == "/draft":
                program_id = body.get("program_id", "")
                profile = body.get("profile", {})
                session_ts = body.get("session_ts", "")
                certifications = body.get("certifications")
                effective_user_id = user_id or body.get("user_id", "")

                draft_result = generate_draft(program_id, effective_user_id, profile, certifications)
                effect_result = calc_expected_effect(program_id, profile)

                if effective_user_id and session_ts and not draft_result.get("error"):
                    _update_history_session(
                        effective_user_id, session_ts,
                        draft_text=draft_result.get("draft_content", ""),
                        draft_s3_key=draft_result.get("s3_key", ""),
                        expected_effect=effect_result if not effect_result.get("error") else None,
                        status="초안 생성 완료",
                    )

                return _api_response(200, {"draft": draft_result, "expected_effect": effect_result, "session_ts": session_ts})

            elif path == "/chat":
                action = body.get("action", "")
                message = body.get("message", "")
                program_id = body.get("program_id", "")
                effective_user_id = user_id or body.get("user_id", "")

                if not action and message:
                    action = _route_chat_message(message)

                if action == "get_matched_programs":
                    res = get_matched_programs(effective_user_id)
                    items = res.get("history", [])
                    if not items:
                        res["reply"] = "아직 매칭 이력이 없습니다. 프로필을 먼저 제출해주세요."
                    else:
                        lines = [
                            f"- {it.get('ts', '')[:10]} · {(it.get('matched_programs') or [{}])[0].get('title', '이력')} ({it.get('status', '')})"
                            for it in items
                        ]
                        res["reply"] = "최근 매칭 이력입니다:\n" + "\n".join(lines)
                    return _api_response(200, res)

                elif action == "explain_program":
                    res = explain_program(program_id or body.get("program_id", ""))
                    res["reply"] = res.get("explanation") or res.get("error", "설명을 가져오지 못했습니다.")
                    return _api_response(200, res)

                elif action == "revise_draft":
                    res = revise_draft(
                        body.get("s3_key", ""),
                        effective_user_id,
                        message or body.get("revision_request", "")
                    )
                    res["reply"] = (
                        "요청하신 대로 초안을 수정했습니다. 아래 초안 내용이 갱신됩니다."
                        if not res.get("error") else res["error"]
                    )
                    return _api_response(200, res)

                elif action == "general":
                    return _api_response(200, {"reply": _general_chat_answer(message, program_id), "action": "general"})

                else:
                    return _api_response(400, {"error": f"Unknown chat action: {action}"})

            elif path == "/dashboard":
                return _api_response(200, get_dashboard_stats())

            else:
                return _api_response(404, {"error": f"Unknown path: {path}"})

        except Exception as e:
            return _api_response(500, {"error": str(e)})

    # 직접 호출 형식 (Phase 4 테스트 호환)
    action = event.get("action", "")
    body = event.get("body", {})

    if action == "search_programs":
        return search_programs(body.get("profile", {}))
    elif action == "verify_certifications":
        return verify_certifications(body.get("bizno", ""))
    elif action == "generate_draft":
        return generate_draft(body.get("program_id", ""), body.get("user_id", ""), body.get("profile", {}), body.get("certifications"))
    elif action == "calc_expected_effect":
        return calc_expected_effect(body.get("program_id", ""), body.get("profile", {}))
    elif action == "get_matched_programs":
        return get_matched_programs(body.get("user_id", ""))
    elif action == "explain_program":
        return explain_program(body.get("program_id", ""))
    elif action == "revise_draft":
        return revise_draft(body.get("s3_key", ""), body.get("user_id", ""), body.get("revision_request", ""))
    elif action == "get_dashboard_stats":
        return get_dashboard_stats()
    else:
        return {"error": f"Unknown action: {action}"}
