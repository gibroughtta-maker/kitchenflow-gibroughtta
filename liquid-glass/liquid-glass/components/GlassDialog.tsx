import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

interface GlassDialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export const GlassDialog: React.FC<GlassDialogProps> = ({
    open,
    onClose,
    title,
    children,
    footer,
    className,
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open && !isVisible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
                    'transition-opacity duration-300',
                    open ? 'opacity-100' : 'opacity-0'
                )}
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
                {/* pointer-events-auto to enable clicks on the dialog content */}
                <div
                    className={cn(
                        'glass-effect glass-distortion rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto pointer-events-auto',
                        'transition-all duration-300',
                        open ? 'opacity-100 scale-100 animate-glass-scale-in' : 'opacity-0 scale-95',
                        className
                    )}
                >
                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between p-6 glass-content">
                            <h2 className="text-2xl font-bold">{title}</h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors glass-active"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 pt-0 glass-content">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex justify-end gap-3 p-6 pt-0 glass-content">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
