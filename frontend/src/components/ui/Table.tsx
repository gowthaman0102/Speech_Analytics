import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-x-auto border-[1.5px] border-border rounded-2xl bg-surface shadow-[0_1px_0_rgba(120,80,40,0.08)]">
      <table ref={ref} className={twMerge(clsx('w-full text-left text-sm border-collapse', className))} {...props}>
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead
      ref={ref}
      className={twMerge(
        clsx('bg-surface-2 border-b border-border text-xs font-semibold text-text-muted', className)
      )}
      {...props}
    >
      {children}
    </thead>
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={twMerge(clsx('divide-y divide-border', className))} {...props}>
      {children}
    </tbody>
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { isSelected?: boolean }
>(({ className, isSelected, children, ...props }, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      clsx(
        'border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors',
        isSelected && 'bg-accent-soft hover:bg-accent-soft border-l-[3px] border-l-accent',
        className
      )
    )}
    {...props}
  >
    {children}
  </tr>
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <th ref={ref} className={twMerge(clsx('py-3 px-4 font-semibold text-xs text-text-muted', className))} {...props}>
      {children}
    </th>
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <td ref={ref} className={twMerge(clsx('py-3.5 px-4 text-sm text-text align-middle', className))} {...props}>
      {children}
    </td>
  )
);
TableCell.displayName = 'TableCell';
