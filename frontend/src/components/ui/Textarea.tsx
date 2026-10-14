import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showWordCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, showWordCount, value, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    const textString = typeof value === 'string' ? value : '';
    const wordCount = textString.trim() ? textString.trim().split(/\s+/).length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="block text-sm font-semibold text-text">
              {label}
            </label>
          )}
          {showWordCount && (
            <span className="text-xs text-text-muted tabular-nums">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}
        </div>
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            className={twMerge(
              clsx(
                'w-full p-3.5 bg-surface text-text placeholder:text-text-subtle text-sm rounded-xl border border-border focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all leading-relaxed disabled:bg-surface-2 disabled:cursor-not-allowed resize-y',
                error && 'border-danger focus:border-danger focus:ring-danger/20',
                className
              )
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-danger font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
