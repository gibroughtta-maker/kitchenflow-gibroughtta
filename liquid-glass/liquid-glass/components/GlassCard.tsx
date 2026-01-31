import React, { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import { GlassCardProps } from '../types';

export const GlassCard: React.FC<GlassCardProps> = ({
    hoverable = false,
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                'glass-effect rounded-xl overflow-hidden',
                hoverable && 'glass-hover cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const GlassCardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('flex flex-col space-y-1.5 p-6 glass-content', className)}
            {...props}
        >
            {children}
        </div>
    );
};

export const GlassCardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    children,
    ...props
}) => {
    return (
        <h3
            className={cn('text-xl font-semibold leading-none tracking-tight', className)}
            {...props}
        >
            {children}
        </h3>
    );
};

export const GlassCardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
    className,
    children,
    ...props
}) => {
    return (
        <p
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        >
            {children}
        </p>
    );
};

export const GlassCardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('p-6 pt-0 glass-content', className)}
            {...props}
        >
            {children}
        </div>
    );
};

export const GlassCardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn('flex items-center p-6 pt-0 glass-content', className)}
            {...props}
        >
            {children}
        </div>
    );
};
