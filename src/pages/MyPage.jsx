import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ProfileForm from '../components/ProfileForm';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { tabStyle, spinnerStyle } from '../components/formStyles';

const TABS = [
  { key: 'profile', label: '프로필 수정' },
  { key: 'history', label: '매칭 이력' },
  { key: 'account', label: '계정' },
];

export default function MyPage() {
  const {
    myPageTab, setMyPageTab, savedToast, saveProfile,
    historyList, historyLoading, historyError, loadHistory, replaySession,
  } = useApp();
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (myPageTab === 'history' && historyList === null) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPageTab]);

  function handleOpenHistory(item) {
    replaySession(item);
    navigate('/results');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar variant="full" />
      <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: '1040px', margin: '0 auto' }}>
        <div
          style={{
            width: '200px',
            flexShrink: 0,
            padding: '48px 16px 48px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            borderRight: '1px solid #ECECEC',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {TABS.map((t) => (
            <div key={t.key} onClick={() => setMyPageTab(t.key)} style={tabStyle(myPageTab === t.key)}>
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: '48px 40px', minWidth: 0 }}>
          {myPageTab === 'profile' && (
            <div style={{ maxWidth: '520px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 24px' }}>프로필 수정</h3>
              <ProfileForm idSuffix="2" />
              <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={saveProfile}
                  style={{ background: '#171717', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  변경사항 저장
                </button>
                {savedToast && <span style={{ fontSize: '13px', color: '#3B8A4E', fontWeight: 600 }}>저장되었습니다</span>}
              </div>
            </div>
          )}

          {myPageTab === 'history' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 24px' }}>매칭 이력</h3>

              {historyLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B6B6B', fontWeight: 500 }}>
                  <span style={spinnerStyle('13px', '#ECECEC', '#171717')} />
                  이력을 불러오는 중입니다...
                </div>
              )}

              {historyError && <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{historyError}</p>}

              {!historyLoading && !historyError && historyList && historyList.length === 0 && (
                <p style={{ fontSize: '14px', color: '#9A9A9A' }}>아직 매칭 이력이 없습니다. 프로필을 입력하면 여기에 기록됩니다.</p>
              )}

              {!historyLoading && historyList && historyList.length > 0 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#ECECEC', border: '1px solid #ECECEC', borderRadius: '12px', overflow: 'hidden' }}>
                    {historyList.map((h) => (
                      <div
                        key={h.ts}
                        onClick={() => handleOpenHistory(h)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '16px 20px', cursor: 'pointer', gap: '16px' }}
                      >
                        <span style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 500, width: '100px', flexShrink: 0 }}>{(h.ts || '').slice(0, 10)}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, minWidth: 0 }}>
                          {(h.matched_programs && h.matched_programs[0]?.title) || '매칭 결과 없음'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#5A5A5A', background: '#F2F2F2', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '14px' }}>행을 클릭하면 해당 세션의 매칭결과·초안·기대효과를 그대로 다시 확인할 수 있습니다</p>
                </>
              )}
            </div>
          )}

          {myPageTab === 'account' && (
            <div style={{ maxWidth: '420px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 24px' }}>계정</h3>
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 600, marginBottom: '6px' }}>이메일</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{email}</div>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                style={{ background: '#fff', border: '1px solid #DDDDDD', color: '#171717', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
