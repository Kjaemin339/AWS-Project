"""
기업맞손 Phase 3 — Collector Lambda
기업마당(bizinfo.go.kr) 공고정보 API를 호출하여
경북/전국 지원사업 공고를 수집하고 마스터 테이블에 적재.
EventBridge 1일 1회 트리거.
"""

import json
import os
import re
import urllib.request
import urllib.error
from datetime import datetime, timezone

import boto3

# ─── 환경변수 ───
PROGRAMS_TABLE = os.environ.get("PROGRAMS_TABLE", "gbmatch-programs")
CRTFC_KEY = os.environ.get("CRTFC_KEY", "3L6ijr")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")

# ─── AWS 클라이언트 ───
dynamodb = boto3.resource("dynamodb")
programs_table = dynamodb.Table(PROGRAMS_TABLE)
bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)

# ─── 상수 ───
API_BASE_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"

# 지역 해시태그 → area_code 매핑
REGION_MAP = {
    "경북": "4700", "경상북도": "4700",
    "서울": "1100", "부산": "2600", "대구": "2700", "인천": "2800",
    "광주": "2900", "대전": "3000", "울산": "3100", "세종": "3600",
    "경기": "4100", "강원": "4200", "충북": "4300", "충남": "4400",
    "전북": "4500", "전남": "4600", "경남": "4800", "제주": "4900",
}

# 분야코드 매핑
CATEGORY_MAP = {
    "01": {"code": "PC10", "name": "금융", "support_type_code": "RT03", "support_type_name": "정책자금"},
    "02": {"code": "PC20", "name": "기술", "support_type_code": "RT02", "support_type_name": "기술개발"},
    "03": {"code": "PC30", "name": "인력", "support_type_code": "RT07", "support_type_name": "인력지원"},
    "04": {"code": "PC40", "name": "수출", "support_type_code": "RT08", "support_type_name": "수출지원"},
    "05": {"code": "PC50", "name": "내수", "support_type_code": "RT09", "support_type_name": "내수지원"},
    "06": {"code": "PC60", "name": "창업", "support_type_code": "RT06", "support_type_name": "창업지원"},
    "07": {"code": "PC70", "name": "경영", "support_type_code": "RT10", "support_type_name": "경영지원"},
    "09": {"code": "PC90", "name": "기타", "support_type_code": "RT99", "support_type_name": "기타"},
}

# 수집 대상 분야 (전체)
TARGET_CATEGORIES = ["01", "02", "03", "04", "05", "06", "07", "09"]


def lambda_handler(event, context):
    """EventBridge 또는 수동 트리거로 호출"""
    total_collected = 0
    total_stored = 0
    errors = []

    for category_id in TARGET_CATEGORIES:
        try:
            items = fetch_announcements(category_id, hashtag="경북")
            for item in items:
                mapped = map_to_master_schema(item, category_id)
                if mapped and is_valid_for_storage(mapped):
                    store_program(mapped)
                    total_stored += 1
            total_collected += len(items)
        except Exception as e:
            print(f"[collector] ERROR category={category_id}: {e}")
            errors.append({"category": category_id, "error": str(e)})

    # 만료 공고 정리
    expired_count = cleanup_expired_programs()

    return {
        "statusCode": 200,
        "body": {
            "total_collected": total_collected,
            "total_stored": total_stored,
            "expired_removed": expired_count,
            "errors": errors,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


def fetch_announcements(category_id, hashtag="경북", max_count=50):
    """기업마당 API 호출 (지수 백오프 재시도 최대 2회)"""
    import urllib.parse

    params = {
        "crtfcKey": CRTFC_KEY,
        "dataType": "json",
        "searchCnt": str(max_count),
        "searchLclasId": category_id,
        "hashtags": hashtag,
    }

    query_string = urllib.parse.urlencode(params, encoding="utf-8")
    url = f"{API_BASE_URL}?{query_string}"

    import time
    for attempt in range(3):
        try:
            req = urllib.request.Request(url)
            req.add_header("Content-type", "application/json")
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                json_array = data.get("jsonArray", [])
                if isinstance(json_array, list):
                    items = json_array
                elif isinstance(json_array, dict):
                    items = json_array.get("item", [])
                    if isinstance(items, dict):
                        items = [items]
                else:
                    items = []
                return items
        except urllib.error.HTTPError as e:
            if attempt < 2:
                time.sleep(2 ** attempt)
                continue
            raise
        except Exception as e:
            if attempt < 2:
                time.sleep(2 ** attempt)
                continue
            raise

    return []


def map_to_master_schema(item, category_id):
    """API 응답 아이템을 마스터 테이블 스키마로 변환"""
    seq = item.get("pblancId") or item.get("seq", "")
    if not seq:
        return None

    title = (item.get("pblancNm") or item.get("title", "")).strip()
    hashtags = item.get("hashtags") or item.get("hashTags", "")
    description = item.get("bsnsSumryCn") or item.get("description", "")
    req_date = item.get("reqstBeginEndDe") or item.get("reqstDt", "")

    # 지역 추출
    area_name, area_code = extract_region(hashtags)

    # 신청기간 파싱
    start_date, end_date = parse_request_dates(req_date)

    # 분야 매핑
    cat_info = CATEGORY_MAP.get(category_id, CATEGORY_MAP["09"])

    mapped = {
        "program_id": seq,
        "title": title,
        "overview": description,
        "support_content": description,
        "support_target": item.get("trgetNm", ""),
        "apply_method": "",
        "support_institution": item.get("jrsdInsttNm") or item.get("author", ""),
        "apply_start_date": start_date,
        "deadline": end_date,
        "area_name": area_name,
        "area_code": area_code,
        "induty": extract_induty_from_hashtags(hashtags),
        "employee_count_code": "",
        "business_age_code": "",
        "preliminary_startup_yn": "",
        "biz_type_code": cat_info["code"],
        "biz_type_name": cat_info["name"],
        "support_type_code": cat_info["support_type_code"],
        "support_type_name": cat_info["support_type_name"],
        "min_support_amount": 0,
        "max_support_amount": 0,
        "need_certification_code": "",
        "sales_amount_code": "",
        "company_scale_code": "",
        "apply_url": item.get("rceptEngnHmpgUrl", ""),
        "detail_page_url": item.get("pblancUrl") or item.get("link", ""),
        "contact_info": item.get("refrncNm", ""),
        "support_scale": "",
        "attachment_url": item.get("flpthNm") or item.get("printFlpthNm", ""),
        "attachment_name": item.get("fileNm") or item.get("printFileNm", ""),
        "source": "api",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    return mapped


def extract_region(hashtags):
    """hashTags에서 지역명과 area_code 추출"""
    if not hashtags:
        return "전국", "1000"

    tags = [t.strip() for t in hashtags.split(",")]
    found_regions = []

    for tag in tags:
        if tag in REGION_MAP:
            found_regions.append((tag, REGION_MAP[tag]))

    if not found_regions:
        return "전국", "1000"

    area_names = list(dict.fromkeys(r[0] for r in found_regions))
    area_codes = list(dict.fromkeys(r[1] for r in found_regions))

    if "4700" not in area_codes:
        area_codes.append("1000")

    return "|".join(area_names), "|".join(area_codes)


def extract_induty_from_hashtags(hashtags):
    """hashTags에서 업종 관련 키워드 추출"""
    if not hashtags:
        return ""

    induty_keywords = ["제조", "전자", "기계", "자동차", "금속", "화학", "바이오",
                       "IT", "소프트웨어", "반도체", "디스플레이", "로봇"]
    tags = [t.strip() for t in hashtags.split(",")]

    found = [tag for tag in tags if any(kw in tag for kw in induty_keywords)]
    return "|".join(found) if found else ""


def parse_request_dates(req_date_str):
    """신청기간 문자열에서 시작일/종료일 파싱 (YYYYMMDD ~ YYYYMMDD)"""
    if not req_date_str:
        return "", ""

    # "20220727 ~ 20220930" 또는 "2022-07-27 ~ 2022-09-30" 형식
    parts = re.split(r'\s*~\s*', req_date_str.strip())

    def normalize_date(d):
        d = d.strip().replace("-", "")
        if len(d) == 8:
            return f"{d[:4]}-{d[4:6]}-{d[6:8]}"
        return d

    start = normalize_date(parts[0]) if len(parts) >= 1 else ""
    end = normalize_date(parts[1]) if len(parts) >= 2 else ""

    return start, end


def is_valid_for_storage(mapped):
    """저장 가능 여부 판단"""
    if not mapped.get("program_id"):
        return False
    if not mapped.get("title"):
        return False
    # 마감일이 오늘 이전이면 스킵
    deadline = mapped.get("deadline", "")
    if deadline:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if deadline < today:
            return False
    return True


def store_program(mapped):
    """DynamoDB 마스터 테이블에 저장 (upsert)"""
    item = {}
    for key, value in mapped.items():
        if isinstance(value, int):
            if value != 0:
                item[key] = value
            else:
                item[key] = 0
        elif value:
            item[key] = value
        else:
            item[key] = ""

    programs_table.put_item(Item=item)


def cleanup_expired_programs():
    """마감일 지난 API 수집 공고 삭제 (MANUAL 건은 보존)"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    deleted = 0

    resp = programs_table.scan(
        FilterExpression="source = :src",
        ExpressionAttributeValues={":src": "api"}
    )

    for item in resp.get("Items", []):
        deadline = item.get("deadline", "")
        if deadline and deadline < today:
            programs_table.delete_item(Key={"program_id": item["program_id"]})
            deleted += 1

    while resp.get("LastEvaluatedKey"):
        resp = programs_table.scan(
            FilterExpression="source = :src",
            ExpressionAttributeValues={":src": "api"},
            ExclusiveStartKey=resp["LastEvaluatedKey"]
        )
        for item in resp.get("Items", []):
            deadline = item.get("deadline", "")
            if deadline and deadline < today:
                programs_table.delete_item(Key={"program_id": item["program_id"]})
                deleted += 1

    return deleted
