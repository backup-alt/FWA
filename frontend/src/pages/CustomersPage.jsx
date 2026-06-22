import { useMemo, useState, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/api';
import { clsx } from 'clsx';

const SEARCH_TYPES = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'regNo', label: 'Vehicle Reg. Number' },
];

const BikeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/>
    <circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h3l3 5h-4"/>
    <path d="M8.5 17.5L5 6"/>
    <path d="M4 9h5"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5.1C2.7 10.3 2 11.1 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

export function CustomersPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('name');

  const searchParams = useMemo(() => {
    if (query.trim() && query.length >= 2) {
      return { search: query.trim(), searchType };
    }
    return {};
  }, [query, searchType]);

  const { data: customers = [], isLoading } = useCustomers(searchParams);

  const renderRegNumbers = (customer) => {
    const bikeRegs = customer.bikeRegNos || [];
    const carRegs = customer.carRegNos || [];
    const totalVehicles = bikeRegs.length + carRegs.length;

    if (totalVehicles === 0) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">No vehicles</span>;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {bikeRegs.map((reg, idx) => (
          <span key={`bike-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
            <BikeIcon />
            {reg}
          </span>
        ))}
        {carRegs.map((reg, idx) => (
          <span key={`car-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-medium">
            <CarIcon />
            {reg}
          </span>
        ))}
      </div>
    );
  };

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
          subtitle={isLoading ? 'Loading...' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`}
        />
        <CardContent className="p-5">
          <div className="mb-5">
            <div className="relative flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <Listbox value={searchType} onChange={setSearchType}>
                <div className="relative flex items-center border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 ml-3" />
                  <Listbox.Button className="flex items-center gap-1 py-2.5 pr-3 pl-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none whitespace-nowrap min-w-[120px] max-w-[140px]">
                    <span className="truncate">{SEARCH_TYPES.find(t => t.value === searchType)?.label}</span>
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Listbox.Options className="absolute left-0 top-full z-[9999] mt-1 ml-2 min-w-[180px] overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 text-sm">
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
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search by ${SEARCH_TYPES.find(t => t.value === searchType)?.label.toLowerCase()}...`}
                className="flex-1 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
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
              {customers.map(customer => (
                <NavLink
                  key={customer._id}
                  to={`/customer/${customer._id}`}
                  className="flex border-b border-gray-200 bg-white p-4 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50 flex-col sm:flex-row sm:items-start gap-4"
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {customer.name}
                        </h3>
                        {customer.bikeCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title={`${customer.bikeCount} Bike loan(s)`}>
                            <BikeIcon />
                            <span className="text-xs font-bold">{customer.bikeCount}</span>
                          </span>
                        )}
                        {customer.carCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400" title={`${customer.carCount} Car loan(s)`}>
                            <CarIcon />
                            <span className="text-xs font-bold">{customer.carCount}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {customer.cellNumbers?.map(c => c.number).join(', ') || 'No phone'}
                        {customer.address ? ` • ${customer.address}` : ''}
                      </p>
                      {renderRegNumbers(customer)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end shrink-0">
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