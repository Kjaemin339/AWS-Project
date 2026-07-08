# CLAUDE.md — 기업맞손 프로젝트 (Phase 1~5 담당)

## 프로젝트
경북 제조·전자 기업 지원사업 매칭 플랫폼 "기업맞손". 전체 스펙:
- `최종_기획서_v2.4.md` (기획/비즈니스 로직)
- `최종_개발_스펙_v2.4.md` (아키텍처/Phase별 작업, v2.4)
- `기업맞손_아키텍처.png` (AWS 아키텍처 다이어그램)

이 세션에서는 **Phase 1~5(보안기반/데이터계층/수집파이프라인/백엔드오케스트레이션/인증&API)**만 담당한다. Phase 6~8(프론트/엣지보안/모니터링)은 팀원 담당이므로 임의로 손대지 않는다.

## 절대 규칙 (위반 금지, 괄호는 개발 스펙 조항)

1. **DynamoDB 공고 마스터 테이블 PK(`program_id`)는 String 타입**. API 수집분(`pblancSeq`)도 숫자를 문자열로 변환해서 저장. 수동확보 폴백 5건은 `"MANUAL-001"`~`"MANUAL-005"` (1-13, 7-3).
2. `areaCd`/`emplyCntCd`/`ablbizCd`/`needCrtfnCd`/`salsAmtCd`는 `|` 구분 다중값 가능 → 항상 split 후 비교 (1-7).
3. `search_programs`/`verify_certifications`/`generate_draft`/`calc_expected_effect`는 API Gateway 라우팅에서 **직접 함수 호출**, `Agent.invoke()` 쓰지 않음. 이 4개만 이렇게 하고, 챗봇용 3개(`get_matched_programs`/`explain_program`/`revise_draft`)만 Strands Agent가 자체 선택 (1-8).
4. KB 검색은 `program_id`를 메타데이터로 색인해두고, Retrieve API 호출 시 `filter`로 1단계 통과 후보만 실제로 좁힌다 (1-14). "KB에서 다 받아온 뒤 교집합" 방식 금지. **이 항목은 다른 Phase보다 자연어 프롬프트 한 번으로 시키지 말 것** — 파라미터가 많아 메타데이터 필드가 통째로 빠진 채 KB가 만들어지기 쉬움. ① 메타데이터 사이드카(`.metadata.json`) 구조 확인 → ② KB 생성 → ③ 더미 program_id 1~2개로 filter가 실제로 검색범위를 좁히는지 테스트, 이렇게 3단계로 나눠서 각 단계마다 결과를 확인받고 다음으로 진행.
5. `verify_certifications`의 429 재시도는 **최대 1회, `retryAfterSeconds` 5초 이하일 때만**, 초과 시 포기하고 다음 단계 진행 (1-15) — `/profile` 체인이 API Gateway 29초 제한을 넘지 않게 하기 위함.
6. 외부 API(`token`, `bizno`)는 CloudWatch 로그에 평문 노출 금지, Secrets Manager 조회는 Lambda 전역변수에 TTL 캐싱 (1-16).
7. `generate_draft`는 마스터 테이블의 지원대상/지역/금액/마감일/신청링크를 LLM이 재생성하지 않고 그대로 삽입. LLM은 사업개요/신청사유/근거 문장만 생성 (1-4, 1-11).
8. `calc_expected_effect`는 `program_id` 입력만 받아 마스터 테이블에서 금액 조회 (금액을 파라미터로 직접 안 받음), 회수기간은 지원금액과 무관한 비율 지표이므로 **예상순이익(절대값)을 항상 같이 반환** (1-5).
9. 매칭 1단계 하드필터는 업종(`induty`)도 포함 (완화매칭), 지역(`areaCd` 4700/1000)/근로자수/업력/마감일과 함께 5개 전부 체크 (1-7).

## AWS MCP 작업 원칙

- 리소스 생성 전에 **항상 먼저 존재 여부를 조회**하고, 있으면 재사용/스킵. 중복 생성 금지.
- 모든 리소스 이름은 `gbmatch-` 접두사로 통일 (팀 계정 안에서 다른 프로젝트와 구분).
- IAM 정책은 Phase 1에서는 리소스ARN을 `gbmatch-*`로 한정한 느슨한 정책, Phase 5에서 최소권한으로 재작성 (1-1). 지금 단계에서 와일드카드 액션(`*:*`) 쓰지 않기.
- 큰 작업(Phase 단위) 시작 전에는 plan을 먼저 설명받고 확인 후 실행.
- 매 Phase 완료 시 무엇을 만들었는지(리소스 이름, ARN, 완료기준 충족 여부) 요약해서 알려줄 것.

## 진행 순서 (혼자 Phase 1~5 할 때 권장)

1. Phase 1 + 2 동시 (IAM/KMS/Secrets Manager 껍데기 + DynamoDB 2개 + S3 3개 + 폴백 5건 적재)
2. Phase 4 먼저 착수 (폴백 5건만으로 도구 7개 로직 개발, API 연동 여부 무관)
3. API(공고민간연계/증명서) 승인되면 Phase 3 끼워넣기
4. Phase 5 (Cognito/API Gateway) — 요청/응답 JSON 스펙은 최대한 빨리 확정해서 프론트 팀원에게 공유
