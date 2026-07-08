export const INDUSTRIES = ['전자부품 제조업', '기계·금속 가공업', '자동차부품 제조업', '섬유·소재업', '정보통신업', '기타 제조업'];
export const REGIONS = ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'];
export const WORKER_COUNTS = ['1~5명 미만', '5~10명', '10~20명', '20~50명', '50~100명', '100명 이상'];
export const YEARS_OPTIONS = ['3년 미만', '3~5년', '5~7년', '7~10년', '10~20년', '20년 이상'];
export const SALES_AMOUNT_OPTIONS = ['5억 미만', '5~10억', '10~20억', '20~50억', '50~100억', '100~300억', '300억 이상'];
export const SUPPORT_FIELDS = ['R&D', '시설·장비투자', '인력양성', '수출·판로', '자금·보증'];
export const CERT_NAMES = ['이노비즈 확인서', '벤처기업 확인서', '메인비즈 확인서'];

export function ddayInfo(days) {
  if (days <= 7) return { label: 'D-' + days, bg: '#FDEAEA', color: '#C0392B' };
  if (days <= 14) return { label: 'D-' + days, bg: '#FDF3DC', color: '#9C7A17' };
  return { label: 'D-' + days, bg: '#F0F0F0', color: '#6B6B6B' };
}

// 실제 API의 deadline은 "YYYY-MM-DD" 문자열로 오므로 D-day를 직접 계산
export function daysUntil(dateStr) {
  if (!dateStr) return 999;
  const deadline = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = deadline - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatWon(amount) {
  if (amount === null || amount === undefined || amount === '') return '-';
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return n.toLocaleString('ko-KR') + '원';
}

// 공고민간연계 API 수집분은 max_support_amount가 0/미제공인 경우가 많아,
// support_scale(지원규모 원문 텍스트)을 우선 사용하고 그마저 없으면 "0원" 대신 명확히 안내
export function formatSupportAmount(program) {
  if (program?.support_scale) return program.support_scale;
  if (program?.max_support_amount) return formatWon(program.max_support_amount);
  return '지원금액 정보 없음';
}

export function buildDraftText(program) {
  return (
    '1. 사업 개요\n' +
    program.title + '은(는) ' + program.targetAudience + '을 대상으로 하며, ' + program.regionRequirement +
    ' 조건에서 신청 가능합니다. 지원금액은 ' + program.supportAmount + ' 규모로 책정되어 있습니다.\n\n' +
    '2. 신청 배경 및 필요성\n귀사는 입력하신 기업 프로필 기준으로 본 사업의 핵심 지원 조건을 충족하는 것으로 확인되며, 사업 참여를 통해 ' +
    program.impactRevenue + ' 수준의 매출 성장과 ' + program.impactJobs + '의 신규 고용 창출이 기대됩니다.\n\n' +
    '3. 사업 추진 계획\n선정 이후 3개월 이내 세부 실행계획을 수립하고, ' + program.deadlineDate + '까지 관련 증빙 서류를 구비하여 신청을 완료할 예정입니다.'
  );
}
