import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  action?: React.ReactNode;
}

export const Banner: React.FC<BannerProps> = ({
  className,
  variant = 'info',
  title,
  action,
  children,
  ...props
}) => {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
    success: CheckCircle2,
  };

  const variants = {
    info: 'bg-teal-soft text-teal-text border-teal-soft',
    warning: 'bg-warning-soft text-warning border-warning-soft',
    danger: 'bg-danger-soft text-danger border-danger-soft',
    success: 'bg-success-soft text-success border-success-soft',
  };

  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          'p-4 rounded-xl border flex items-start gap-3 text-sm leading-relaxed',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-bold text-sm mb-0.5">{title}</h5>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
