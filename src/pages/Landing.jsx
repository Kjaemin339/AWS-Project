import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { title: '맞춤 매칭', desc: '기업 정보 기반으로 지원사업을 자동으로 찾아드립니다', shape: '50%' },
  { title: 'AI 초안 자동 생성', desc: '신청 서류 초안을 AI가 미리 작성해드립니다', shape: '4px' },
  { title: '예상 효과 확인', desc: '매출·고용 등 예상 효과를 미리 확인하세요', shape: '2px' },
];

export default function Landing() {
  const navigate = useNavigate();
  const goProfile = () => navigate('/login');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#171717' }} />
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>기업맞손</span>
        </div>
        <span onClick={goProfile} style={{ fontSize: '14px', color: '#6B6B6B', cursor: 'pointer', fontWeight: 500, transition: 'color 150ms' }}>
          로그인
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '96px 24px 64px' }}>
        <h1 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 16px', maxWidth: '680px', lineHeight: 1.3 }}>
          정부지원사업 매칭을
          <br />
          쉽고 빠르게, 기업맞손
        </h1>
        <p style={{ fontSize: '17px', color: '#6B6B6B', margin: '0 0 40px', maxWidth: '480px', lineHeight: 1.6, fontWeight: 400 }}>
          경상북도 제조·전자 중소기업을 위한 맞춤 지원사업 매칭 서비스. 기업 정보를 입력하면 AI가 딱 맞는 지원사업을 찾고, 신청 초안까지
          자동으로 작성해드립니다.
        </p>
        <button
          onClick={goProfile}
          style={{
            background: '#171717',
            color: '#fff',
            border: 'none',
            padding: '16px 42px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 150ms, transform 150ms',
          }}
        >
          시작하기
        </button>

        <div style={{ display: 'flex', gap: '56px', marginTop: '120px', maxWidth: '920px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <div style={{ width: '16px', height: '16px', background: '#171717', borderRadius: f.shape }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</div>
              <div style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 24px', textAlign: 'center', borderTop: '1px solid #ECECEC' }}>
        <span style={{ fontSize: '12px', color: '#9A9A9A' }}>© 2026 기업맞손. All rights reserved.</span>
      </div>
    </div>
  );
}
