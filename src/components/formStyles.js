export const chipStyle = (selected) => ({
  padding: '9px 16px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 150ms',
  border: '1px solid ' + (selected ? '#171717' : '#DDDDDD'),
  background: selected ? '#171717' : '#fff',
  color: selected ? '#fff' : '#171717',
});

export const radioStyle = (selected) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid ' + (selected ? '#171717' : '#DDDDDD'),
  background: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 150ms',
});

export const dotOuterStyle = (selected) => ({
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  border: '2px solid ' + (selected ? '#171717' : '#CCCCCC'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const dotInnerStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#171717',
};

export const preStartupBoxStyle = (selected) => ({
  width: '20px',
  height: '20px',
  borderRadius: '6px',
  border: '2px solid ' + (selected ? '#171717' : '#CCCCCC'),
  background: selected ? '#171717' : '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const certBadgeStyle = (held) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 600,
  background: held ? '#EEF6EF' : '#F2F2F2',
  color: held ? '#2E7D42' : '#9A9A9A',
});

export const matchToggleStyle = (active) => ({
  padding: '6px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms',
  background: active ? '#171717' : 'transparent',
  color: active ? '#fff' : '#6B6B6B',
});

export const tabStyle = (active) => ({
  padding: '12px 20px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms',
  background: active ? '#F2F2F2' : 'transparent',
  color: active ? '#171717' : '#6B6B6B',
});

export const announcementChipStyle = (selected) => ({
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms',
  border: '1px solid ' + (selected ? '#171717' : '#DDDDDD'),
  background: selected ? '#171717' : '#fff',
  color: selected ? '#fff' : '#5A5A5A',
});

export const submitButtonStyle = (submitting) => ({
  width: '100%',
  marginTop: '36px',
  background: '#171717',
  color: '#fff',
  border: 'none',
  padding: '16px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: submitting ? 'default' : 'pointer',
  opacity: submitting ? 0.7 : 1,
});

export const spinnerStyle = (size, borderColor, topColor) => ({
  width: size,
  height: size,
  border: '2px solid ' + borderColor,
  borderTopColor: topColor,
  borderRadius: '50%',
  display: 'inline-block',
  animation: 'spin 0.8s linear infinite',
});
