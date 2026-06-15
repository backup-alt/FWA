import { useState } from 'react';
import { usePendingDues } from '@/hooks/useLoans';
import { PendingDuesTable } from '@/components/pending/PendingDuesTable';
import { PendingFilters } from '@/components/pending/PendingFilters';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { clsx } from 'clsx';

export function PendingDuesPage() {
  const [filter, setFilter] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const { data: dues = [], isLoading } = usePendingDues();

  const handleFilterChange = (newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleClearFilters = () => {
    setFilter({});
  };

  const handleSort = (direction, key) => {
    setSortConfig({ key, direction });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Dues</h1>
        <Badge variant="warning" className="text-sm">
          {dues.length} overdue installments
        </Badge>
      </div>

      <PendingFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <PendingDuesTable
              dues={dues}
              sortConfig={sortConfig}
              onSort={handleSort}
              filter={filter}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}