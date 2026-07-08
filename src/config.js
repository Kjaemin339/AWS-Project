export const AWS_REGION = 'us-east-1';
export const API_BASE_URL = 'https://xarluqwg64.execute-api.us-east-1.amazonaws.com/prod';
export const COGNITO_USER_POOL_ID = 'us-east-1_SPWkmH877';
export const COGNITO_CLIENT_ID = '3b6l1d2if080ir5ejur74ne6m5';

// 스펙 v2.4 6-1절: 근로자수/업력 구간 라벨 → 백엔드 코드값 매핑
export const EMPLOYEE_COUNT_CODES = {
  '1~5명 미만': 'EI01',
  '5~10명': 'EI02',
  '10~20명': 'EI03',
  '20~50명': 'EI04',
  '50~100명': 'EI05',
  '100명 이상': 'EI06',
};

export const BUSINESS_AGE_CODES = {
  '3년 미만': 'OI01',
  '3~5년': 'OI02',
  '5~7년': 'OI03',
  '7~10년': 'OI04',
  '10~20년': 'OI05',
  '20년 이상': 'OI06',
};

// 스펙 v2.4 6-1절: 매출액 구간 (선택 입력, 2단계 가산조건용) — 초안 프롬프트 보강에도 사용
export const SALES_AMOUNT_CODES = {
  '5억 미만': 'SI01',
  '5~10억': 'SI02',
  '10~20억': 'SI03',
  '20~50억': 'SI04',
  '50~100억': 'SI05',
  '100~300억': 'SI06',
  '300억 이상': 'SI07',
};

// 매칭 하드필터의 area_code는 경북(4700) 고정 — 시군 입력(location_detail)은 초안 프롬프트 등 표시/서술용
export const FIXED_AREA_CODE = '4700';
