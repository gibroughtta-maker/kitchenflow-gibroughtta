import React from 'react';
import { cn } from '../utils/cn';
import { GlassButtonProps } from '../types';

export const GlassButton: React.FC<GlassButtonProps> = ({
    variant = 'default',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    className,
    children,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 glass-active focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        default: 'glass-effect glass-button-effect bg-primary text-primary-foreground hover:scale-[1.02] hover:-translate-y-0.5',
        glass: 'glass-effect glass-hover text-foreground',
        outline: 'glass-effect border-2 glass-hover text-foreground',
        ghost: 'hover:glass-effect hover:text-accent-foreground',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm h-8',
        md: 'px-4 py-2 text-base h-10',
        lg: 'px-6 py-3 text-lg h-12',
    };

    return (
        <button
            className={cn(
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {loading && (
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-glass-spin" />
                )}
                {!loading && icon && icon}
                {children}
            </span>
        </button>
    );
};
