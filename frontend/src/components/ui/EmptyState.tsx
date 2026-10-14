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
    <div className={`p-10 text-center rounded-[8px] border border-[--border] bg-[--surface] ${className}`}>
      <div className="w-10 h-10 rounded-full bg-[--surface-2] flex items-center justify-center mx-auto mb-3 text-[--text-muted]">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-base font-semibold text-[--text] tracking-tight">{title}</h4>
      <p className="text-xs text-[--text-muted] max-w-sm mx-auto mt-1 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
