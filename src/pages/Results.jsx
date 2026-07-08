import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { ddayInfo, daysUntil, formatSupportAmount } from '../data/mockData';

export default function Results() {
  const { matchResult, certResult, openProgram } = useApp();
  const navigate = useNavigate();

  if (!matchResult) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopBar variant="full" />
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#6B6B6B' }}>매칭 결과가 없습니다. 프로필을 먼저 입력해주세요.</p>
          <button
            onClick={() => navigate('/profile')}
            style={{ marginTop: '20px', background: '#171717', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            프로필 입력하러 가기
          </button>
        </div>
      </div>
    );
  }

  function handleOpenProgram(programId) {
    openProgram(programId);
    navigate(`/programs/${encodeURIComponent(programId)}`);
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar variant="full" />
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 24px' }}>매칭 결과</h2>

        {certResult && certResult.certifications && certResult.certifications.length > 0 && (
          <div style={{ marginBottom: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {certResult.certifications.map((c) => (
              <div
                key={c.cert_code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: c.has_certification ? '#EEF6EF' : '#F2F2F2',
                  color: c.has_certification ? '#2E7D42' : '#9A9A9A',
                }}
              >
                {c.has_certification && <span style={{ fontWeight: 800 }}>✓</span>}
                {c.cert_name} 보유
              </div>
            ))}
          </div>
        )}

        {matchResult.matched ? (
          <div>
            <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 20px', fontWeight: 500 }}>
              총 <span style={{ color: '#171717', fontWeight: 700 }}>{matchResult.programs.length}건</span>의 지원사업이 매칭되었습니다
            </p>

            {matchResult.rationale && (
              <div
                style={{
                  marginBottom: '24px',
                  background: '#F7F7F7',
                  borderLeft: '3px solid #171717',
                  padding: '16px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#5A5A5A',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                }}
              >
                {matchResult.rationale}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matchResult.programs.map((p) => {
                const dd = ddayInfo(daysUntil(p.deadline));
                return (
                  <div
                    key={p.program_id}
                    onClick={() => handleOpenProgram(p.program_id)}
                    style={{
                      background: '#fff',
                      border: '1px solid #ECECEC',
                      borderRadius: '16px',
                      padding: '28px',
                      cursor: 'pointer',
                      transition: 'box-shadow 180ms, transform 180ms',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em' }}>{p.title}</div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                          background: dd.bg,
                          color: dd.color,
                        }}
                      >
                        {dd.label}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, background: '#F2F2F2', padding: '4px 10px', borderRadius: '6px' }}>
                          {p.support_type_name || '지원사업'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, background: '#F2F2F2', padding: '4px 10px', borderRadius: '6px' }}>
                          {p.area_name || '경북'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, background: '#F2F2F2', padding: '4px 10px', borderRadius: '6px' }}>
                          {formatSupportAmount(p)}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#171717' }}>자세히 보기 →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px 40px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#F0F0F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '28px',
              }}
            >
              <div style={{ width: '22px', height: '3px', background: '#9A9A9A', borderRadius: '2px' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px' }}>조건에 맞는 공고가 없습니다</h3>
            <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px', maxWidth: '400px', lineHeight: 1.6 }}>
              {matchResult.suggestion || '입력하신 조건을 완화하면 더 많은 지원사업을 찾을 수 있어요'}
            </p>
            {matchResult.failed_filters && matchResult.failed_filters.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '36px' }}>
                {matchResult.failed_filters.map((f) => (
                  <div
                    key={f}
                    style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', color: '#5A5A5A', fontWeight: 500 }}
                  >
                    {f} 조건 완화해보기
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/profile')}
              style={{ background: '#171717', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              조건 다시 입력하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
