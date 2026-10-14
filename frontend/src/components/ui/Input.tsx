import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[--text]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full h-10 px-3 bg-[--surface] text-[--text] placeholder:text-[--text-subtle] text-sm rounded-[6px] border border-[--border] focus:outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent] transition-colors disabled:bg-[--surface-2] disabled:cursor-not-allowed',
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

Input.displayName = 'Input';
