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
    info: 'bg-[--info-soft] text-[--info] border-[--border]',
    warning: 'bg-[--warning-soft] text-[#7A5200] border-[--warning-soft]',
    danger: 'bg-[--danger-soft] text-[--danger] border-[--danger-soft]',
    success: 'bg-[--success-soft] text-[--success] border-[--success-soft]',
  };

  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          'p-3.5 rounded-[6px] border flex items-start gap-3 text-xs leading-relaxed',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
