import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SnackbarContext = createContext(null);

export function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState(null);
  const timeoutRef = useRef(null);

  const showSnackbar = useCallback((message, { actionLabel, onAction, duration = 4000 } = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSnackbar({ message, actionLabel, onAction });
    timeoutRef.current = setTimeout(() => setSnackbar(null), duration);
  }, []);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSnackbar(null);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, dismiss }}>
      {children}
      {snackbar && document.getElementById('app-overlay-root') && createPortal(
        <div
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)',
            background: '#1b3328', color: 'var(--paper)', padding: '13px 16px', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 16, fontSize: 13.5,
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)', border: '1px solid rgba(244,236,219,0.15)',
            maxWidth: '90vw', animation: 'fadeInUp 0.25s ease both',
          }}
        >
          <span>{snackbar.message}</span>
          {snackbar.actionLabel && (
            <button
              onClick={() => { snackbar.onAction?.(); dismiss(); }}
              style={{ background: 'none', border: 'none', color: '#e3b954', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', flexShrink: 0 }}
            >
              {snackbar.actionLabel}
            </button>
          )}
        </div>,
        document.getElementById('app-overlay-root')
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}
