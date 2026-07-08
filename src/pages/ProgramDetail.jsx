import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ChatPanel from '../components/ChatPanel';
import { useApp } from '../context/AppContext';
import { ddayInfo, daysUntil, formatWon, formatSupportAmount } from '../data/mockData';
import { spinnerStyle } from '../components/formStyles';

export default function ProgramDetail() {
  const { id } = useParams();
  const programId = decodeURIComponent(id);
  const navigate = useNavigate();
  const { matchResult, draftState, draftError, draftResult, effectResult, generateDraft } = useApp();

  const program = (matchResult?.programs || []).find((p) => p.program_id === programId);
  const factual = draftResult?.factual_data;
  const dd = ddayInfo(daysUntil(program?.deadline));

  // 초안 생성 전에는 매칭 결과 요약(program)에, 생성 후에는 마스터 테이블 재조회값(factual)에 실림
  const attachmentUrl = factual?.attachment_url || program?.attachment_url || '';
  const attachmentName = factual?.attachment_name || program?.attachment_name || '';
  // 원본 API가 첨부파일이 여러 개일 때 "@"로 이어붙여서 내려줌
  const attachments = (attachmentUrl ? attachmentUrl.split('@') : []).map((url, i) => ({
    url,
    name: attachmentName.split('@')[i] || `첨부파일 ${i + 1}`,
  }));

  if (!program) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopBar variant="full" />
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#6B6B6B' }}>공고 정보를 찾을 수 없습니다. 매칭 결과에서 다시 선택해주세요.</p>
          <button
            onClick={() => navigate('/results')}
            style={{ marginTop: '20px', background: '#171717', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            매칭 결과로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar variant="full" />
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, padding: '40px 48px 96px' }}>
          <span onClick={() => navigate('/results')} style={{ fontSize: '13px', color: '#9A9A9A', cursor: 'pointer', fontWeight: 500 }}>
            ← 매칭 결과로 돌아가기
          </span>

          <div style={{ marginTop: '20px', maxWidth: '760px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#9A9A9A', background: '#F2F2F2', padding: '4px 10px', borderRadius: '6px' }}>
                {program.support_type_name || '지원사업'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: dd.bg, color: dd.color }}>
                {dd.label}
              </span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 32px', lineHeight: 1.35 }}>{program.title}</h2>

            <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '32px', marginBottom: '36px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>사업 개요</div>
              <div style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '20px' }}>마스터 테이블 원본값 기준</div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '16px', columnGap: '12px', fontSize: '14px' }}>
                <div style={{ color: '#9A9A9A', fontWeight: 500 }}>지원대상</div>
                <div style={{ fontWeight: 600 }}>{factual?.support_target || '초안 생성 시 확인 가능'}</div>
                <div style={{ color: '#9A9A9A', fontWeight: 500 }}>지역요건</div>
                <div style={{ fontWeight: 600 }}>{factual?.area_name || program.area_name || '-'}</div>
                <div style={{ color: '#9A9A9A', fontWeight: 500 }}>지원금액</div>
                <div style={{ fontWeight: 600 }}>{factual?.support_scale || formatSupportAmount(program)}</div>
                <div style={{ color: '#9A9A9A', fontWeight: 500 }}>마감일</div>
                <div style={{ fontWeight: 600 }}>{program.deadline || '-'}</div>
              </div>
            </div>

            {attachments.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '24px', marginBottom: '36px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px' }}>공고 첨부파일</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {attachments.map((a) => (
                    <a
                      key={a.url}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#171717', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px', wordBreak: 'break-all' }}
                    >
                      {a.name}
                    </a>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: '#9A9A9A', margin: '14px 0 0' }}>
                  기업마당(bizinfo.go.kr) 원본 첨부파일로 연결됩니다.
                </p>
              </div>
            )}

            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>AI 초안 생성</div>
                {draftState === 'idle' && (
                  <button
                    onClick={generateDraft}
                    style={{ background: '#171717', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    초안 생성하기
                  </button>
                )}
                {draftState === 'error' && (
                  <button
                    onClick={generateDraft}
                    style={{ background: '#171717', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    다시 시도
                  </button>
                )}
              </div>

              {draftState === 'error' && (
                <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{draftError}</p>
              )}

              {draftState === 'loading' && (
                <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span style={spinnerStyle('14px', '#ECECEC', '#171717')} />
                    <span style={{ fontSize: '13px', color: '#6B6B6B', fontWeight: 500 }}>초안을 생성하는 중입니다...</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '12px', background: '#F0F0F0', borderRadius: '6px', width: '90%', animation: 'pulse 1.2s ease-in-out infinite' }} />
                    <div style={{ height: '12px', background: '#F0F0F0', borderRadius: '6px', width: '75%', animation: 'pulse 1.2s ease-in-out infinite' }} />
                    <div style={{ height: '12px', background: '#F0F0F0', borderRadius: '6px', width: '82%', animation: 'pulse 1.2s ease-in-out infinite' }} />
                  </div>
                </div>
              )}

              {draftState === 'done' && draftResult && (
                <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '32px' }}>
                  <div style={{ fontSize: '13px', lineHeight: 1.9, color: '#333', whiteSpace: 'pre-line', fontFamily: 'monospace' }}>{draftResult.draft_content}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '24px',
                      paddingTop: '20px',
                      borderTop: '1px solid #F0F0F0',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#9A9A9A' }}>표시된 숫자는 마스터 테이블 재조회 값입니다.</span>
                    <span style={{ fontSize: '11px', color: '#9A9A9A' }}>저장 위치: {draftResult.s3_key}</span>
                  </div>
                </div>
              )}
            </div>

            {effectResult && !effectResult.error && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em' }}>{formatWon(effectResult.expected_revenue_increase)}</div>
                    <div style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>예상 매출 증가</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em' }}>{effectResult.expected_job_creation}명</div>
                    <div style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>예상 고용 창출</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em' }}>{formatWon(effectResult.expected_net_profit)}</div>
                    <div style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>예상 순이익(연)</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em' }}>{effectResult.payback_period_years}년</div>
                    <div style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>투자 회수 기간</div>
                  </div>
                </div>
                {effectResult.explanation && (
                  <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '36px' }}>{effectResult.explanation}</p>
                )}
              </>
            )}

            <div
              onClick={() => navigate('/dashboard')}
              style={{ display: 'inline-block', fontSize: '14px', fontWeight: 700, color: '#171717', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              대시보드에서 자세히 보기 →
            </div>
          </div>
        </div>

        <ChatPanel />
      </div>
    </div>
  );
}
