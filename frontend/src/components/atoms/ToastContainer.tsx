import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast } from '../../hooks/useToast';

const CONFIG = {
    success: {
        bg: '#f0fdf4',
        border: '#bbf7d0',
        text: '#166534',
        Icon: CheckCircle,
        iconColor: '#16a34a',
    },
    error: {
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#991b1b',
        Icon: XCircle,
        iconColor: '#dc2626',
    },
    warning: {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#92400e',
        Icon: AlertCircle,
        iconColor: '#d97706',
    },
    info: {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#1e40af',
        Icon: Info,
        iconColor: '#2563eb',
    },
};

interface Props {
    toasts: Toast[];
    dismiss: (id: string) => void;
}

const ToastContainer: React.FC<Props> = ({ toasts, dismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxWidth: 380,
                width: '100%',
            }}
        >
            {toasts.map((toast) => {
                const cfg = CONFIG[toast.type];
                const { Icon } = cfg;
                return (
                    <div
                        key={toast.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '12px 16px',
                            backgroundColor: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: 12,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                            color: cfg.text,
                            fontSize: 14,
                            fontWeight: 500,
                            animation: 'slideIn 0.2s ease',
                        }}
                    >
                        <Icon size={18} color={cfg.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                color: cfg.text,
                                opacity: 0.6,
                                flexShrink: 0,
                            }}
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
            <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
        </div>
    );
};

export default ToastContainer;
