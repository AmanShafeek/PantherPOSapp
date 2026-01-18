import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-mac font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white active:scale-[0.98]';

        const variants = {
            primary: 'bg-mac-accent-emerald text-[#0a0d12] shadow-mac hover:bg-mac-accent-emerald/90 focus:ring-mac-accent-emerald/50 font-black',
            secondary: 'bg-[#1a1f29] text-mac-text-primary border border-mac-border shadow-sm hover:bg-[#232936] focus:ring-mac-accent-blue/50',
            danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 focus:ring-red-500/50',
            ghost: 'bg-transparent text-mac-text-secondary hover:bg-white/5 hover:text-mac-text-primary focus:ring-mac-accent-blue/50',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
        };

        return (
            <button
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
