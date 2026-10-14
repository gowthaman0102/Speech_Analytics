import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  if (variant === 'segmented') {
    return (
      <div className={twMerge(clsx('inline-flex p-1 bg-[--surface-2] rounded-[6px] border border-[--border]', className))}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-[4px] transition-all select-none',
                isActive
                  ? 'bg-[--surface] text-[--text] shadow-xs'
                  : 'text-[--text-muted] hover:text-[--text]'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 opacity-70 tabular-nums">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={twMerge(clsx('flex items-center gap-6 border-b border-[--border]', className))}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors select-none flex items-center gap-1.5',
              isActive
                ? 'border-[--accent] text-[--accent]'
                : 'border-transparent text-[--text-muted] hover:text-[--text] hover:border-[--border-strong]'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-xs px-1.5 py-0.2 bg-[--surface-2] rounded-full tabular-nums">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
