import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export function useToast(duration = 4000) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        clearTimeout(timerRef.current[id]);
        delete timerRef.current[id];
    }, []);

    const show = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = `${Date.now()}-${Math.random()}`;
            setToasts((prev) => [...prev, { id, message, type }]);
            timerRef.current[id] = setTimeout(() => dismiss(id), duration);
            return id;
        },
        [duration, dismiss]
    );

    const success = useCallback((msg: string) => show(msg, 'success'), [show]);
    const error = useCallback((msg: string) => show(msg, 'error'), [show]);
    const info = useCallback((msg: string) => show(msg, 'info'), [show]);
    const warning = useCallback((msg: string) => show(msg, 'warning'), [show]);

    return { toasts, show, success, error, info, warning, dismiss };
}
