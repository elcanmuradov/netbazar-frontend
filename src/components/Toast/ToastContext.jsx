import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle size={18} className="toast-icon" />,
    error:   <XCircle    size={18} className="toast-icon" />,
    warning: <AlertTriangle size={18} className="toast-icon" />,
    info:    <Info       size={18} className="toast-icon" />,
};

const TITLES = {
    success: 'Uğurlu',
    error:   'Xəta',
    warning: 'Diqqət',
    info:    'Məlumat',
};

const DURATION = 3800; // ms

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const remove = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
    }, []);

    const toast = useCallback((message, type = 'info', title) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type, title: title || TITLES[type], removing: false }]);
        setTimeout(() => remove(id), DURATION);
        return id;
    }, [remove]);

    // Convenience methods
    toast.success = (msg, title) => toast(msg, 'success', title);
    toast.error   = (msg, title) => toast(msg, 'error',   title);
    toast.warning = (msg, title) => toast(msg, 'warning', title);
    toast.info    = (msg, title) => toast(msg, 'info',    title);

    // Global alert override
    React.useEffect(() => {
        window.alert = (message) => {
            // Determine type based on common keywords
            const msg = String(message).toLowerCase();
            if (msg.includes('xəta') || msg.includes('error') || msg.includes('uğursuz') || msg.includes('yanlış')) {
                toast.error(message);
            } else if (msg.includes('uğur') || msg.includes('success') || msg.includes('təbriklər') || msg.includes('qəbul')) {
                toast.success(message);
            } else {
                toast.info(message);
            }
        };
    }, [toast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type} ${t.removing ? 'removing' : ''}`}>
                        {ICONS[t.type]}
                        <div className="toast-body">
                            <div className="toast-title">{t.title}</div>
                            {t.message && <div className="toast-message">{t.message}</div>}
                        </div>
                        <button className="toast-close" onClick={() => remove(t.id)}>
                            <X size={14} />
                        </button>
                        <div
                            className="toast-progress"
                            style={{ animationDuration: `${DURATION}ms` }}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};
