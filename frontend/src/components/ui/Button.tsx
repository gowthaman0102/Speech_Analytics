import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, icon, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-[6px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary: 'bg-[--accent] text-white border-transparent hover:bg-[--accent-hover] shadow-none',
      secondary:
        'bg-[--surface] text-[--text] border-[--border-strong] hover:bg-[--surface-2] hover:border-[--border-strong]',
      tertiary:
        'bg-transparent text-[--text-muted] border-transparent hover:text-[--text] hover:bg-[--surface-2]',
      ghost:
        'bg-transparent text-[--text-muted] border-transparent hover:text-[--text] hover:bg-[--surface-2]',
      danger: 'bg-[--danger] text-white border-transparent hover:bg-[#8D2D23]',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-sm gap-2',
      lg: 'h-10 px-4 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
