export const INDUSTRIES = ['전자부품 제조업', '기계·금속 가공업', '자동차부품 제조업', '섬유·소재업', '정보통신업', '기타 제조업'];
export const REGIONS = ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'];
export const WORKER_COUNTS = ['1~5명 미만', '5~10명', '10~20명', '20~50명', '50~100명', '100명 이상'];
export const YEARS_OPTIONS = ['3년 미만', '3~5년', '5~7년', '7~10년', '10~20년', '20년 이상'];
export const SUPPORT_FIELDS = ['R&D', '시설·장비투자', '인력양성', '수출·판로', '자금·보증'];
export const CERT_NAMES = ['이노비즈 확인서', '벤처기업 확인서', '메인비즈 확인서'];

// 대시보드 데모용 정적 데이터: 백엔드에 집계/추이 API가 없어 실데이터로 대체 불가
export const PROGRAMS = [
  {
    id: 'p1',
    shortTitle: '스마트공장 보급확산',
    title: '2026년 경북 스마트공장 보급확산 지원사업',
    category: '시설·장비투자',
    rationale: '경산 소재 제조업 중 근로자 10~20명 규모 업체로 확인되어, 스마트공장 구축 지원 조건에 부합합니다.',
    deadlineDays: 7,
    deadlineDate: '2026.07.14',
    targetAudience: '상시근로자 50인 미만 제조업체',
    regionRequirement: '경상북도 소재 사업장',
    supportAmount: '최대 6,000만원 (자부담 50%)',
    impactRevenue: '+12%',
    impactJobs: '+1명',
    impactPayback: '8개월',
    trend: [4, 7, 10, 12],
  },
  {
    id: 'p2',
    shortTitle: '기술혁신개발(R&D)',
    title: '경북 중소기업 기술혁신개발사업(R&D)',
    category: 'R&D',
    rationale: '전자부품 제조업 등록 이력과 업력 5~7년 조건이 일치하며, 최근 3년 내 R&D 수혜 이력이 없어 신규 지원 우선순위군에 해당합니다.',
    deadlineDays: 14,
    deadlineDate: '2026.07.21',
    targetAudience: '업력 10년 이하 제조 중소기업',
    regionRequirement: '경상북도 전역',
    supportAmount: '최대 2억원 (정부지원 75%)',
    impactRevenue: '+24%',
    impactJobs: '+3명',
    impactPayback: '14개월',
    trend: [6, 13, 19, 24],
  },
  {
    id: 'p3',
    shortTitle: '예비창업패키지',
    title: '경북 예비창업패키지 모집',
    category: '자금·보증',
    rationale: '예비창업 여부 및 희망 지원분야(자금·보증) 응답이 프로그램 지원 조건과 일치합니다.',
    deadlineDays: 3,
    deadlineDate: '2026.07.10',
    targetAudience: '예비창업자 및 창업 3년 이내',
    regionRequirement: '경상북도 거주·소재 예정자',
    supportAmount: '사업화자금 최대 1억원',
    impactRevenue: '+18%',
    impactJobs: '+2명',
    impactPayback: '11개월',
    trend: [5, 10, 14, 18],
  },
  {
    id: 'p4',
    shortTitle: '수출바우처',
    title: '경북 수출바우처 지원사업',
    category: '수출·판로',
    rationale: '희망 지원분야에 수출·판로가 포함되어 있으며, 근로자수·업력 조건이 지원 상한 기준 이내로 확인됩니다.',
    deadlineDays: 21,
    deadlineDate: '2026.07.28',
    targetAudience: '수출 실적 10만불 이하 중소기업',
    regionRequirement: '경상북도 전역',
    supportAmount: '바우처 최대 3,000만원',
    impactRevenue: '+9%',
    impactJobs: '+1명',
    impactPayback: '10개월',
    trend: [2, 5, 7, 9],
  },
  {
    id: 'p5',
    shortTitle: '제조인력양성',
    title: '경북 제조업 재직자 인력양성 사업',
    category: '인력양성',
    rationale: '제조업 업종과 근로자수 20~50명 구간이 인력양성 프로그램 지원 대상 조건에 해당합니다.',
    deadlineDays: 30,
    deadlineDate: '2026.08.06',
    targetAudience: '제조업 재직자 보유 중소기업',
    regionRequirement: '경상북도 소재 사업장',
    supportAmount: '1인당 최대 200만원',
    impactRevenue: '+15%',
    impactJobs: '+2명',
    impactPayback: '12개월',
    trend: [3, 8, 11, 15],
  },
];

export const CATEGORY_DIST = [
  { label: '시설·장비투자', pct: 28, color: '#171717' },
  { label: 'R&D', pct: 24, color: '#4B4B4B' },
  { label: '인력양성', pct: 20, color: '#8A8A8A' },
  { label: '수출·판로', pct: 16, color: '#B7B7B7' },
  { label: '자금·보증', pct: 12, color: '#DDDDDD' },
];

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
