import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext<any>(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={{ position: 'fixed', bottom: 40, right: 24, background: toast.type === 'success' ? '#4ade80' : '#f87171', color: '#fff', padding: 16, borderRadius: 8, zIndex: 9999 }}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
