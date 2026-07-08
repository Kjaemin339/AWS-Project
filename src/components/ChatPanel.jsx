import { useApp } from '../context/AppContext';
import { spinnerStyle } from './formStyles';

export default function ChatPanel() {
  const { chatCollapsed, toggleChatCollapse, chatMessages, chatInput, setChatInput, chatLoading, sendChatMessage } = useApp();
  const expanded = !chatCollapsed;

  return (
    <div
      style={{
        width: '340px',
        minWidth: '340px',
        borderLeft: '1px solid #ECECEC',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        display: 'flex',
        flexDirection: 'column',
        background: '#FBFBFB',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: '1px solid #ECECEC',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>AI 상담</div>
          {expanded && <div style={{ fontSize: '11px', color: '#9A9A9A', marginTop: '2px' }}>자격 문의 · 초안 수정 요청</div>}
        </div>
        <span onClick={toggleChatCollapse} style={{ fontSize: '12px', color: '#9A9A9A', cursor: 'pointer', fontWeight: 600 }}>
          {chatCollapsed ? '펼치기' : '접기'}
        </span>
      </div>

      {expanded && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '80%',
                    background: m.from === 'user' ? '#171717' : '#F0F0F0',
                    color: m.from === 'user' ? '#fff' : '#333333',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#F0F0F0', padding: '10px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center' }}>
                  <span style={spinnerStyle('12px', '#DDDDDD', '#171717')} />
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid #ECECEC', display: 'flex', gap: '8px' }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="자격요건이나 초안 수정에 대해 물어보세요"
              disabled={chatLoading}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 12px',
                border: '1px solid #DDDDDD',
                borderRadius: '10px',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={sendChatMessage}
              disabled={chatLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#171717',
                border: 'none',
                cursor: chatLoading ? 'default' : 'pointer',
                opacity: chatLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderLeft: '8px solid #fff',
                  marginLeft: '2px',
                }}
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
