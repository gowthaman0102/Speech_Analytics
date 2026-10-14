import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full select-none';

  const variants = {
    default: 'bg-surface-2 text-text-muted border border-border',
    neutral: 'bg-surface-2 text-text-muted border border-border',
    accent: 'bg-accent-soft text-accent-text',
    teal: 'bg-teal-soft text-teal-text',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    error: 'bg-danger-soft text-danger',
    info: 'bg-teal-soft text-teal-text',
  };

  const sizes = {
    sm: 'text-xs px-2.5 h-[22px]',
    md: 'text-xs px-3 h-[24px]',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
};
