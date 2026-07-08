import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) navigate('/profile');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#171717' }} />
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>기업맞손</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: '400px',
            background: '#fff',
            border: '1px solid #ECECEC',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.01em' }}>로그인</h2>
          <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px' }}>기업맞손 계정으로 로그인하세요</p>

          {location.state?.justSignedUp && (
            <div style={{ marginBottom: '20px', fontSize: '13px', color: '#3B8A4E', fontWeight: 500 }}>
              가입이 완료됐습니다. 로그인해주세요.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.co.kr"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #DDDDDD',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #DDDDDD',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '16px', fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: '28px',
              background: '#171717',
              color: '#fff',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>

          <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', marginTop: '20px' }}>
            계정이 없으신가요?{' '}
            <span onClick={() => navigate('/signup')} style={{ color: '#171717', fontWeight: 600, cursor: 'pointer' }}>
              회원가입
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
