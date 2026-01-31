import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react';

// Button
export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'glass' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
}

// Card
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

// Input
export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    errorMessage?: string;
}

// Toast
export interface ToastConfig {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top' | 'center' | 'bottom';
}
