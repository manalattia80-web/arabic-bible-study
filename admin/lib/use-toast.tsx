'use client';
import { useState, useCallback } from 'react';

export interface Toast {
  id:      string;
  type:    'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: Toast['type'], message: string, duration = 3500) => {
    const id = String(++toastId);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const success = useCallback((msg: string) => show('success', msg), [show]);
  const error   = useCallback((msg: string) => show('error',   msg), [show]);
  const info    = useCallback((msg: string) => show('info',    msg), [show]);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );

  return { success, error, info, ToastContainer };
}
