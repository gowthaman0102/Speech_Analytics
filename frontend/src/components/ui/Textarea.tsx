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
            <label htmlFor={textareaId} className="block text-sm font-medium text-[--text]">
              {label}
            </label>
          )}
          {showWordCount && (
            <span className="text-xs text-[--text-muted] tabular-nums">
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
                'w-full p-3 bg-[--surface] text-[--text] placeholder:text-[--text-subtle] text-base font-serif rounded-[6px] border border-[--border] focus:outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent] transition-colors leading-relaxed disabled:bg-[--surface-2] disabled:cursor-not-allowed resize-y',
                error && 'border-[--danger] focus:border-[--danger] focus:ring-[--danger]',
                className
              )
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-[--danger]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[--text-muted]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
