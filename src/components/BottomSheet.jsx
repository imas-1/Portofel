export default function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 460, background: 'var(--paper)', color: 'var(--ink)',
          borderRadius: '22px 22px 0 0', padding: '12px 22px 26px', maxHeight: '88vh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 3, background: '#d9cba6', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 600, marginBottom: 16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
