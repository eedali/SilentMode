import { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const colors = {
        success: 'bg-green-600 border-green-500',
        error: 'bg-red-600 border-red-500',
        info: 'bg-blue-600 border-blue-500',
        warning: 'bg-yellow-600 border-yellow-500',
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };

    return (
        <div className={`fixed bottom-4 right-4 ${colors[type]} border-2 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-slide-up`}>
            <span className="text-2xl">{icons[type]}</span>
            <span className="font-medium">{message}</span>
            <button
                onClick={onClose}
                className="ml-4 text-white/80 hover:text-white text-xl"
            >
                ×
            </button>
        </div>
    );
};
