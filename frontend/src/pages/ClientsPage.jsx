import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLoans } from '@/hooks/useLoans';
import { LoanCard } from '@/components/loan/LoanCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const vehicleFilters = [
  { value: '', label: 'All clients' },
  { value: 'Bike', label: 'Bikes' },
  { value: 'Car', label: 'Cars' },
];

export function ClientsPage() {
  const [vehicleType, setVehicleType] = useState('');
  const [query, setQuery] = useState('');
  const { data: loans = [], isLoading } = useLoans({ vehicleType: vehicleType || undefined });

  const filteredLoans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return loans;

    return loans.filter((loan) => [
      loan.customerName,
      loan.vehicleType,
      loan.make,
      loan.model,
      loan.regNo,
      loan.cellNumbers?.map(cell => cell.number).join(' '),
    ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery));
  }, [loans, query]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Search and open customer loan files.
          </p>
        </div>
        <NavLink to="/add-client">
          <Button className="shrink-0 whitespace-nowrap">
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Client
          </Button>
        </NavLink>
      </div>

      <Card padding="">
        <CardHeader
          className="px-5 pt-5 mb-0"
          title="Client List"
          subtitle={isLoading ? 'Loading...' : `${filteredLoans.length} client${filteredLoans.length === 1 ? '' : 's'}`}
        />
        <CardContent className="p-5">
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search by name, vehicle, registration, or phone"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={vehicleType}
              onChange={event => setVehicleType(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {vehicleFilters.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Loading clients...
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">No clients found.</p>
              <NavLink to="/add-client" className="mt-4 inline-flex">
                <Button>
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add Client
                </Button>
              </NavLink>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {filteredLoans.map(loan => (
                <LoanCard key={loan._id} loan={loan} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
