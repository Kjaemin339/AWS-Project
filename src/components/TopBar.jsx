import { useNavigate } from 'react-router-dom';

export default function TopBar({ variant = 'full' }) {
  const navigate = useNavigate();
  const isFull = variant !== 'minimal';

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        height: '64px',
        minHeight: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid #ECECEC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#171717', flexShrink: 0 }} />
        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: '#171717' }}>기업맞손</span>
      </div>
      {isFull && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span
            onClick={() => navigate('/dashboard')}
            style={{ fontSize: '14px', cursor: 'pointer', color: '#6B6B6B', fontWeight: 500, transition: 'color 150ms' }}
          >
            대시보드
          </span>
          <span
            onClick={() => navigate('/mypage')}
            style={{ fontSize: '14px', cursor: 'pointer', color: '#6B6B6B', fontWeight: 500, transition: 'color 150ms' }}
          >
            마이페이지
          </span>
        </div>
      )}
    </div>
  );
}
