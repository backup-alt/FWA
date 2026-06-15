import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useLoans, usePendingDues } from '@/hooks/useLoans';
import { PortfolioSummary } from '@/components/charts/PortfolioSummary';
import { VehicleTypeChart } from '@/components/charts/VehicleTypeChart';
import { PaymentTrendChart } from '@/components/charts/PaymentTrendChart';
import { PendingDuesTable } from '@/components/pending/PendingDuesTable';
import { PendingFilters } from '@/components/pending/PendingFilters';
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

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('');
  const [pendingFilter, setPendingFilter] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const { data: loans = [] } = useLoans(
    activeTab === 'pending' ? {} : { vehicleType: activeTab || undefined }
  );
  const { data: pendingDues = [], isLoading: pendingLoading } = usePendingDues();

  const handleFilterChange = (newFilter) => {
    setPendingFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleClearFilters = () => {
    setPendingFilter({});
  };

  const handleSort = (direction, key) => {
    setSortConfig({ key, direction });
  };

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
            {pendingLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of active vehicle finance loans and collections.
          </p>
        </div>
        <NavLink to="/add-client">
          <Button className="shrink-0 whitespace-nowrap">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Client
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
    </div>
  );
}
