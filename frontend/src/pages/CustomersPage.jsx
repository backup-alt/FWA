import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/api';

export function CustomersPage() {
  const [query, setQuery] = useState('');
  const { data: customers = [], isLoading } = useCustomers();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      [c.name, c.address, c.cellNumbers?.map(n => n.number).join(' ')]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage customers and their RAM Finance loans.
          </p>
        </div>
        <NavLink to="/add-customer">
          <Button className="shrink-0 whitespace-nowrap">
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Customer
          </Button>
        </NavLink>
      </div>

      <Card padding="">
        <CardHeader
          className="px-5 pt-5 mb-0"
          title="Customer List"
          subtitle={isLoading ? 'Loading...' : `${filtered.length} customer${filtered.length === 1 ? '' : 's'}`}
        />
        <CardContent className="p-5">
          <div className="mb-5">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, address, or phone"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Loading customers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">No customers found.</p>
              <NavLink to="/add-customer" className="mt-4 inline-flex">
                <Button>
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add Customer
                </Button>
              </NavLink>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {filtered.map(customer => (
                <NavLink
                  key={customer._id}
                  to={`/customer/${customer._id}`}
                  className="flex border-b border-gray-200 bg-white p-4 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50 flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {customer.profileImage ? (
                      <img
                        src={customer.profileImage}
                        alt={customer.name}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {customer.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {customer.cellNumbers?.map(c => c.number).join(', ') || 'No phone'}
                        {customer.address ? ` • ${customer.address}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {customer.loanCount || 0} loan{customer.loanCount !== 1 ? 's' : ''}
                      </p>
                      {customer.totalOutstanding > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(customer.totalOutstanding)} outstanding
                        </p>
                      )}
                    </div>
                    {customer.activeLoans > 0 ? (
                      <Badge variant="info">{customer.activeLoans} active</Badge>
                    ) : customer.loanCount > 0 ? (
                      <Badge variant="success">All completed</Badge>
                    ) : (
                      <Badge variant="gray">No loans</Badge>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
