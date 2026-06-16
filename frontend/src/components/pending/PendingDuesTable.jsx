import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/api';
import { NavLink } from 'react-router-dom';

export function PendingDuesTable({ dues, sortConfig, onSort, filter }) {
  const filteredDues = dues.filter(due => {
    if (filter.vehicleType && due.vehicleType !== filter.vehicleType) return false;
    if (filter.minOverdueDays && due.daysOverdue < filter.minOverdueDays) return false;
    if (filter.minAmount && due.outstandingForThisInstallment < filter.minAmount) return false;
    return true;
  });

  const sortedDues = [...filteredDues].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    onSort(key === sortConfig.key && sortConfig.direction === 'asc' ? 'desc' : 'asc', key);
  };

  const SortableHeader = ({ children, sortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig.key === sortKey && (
          <span aria-hidden="true">{sortConfig.direction === 'asc' ? '^' : 'v'}</span>
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader sortKey="customerName">Customer</SortableHeader>
            <SortableHeader sortKey="vehicleType">Vehicle</SortableHeader>
            <SortableHeader sortKey="sNo">Installment</SortableHeader>
            <SortableHeader sortKey="dueDate">Due Date</SortableHeader>
            <SortableHeader sortKey="daysOverdue">Days Overdue</SortableHeader>
            <SortableHeader sortKey="pendingAmount">Carried Pending</SortableHeader>
            <SortableHeader sortKey="outstandingForThisInstallment">Outstanding</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                {dues.length === 0 ? 'No pending dues found' : 'No dues match current filters'}
              </TableCell>
            </TableRow>
          ) : (
            sortedDues.map(due => (
              <TableRow key={`${due.loanId}-${due.sNo}`}>
                <TableCell>
                  <NavLink to={`/client/${due.loanId}`} className="font-medium text-primary-600 hover:underline">
                    {due.customerName}
                  </NavLink>
                </TableCell>
                <TableCell>
                  <Badge variant={due.vehicleType === 'Bike' ? 'info' : 'success'}>
                    {due.vehicleType}
                  </Badge>
                </TableCell>
                <TableCell>#{due.sNo}</TableCell>
                <TableCell>{formatDate(due.dueDate)}</TableCell>
                <TableCell>
                  <Badge variant={due.daysOverdue > 30 ? 'danger' : due.daysOverdue > 7 ? 'warning' : 'info'}>
                    {due.daysOverdue} days
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-orange-600 dark:text-orange-400">
                  {Number(due.pendingAmount || 0) > 0 ? formatCurrency(due.pendingAmount) : '-'}
                </TableCell>
                <TableCell className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(due.outstandingForThisInstallment)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
