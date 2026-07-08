import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ProfileForm from '../components/ProfileForm';
import { useApp } from '../context/AppContext';
import { submitButtonStyle, spinnerStyle } from '../components/formStyles';

export default function ProfileInput() {
  const { submitting, submitError, submitProfile } = useApp();
  const navigate = useNavigate();

  async function handleSubmit() {
    const ok = await submitProfile();
    if (ok) navigate('/results');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar variant="minimal" />
      <div
        style={{
          maxWidth: '640px',
          margin: '56px auto',
          background: '#fff',
          border: '1px solid #ECECEC',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.01em' }}>기업 프로필 입력</h2>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 36px' }}>몇 가지 정보만 알려주시면 맞춤 지원사업을 찾아드립니다</p>

        <ProfileForm />

        {submitError && (
          <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: 500, margin: '20px 0 0' }}>{submitError}</p>
        )}

        <button onClick={handleSubmit} style={submitButtonStyle(submitting)}>
          {submitting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={spinnerStyle('14px', 'rgba(255,255,255,0.35)', '#fff')} />
              매칭 중...
            </span>
          ) : (
            '매칭 결과 보기'
          )}
        </button>
      </div>
    </div>
  );
}
