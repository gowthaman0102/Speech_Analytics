import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={twMerge(
          clsx('bg-[--surface] border border-[--border] rounded-[8px] text-[--text]', className)
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge(clsx('px-5 py-4 border-b border-[--border]', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={twMerge(clsx('text-base font-semibold text-[--text] tracking-tight', className))} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={twMerge(clsx('text-xs text-[--text-muted] mt-0.5', className))} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge(clsx('p-5', className))} {...props}>
    {children}
  </div>
);
