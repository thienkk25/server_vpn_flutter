import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{
                        padding: '12px 20px',
                        borderRadius: '12px',
                        background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
                            toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                                'rgba(59, 130, 246, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        transition: 'all 0.3s ease',
                        animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        {toast.type === 'success' && <span style={{ fontSize: '18px' }}>✓</span>}
                        {toast.type === 'error' && <span style={{ fontSize: '18px' }}>✕</span>}
                        {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ</span>}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
