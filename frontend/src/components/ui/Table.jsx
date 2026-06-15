import { clsx } from 'clsx';
import { forwardRef } from 'react';

export const Table = forwardRef(function Table({ className = '', children, ...props }, ref) {
  return (
    <div className="overflow-x-auto" ref={ref}>
      <table className={clsx('w-full text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
});

Table.displayName = 'Table';

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={clsx('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={clsx('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, ...props }) {
  return (
    <tr
      className={clsx(
        'border-b border-gray-200 dark:border-gray-700',
        hover && 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={clsx('px-4 py-3 text-gray-900 dark:text-gray-100', className)} {...props}>
      {children}
    </td>
  );
}
