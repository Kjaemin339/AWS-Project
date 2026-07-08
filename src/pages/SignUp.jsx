import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, confirmSignUp, resendConfirmationCode } from '../auth/cognito';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #DDDDDD',
  borderRadius: '10px',
  fontSize: '14px',
  fontFamily: 'inherit',
};

const primaryButtonStyle = (disabled) => ({
  width: '100%',
  marginTop: '28px',
  background: '#171717',
  color: '#fff',
  border: 'none',
  padding: '14px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.7 : 1,
});

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // form | confirm
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validatePassword(pw) {
    if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다';
    if (!/[A-Z]/.test(pw)) return '대문자를 1개 이상 포함해주세요';
    if (!/[a-z]/.test(pw)) return '소문자를 1개 이상 포함해주세요';
    if (!/[0-9]/.test(pw)) return '숫자를 1개 이상 포함해주세요';
    return '';
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, name);
      setStep('confirm');
      setNotice('입력하신 이메일로 인증코드를 보냈습니다.');
    } catch (e) {
      setError(e.message || '회원가입에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await confirmSignUp(email, code);
      navigate('/login', { state: { justSignedUp: true } });
    } catch (e) {
      setError(e.message || '인증코드 확인에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError('');
    setNotice('');
    try {
      await resendConfirmationCode(email);
      setNotice('인증코드를 다시 보냈습니다.');
    } catch (e) {
      setError(e.message || '인증코드 재전송에 실패했습니다');
    }
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
        <div
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
          {step === 'form' ? (
            <form onSubmit={handleSubmitForm}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.01em' }}>회원가입</h2>
              <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px' }}>기업맞손 계정을 새로 만드세요</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>이름</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="담당자명" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>이메일</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.kr" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>비밀번호</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상, 대소문자+숫자 포함" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>비밀번호 확인</label>
                  <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" required style={inputStyle} />
                </div>
              </div>

              {error && <div style={{ marginTop: '16px', fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{error}</div>}

              <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
                {submitting ? '처리 중...' : '회원가입'}
              </button>

              <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', marginTop: '20px' }}>
                이미 계정이 있으신가요?{' '}
                <span onClick={() => navigate('/login')} style={{ color: '#171717', fontWeight: 600, cursor: 'pointer' }}>
                  로그인
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleConfirm}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.01em' }}>이메일 인증</h2>
              <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px' }}>
                <strong>{email}</strong>로 전송된 인증코드를 입력하세요
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>인증코드</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6자리 코드" required style={inputStyle} />
              </div>

              {notice && <div style={{ marginTop: '16px', fontSize: '13px', color: '#3B8A4E', fontWeight: 500 }}>{notice}</div>}
              {error && <div style={{ marginTop: '16px', fontSize: '13px', color: '#C0392B', fontWeight: 500 }}>{error}</div>}

              <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
                {submitting ? '확인 중...' : '인증 완료'}
              </button>

              <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', marginTop: '20px' }}>
                코드를 받지 못하셨나요?{' '}
                <span onClick={handleResend} style={{ color: '#171717', fontWeight: 600, cursor: 'pointer' }}>
                  재전송
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
