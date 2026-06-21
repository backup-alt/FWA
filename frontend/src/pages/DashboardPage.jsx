import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useLoans, usePendingDues } from '@/hooks/useLoans';
import { PortfolioSummary } from '@/components/charts/PortfolioSummary';
import { VehicleTypeChart } from '@/components/charts/VehicleTypeChart';
import { PaymentTrendChart } from '@/components/charts/PaymentTrendChart';
import { PendingDuesTable } from '@/components/pending/PendingDuesTable';
import { PendingFilters } from '@/components/pending/PendingFilters';
import { ReportDownload } from '@/components/charts/ReportDownload';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { clsx } from 'clsx';

const TABS = [
  { id: '', label: 'All' },
  { id: 'Bike', label: 'Bikes' },
  { id: 'Car', label: 'Cars' },
  { id: 'pending', label: 'Pending Dues' },
];

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-80 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Tab skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 h-64" />
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('');
  const [pendingFilter, setPendingFilter] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const { data: loans = [], isLoading: loansLoading, isFetching: loansFetching, isError: loansError } = useLoans(
    activeTab === 'pending' ? {} : { vehicleType: activeTab || undefined }
  );
  const { data: pendingDues = [], isLoading: pendingLoading, isFetching: pendingFetching, isError: pendingError } = usePendingDues();

  const handleFilterChange = (newFilter) => {
    setPendingFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleClearFilters = () => {
    setPendingFilter({});
  };

  const handleSort = (direction, key) => {
    setSortConfig({ key, direction });
  };

  // Show skeleton while the initial data load or background fetch is in progress and we have no data
  if ((loansLoading || (loansFetching && loans.length === 0)) && !loansError) {
    return <DashboardSkeleton />;
  }

  if (loansError) {
    return (
      <div className="mx-auto max-w-7xl p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Failed to load dashboard data</h2>
        <p className="text-sm text-red-600 dark:text-red-300">
          The backend server might be starting up or is unreachable. Please refresh the page in a few seconds.
        </p>
      </div>
    );
  }

  if (activeTab === 'pending') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Dues</h1>
          <Badge variant="warning" className="text-sm">
            {pendingDues.length} overdue installments
          </Badge>
        </div>

        <PendingFilters
          filter={pendingFilter}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <Card>
          <CardContent className="p-0">
            {(pendingLoading || (pendingFetching && pendingDues.length === 0)) && !pendingError ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : pendingError ? (
              <div className="p-8 text-center text-red-500">Failed to load pending dues. Please refresh.</div>
            ) : (
              <PendingDuesTable
                dues={pendingDues}
                sortConfig={sortConfig}
                onSort={handleSort}
                filter={pendingFilter}
              />
            )}
          </CardContent>
        </Card>

        {/* Tab bar to switch back */}
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of active RAM Finance loans and collections.
          </p>
        </div>
        <NavLink to="/add-customer">
          <Button className="shrink-0 whitespace-nowrap">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Customer
          </Button>
        </NavLink>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <PortfolioSummary loans={loans} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VehicleTypeChart loans={loans} />
        <PaymentTrendChart loans={loans} />
      </div>

      <ReportDownload />
    </div>
  );
}
