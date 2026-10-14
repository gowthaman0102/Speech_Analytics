import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants = {
    default: 'bg-[--surface-2] text-[--text-muted]',
    neutral: 'bg-[--surface-2] text-[--text-muted]',
    accent: 'bg-[--accent-soft] text-[--accent]',
    success: 'bg-[--success-soft] text-[--success]',
    warning: 'bg-[--warning-soft] text-[--warning]',
    danger: 'bg-[--danger-soft] text-[--danger]',
    error: 'bg-[--danger-soft] text-[--danger]',
    info: 'bg-[--info-soft] text-[--info]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 leading-none',
    md: 'text-xs px-2.5 py-0.5 leading-tight',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
};
