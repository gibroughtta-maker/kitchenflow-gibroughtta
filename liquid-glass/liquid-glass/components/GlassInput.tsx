import React from 'react';
import { cn } from '../utils/cn';
import { GlassInputProps } from '../types';

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, type = 'text', error = false, errorMessage, ...props }, ref) => {
        return (
            <div className="w-full">
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full rounded-lg glass-effect px-4 py-2 text-sm',
                        'placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'glass-content',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && errorMessage && (
                    <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
                )}
            </div>
        );
    }
);

GlassInput.displayName = 'GlassInput';
