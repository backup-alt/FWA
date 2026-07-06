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
  <svg viewBox="0 0 512 512" className="h-5 w-5" fill="currentColor">
    <path d="M417.975,226.338c-5.966,0-11.764,0.618-17.404,1.684l-33.048-100.841c-5.781-17.644-22.258-29.577-40.822-29.577h-45.506v24.414h45.506c8.038-0.008,15.147,5.155,17.636,12.768l6.028,18.433h-60.684c-31.084,0-54.424,15.542-54.424,15.542v45.358h135.064l7.064,21.54c-31.579,15.163-53.42,47.345-53.435,84.704c0.016,51.936,42.09,94.018,94.026,94.033c51.92-0.015,94.01-42.097,94.025-94.033C511.985,268.435,469.895,226.353,417.975,226.338z M461.456,363.844c-11.175,11.144-26.462,18.007-43.48,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.144-11.176-18.008-26.447-18.008-43.481c0-17.026,6.863-32.29,18.008-43.465c3.88-3.88,8.409-7.01,13.185-9.754l11.114,33.928c-4.962,4.931-8.037,11.748-8.037,19.29c0,15.032,12.18,27.22,27.204,27.22c15.024,0,27.204-12.188,27.204-27.22c0-13.633-10.062-24.809-23.14-26.787l-11.128-33.974c2.35-0.278,4.637-0.711,7.064-0.711c17.018,0,32.305,6.855,43.48,18.008c11.144,11.175,17.977,26.439,18.008,43.465C479.432,337.397,472.6,352.668,461.456,363.844z"/>
    <path d="M94.01,226.338C42.074,226.353,0.016,268.435,0,320.363c0.016,51.936,42.074,94.018,94.01,94.033c51.936-0.015,94.01-42.097,94.026-94.033C188.02,268.435,145.946,226.353,94.01,226.338z M137.491,363.844c-11.176,11.144-26.447,18.007-43.481,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.16-11.176-18.008-26.447-18.008-43.481c0-17.026,6.848-32.29,18.008-43.465C61.72,265.745,76.976,258.89,94.01,258.89c17.034,0,32.306,6.855,43.481,18.008c11.144,11.175,17.992,26.439,18.008,43.465C155.483,337.397,148.636,352.668,137.491,363.844z"/>
    <path d="M94.01,293.167c-15.024,0-27.204,12.172-27.204,27.196c0,15.032,12.18,27.22,27.204,27.22c15.025,0,27.22-12.188,27.22-27.22C121.23,305.339,109.035,293.167,94.01,293.167z"/>
    <path d="M439.074,207.55v-65.855c-27.854,0-45.583,18.997-45.583,18.997v27.854C393.491,188.546,411.22,207.55,439.074,207.55z"/>
    <rect x="450.868" y="141.68" class="st0" width="13.525" height="65.847"/>
    <path d="M70.5,214.119H220.17v-42.762h-45.52c-12.212,0-24.345-1.932-35.954-5.742l-16.261-5.34c-11.592-3.81-23.742-5.758-35.953-5.758H70.5c-8.47,0-15.348,6.886-15.348,15.372v28.858C55.151,207.233,62.029,214.119,70.5,214.119z"/>
    <path d="M343.302,232.111v-1.352H167.03c26.029,21.161,42.708,53.435,42.708,89.636c0,3.246,1.112,9.761,10.433,9.761h69.928c8.888,0,12.118-6.515,12.118-9.761C302.217,284.998,318.199,253.272,343.302,232.111z"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 16 16" className="h-5 w-5" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z"/>
  </svg>
);

const autoIcon = '/FWA/icons8-auto-rickshaw-50.png';

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
    const autoRegs = customer.autoRegNos || [];
    const totalVehicles = bikeRegs.length + carRegs.length + autoRegs.length;

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
        {autoRegs.map((reg, idx) => (
          <span key={`auto-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-xs font-medium">
            <img src={autoIcon} alt="Auto" className="h-4 w-4" />
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
                        {customer.autoCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-400" title={`${customer.autoCount} Auto loan(s)`}>
                            <img src={autoIcon} alt="Auto" className="h-4 w-4" />
                            <span className="text-xs font-bold">{customer.autoCount}</span>
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
                    ) : customer.renewedLoans > 0 ? (
                      <Badge variant="purple">{customer.renewedLoans} renewed</Badge>
                    ) : customer.closedLoans > 0 ? (
                      <Badge variant="warning">{customer.closedLoans} closed</Badge>
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