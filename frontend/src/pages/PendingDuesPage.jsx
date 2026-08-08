import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfinitePendingDues } from '@/hooks/useLoans';
import { PendingDuesTable } from '@/components/pending/PendingDuesTable';
import { PendingFilters } from '@/components/pending/PendingFilters';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function PendingDuesPage() {
  const [filter, setFilter] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const apiFilters = useMemo(() => {
    const out = {};
    if (filter.vehicleType) out.vehicleType = filter.vehicleType;
    if (filter.minOverdueDays !== undefined && filter.minOverdueDays !== '' && filter.minOverdueDays !== null) {
      out.minOverdueDays = filter.minOverdueDays;
    }
    if (filter.minAmount !== undefined && filter.minAmount !== '' && filter.minAmount !== null) {
      out.minAmount = filter.minAmount;
    }
    return out;
  }, [filter]);

  const {
    data: duesPages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePendingDues(apiFilters);

  const dues = useMemo(
    () => (duesPages?.pages || []).flatMap((p) => p.data || []),
    [duesPages]
  );
  const total = duesPages?.pages?.[0]?.total ?? dues.length;

  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, apiFilters]);

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
          {total} overdue installment{total === 1 ? '' : 's'}
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
            />
          )}
        </CardContent>
      </Card>

      {dues.length > 0 && (
        <div
          ref={sentinelRef}
          className="h-10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          {isFetchingNextPage
            ? 'Loading more...'
            : hasNextPage
              ? 'Scroll to load more'
              : isFetching
                ? 'Refreshing...'
                : 'No more pending dues'}
        </div>
      )}
    </div>
  );
}
