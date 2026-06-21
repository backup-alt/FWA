import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/api';
import { Fragment } from 'react';
import { clsx } from 'clsx';

const SEARCH_TYPES = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'regNo', label: 'Vehicle Reg. Number' },
];

export function CustomersPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const { data: customers = [], isLoading } = useCustomers();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => {
      switch (searchType) {
        case 'name':
          return c.name?.toLowerCase().includes(q);
        case 'phone':
          return c.cellNumbers?.some(n => n.number?.includes(q));
        case 'regNo':
          return c.regNos?.some(r => r?.toLowerCase().includes(q));
        default:
          return true;
      }
    });
  }, [customers, query, searchType]);

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
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 ml-3" />
                <Listbox value={searchType} onChange={setSearchType}>
                  <div className="relative">
                    <Listbox.Button className="flex items-center gap-1 py-2.5 pr-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
                      <span className="min-w-[60px] text-center">{SEARCH_TYPES.find(t => t.value === searchType)?.label}</span>
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Listbox.Options className="absolute z-50 mt-1.5 min-w-[140px] overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1.5 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 text-sm">
                        {SEARCH_TYPES.map((type) => (
                          <Listbox.Option
                            key={type.value}
                            value={type.value}
                            as={Fragment}
                          >
                            {({ active, selected }) => (
                              <li
                                className={clsx(
                                  'relative cursor-pointer select-none py-2 pl-10 pr-4 mx-1 rounded-lg transition-colors',
                                  active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                                )}
                              >
                                <span className="block truncate font-normal">
                                  {type.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </li>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search by ${SEARCH_TYPES.find(t => t.value === searchType)?.label.toLowerCase()}...`}
                className="flex-1 py-2 px-3 text-sm text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
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
