import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-10 text-center rounded-2xl border-[1.5px] border-border bg-surface shadow-[0_1px_0_rgba(120,80,40,0.08)] ${className}`}>
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3 text-text-muted">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h4 className="text-base font-bold text-text tracking-tight">{title}</h4>
      <p className="text-sm text-text-muted max-w-sm mx-auto mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
