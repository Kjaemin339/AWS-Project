import { createContext, useContext, useState } from 'react';
import { apiPost } from '../api/client';
import { useAuth } from './AuthContext';
import { EMPLOYEE_COUNT_CODES, BUSINESS_AGE_CODES, SALES_AMOUNT_CODES, FIXED_AREA_CODE } from '../config';

const AppContext = createContext(null);

const initialProfile = {
  companyName: '',
  industry: '',
  workerCount: '',
  locationDetail: '',
  years: '',
  preStartup: false,
  supportFields: [],
  salesAmount: '',
  bizRegNumber: '',
};

function toApiProfile(profile) {
  return {
    area_code: FIXED_AREA_CODE,
    employee_count_code: EMPLOYEE_COUNT_CODES[profile.workerCount] || '',
    business_age_code: profile.preStartup ? '' : BUSINESS_AGE_CODES[profile.years] || '',
    induty: profile.industry,
    preliminary_startup_yn: profile.preStartup ? 'Y' : 'N',
    desired_support: profile.supportFields.join(', '),
    company_name: profile.companyName,
    location_detail: profile.locationDetail,
    sales_amount_code: SALES_AMOUNT_CODES[profile.salesAmount] || '',
  };
}

export function AppProvider({ children }) {
  const { idToken } = useAuth();

  const [profile, setProfile] = useState(initialProfile);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [matchResult, setMatchResult] = useState(null); // /profile 응답의 matching
  const [certResult, setCertResult] = useState(null); // /profile 응답의 certifications
  const [sessionTs, setSessionTs] = useState(null); // 매칭이력 세션 키 (스펙 1-12)

  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [draftState, setDraftState] = useState('idle'); // idle | loading | done | error
  const [draftResult, setDraftResult] = useState(null); // /draft 응답의 draft
  const [effectResult, setEffectResult] = useState(null); // /draft 응답의 expected_effect
  const [draftError, setDraftError] = useState('');

  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: 'assistant', text: '안녕하세요! 이 사업에 대한 지원자격이나 초안 수정 요청을 편하게 물어보세요.' },
  ]);

  const [dashboardSelectedId, setDashboardSelectedId] = useState(null);
  const [dashboardHighlightId, setDashboardHighlightId] = useState(null);

  const [myPageTab, setMyPageTab] = useState('profile');
  const [savedToast, setSavedToast] = useState(false);
  const [historyList, setHistoryList] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  function updateProfile(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  function toggleSupportField(field) {
    setProfile((p) => {
      const has = p.supportFields.includes(field);
      const next = has ? p.supportFields.filter((f) => f !== field) : [...p.supportFields, field];
      return { ...p, supportFields: next };
    });
  }

  function togglePreStartup() {
    // 예비창업 체크 시 업력 입력은 비활성화(스펙 6-1)
    setProfile((p) => ({ ...p, preStartup: !p.preStartup, years: p.preStartup ? p.years : '' }));
  }

  function setBizRegNumber(val) {
    updateProfile('bizRegNumber', val);
  }

  async function submitProfile() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const body = { profile: toApiProfile(profile) };
      if (profile.bizRegNumber.trim()) body.bizno = profile.bizRegNumber.trim();
      const res = await apiPost('/profile', body, idToken);
      setMatchResult(res.matching || null);
      setCertResult(res.certifications || null);
      setSessionTs(res.session_ts || null);
      return true;
    } catch (e) {
      setSubmitError(e.message || '매칭 요청에 실패했습니다');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  function openProgram(programId) {
    // 이미 선택돼 있고 초안이 로드된 상태(예: 이력 재현 직후)라면 그대로 유지
    if (programId === selectedProgramId && draftState !== 'idle') return;
    setSelectedProgramId(programId);
    setDraftState('idle');
    setDraftResult(null);
    setEffectResult(null);
    setDraftError('');
  }

  async function generateDraft() {
    if (!selectedProgramId) return;
    setDraftState('loading');
    setDraftError('');
    try {
      const body = {
        program_id: selectedProgramId,
        profile: toApiProfile(profile),
        session_ts: sessionTs,
        certifications: certResult?.certifications || null,
      };
      const res = await apiPost('/draft', body, idToken);
      if (res.draft && res.draft.error) throw new Error(res.draft.error);
      setDraftResult(res.draft);
      setEffectResult(res.expected_effect);
      setDraftState('done');
    } catch (e) {
      setDraftError(e.message || '초안 생성에 실패했습니다');
      setDraftState('error');
    }
  }

  function goDashboardFromDetail() {
    setDashboardHighlightId(selectedProgramId);
    setDashboardSelectedId(selectedProgramId);
  }

  function selectDashboardAnnouncement(id) {
    setDashboardSelectedId(id);
    setDashboardHighlightId(null);
  }

  function toggleChatCollapse() {
    setChatCollapsed((c) => !c);
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatMessages((msgs) => [...msgs, { from: 'user', text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const body = { message: text };
      if (selectedProgramId) body.program_id = selectedProgramId;
      if (draftResult?.s3_key) body.s3_key = draftResult.s3_key;
      const res = await apiPost('/chat', body, idToken);
      setChatMessages((msgs) => [...msgs, { from: 'assistant', text: res.reply || '응답을 받지 못했습니다.' }]);
      // revise_draft로 라우팅된 경우, 화면에 표시 중인 초안도 갱신
      if (res.revised_content) {
        setDraftResult((d) => (d ? { ...d, draft_content: res.revised_content, s3_key: res.revised_key } : d));
      }
    } catch (e) {
      setChatMessages((msgs) => [...msgs, { from: 'assistant', text: '죄송합니다, 오류가 발생했습니다: ' + e.message }]);
    } finally {
      setChatLoading(false);
    }
  }

  function saveProfile() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await apiPost('/chat', { action: 'get_matched_programs' }, idToken);
      setHistoryList(res.history || []);
    } catch (e) {
      setHistoryError(e.message || '이력을 불러오지 못했습니다');
    } finally {
      setHistoryLoading(false);
    }
  }

  // 이력의 한 세션을 그대로 재현 (스펙: 매칭결과·초안·기대효과를 다시 확인)
  function replaySession(item) {
    const programs = item.matched_programs || [];
    setMatchResult({ matched: programs.length > 0, programs, candidate_program_ids: [], rationale: '' });
    setCertResult(item.company_info?.certifications ? { certifications: item.company_info.certifications } : null);
    setSessionTs(item.ts);
    if (item.draft_text) {
      setDraftResult({ draft_content: item.draft_text, s3_key: item.draft_s3_key });
      setEffectResult(item.expected_effect || null);
      setDraftState('done');
    } else {
      setDraftResult(null);
      setEffectResult(null);
      setDraftState('idle');
    }
    setSelectedProgramId(programs[0]?.program_id || null);
  }

  const value = {
    profile,
    updateProfile,
    toggleSupportField,
    togglePreStartup,
    setBizRegNumber,

    submitting,
    submitError,
    submitProfile,
    matchResult,
    certResult,
    sessionTs,

    selectedProgramId,
    openProgram,
    draftState,
    draftError,
    draftResult,
    effectResult,
    generateDraft,

    chatCollapsed,
    toggleChatCollapse,
    chatInput,
    setChatInput,
    chatMessages,
    chatLoading,
    sendChatMessage,

    dashboardSelectedId,
    dashboardHighlightId,
    goDashboardFromDetail,
    selectDashboardAnnouncement,

    myPageTab,
    setMyPageTab,
    savedToast,
    saveProfile,
    historyList,
    historyLoading,
    historyError,
    loadHistory,
    replaySession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
