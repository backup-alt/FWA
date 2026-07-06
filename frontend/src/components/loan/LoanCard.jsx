import { NavLink } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/api';
import { clsx } from 'clsx';

export function LoanCard({ loan }) {
  const statusColors = {
    Active: 'info',
    Completed: 'success',
    Closed: 'warning',
    Renewed: 'purple',
  };

  return (
    <NavLink
      to={`/loan/${loan._id}`}
      className={clsx(
        'flex border-b border-gray-200 bg-white p-4 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50',
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
      )}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {loan.customerName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
          {loan.vehicleType} - {loan.make || ''} {loan.model || ''} {loan.regNo ? `(${loan.regNo})` : ''}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Started {formatDate(loan.loanStartDate)} • {loan.installmentPeriod} months
        </p>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(loan.outstandingPrincipal || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
        </div>
        <Badge variant={statusColors[loan.status] || 'gray'}>
          {loan.status}
        </Badge>
      </div>
    </NavLink>
  );
}
