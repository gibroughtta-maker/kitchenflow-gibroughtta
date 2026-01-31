import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { cn } from '../utils/cn';
import { ToastConfig } from '../types';

interface ToastItem extends ToastConfig {
    id: string;
}

let toastContainer: HTMLDivElement | null = null;
let toastRoot: any = null;
let toasts: ToastItem[] = [];
let updateToasts: (() => void) | null = null;

const ToastContainer: React.FC = () => {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        updateToasts = () => setItems([...toasts]);
        return () => {
            updateToasts = null;
        };
    }, []);

    const removeToast = (id: string) => {
        toasts = toasts.filter((t) => t.id !== id);
        updateToasts?.();
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return null;
        }
    };

    const getTypeClasses = (type?: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400';
            case 'error':
                return 'bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400';
            case 'warning':
                return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
            case 'info':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400';
            default:
                return '';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {items.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'glass-effect rounded-lg px-4 py-3 shadow-lg',
                        'animate-glass-slide-up pointer-events-auto',
                        'max-w-sm',
                        getTypeClasses(toast.type)
                    )}
                >
                    <div className="flex items-center gap-3 glass-content">
                        {getIcon(toast.type) && (
                            <span className="text-xl flex-shrink-0">{getIcon(toast.type)}</span>
                        )}
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors glass-active"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ensureContainer = () => {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        document.body.appendChild(toastContainer);
        toastRoot = createRoot(toastContainer);
        toastRoot.render(<ToastContainer />);
    }
};

export const Toast = {
    show: (config: ToastConfig) => {
        ensureContainer();

        const id = Math.random().toString(36).slice(2);
        const duration = config.duration || 3000;

        const newToast: ToastItem = { ...config, id };
        toasts.push(newToast);
        updateToasts?.();

        setTimeout(() => {
            toasts = toasts.filter((t) => t.id !== id);
            updateToasts?.();
        }, duration);
    },

    success: (message: string, duration?: number) => {
        Toast.show({ message, type: 'success', duration });
    },

    error: (message: string, duration?: number) => {
        Toast.show({ message, type: 'error', duration });
    },

    warning: (message: string, duration?: number) => {
        Toast.show({ message, type: 'warning', duration });
    },

    info: (message: string, duration?: number) => {
        Toast.show({ message, type: 'info', duration });
    },
};
