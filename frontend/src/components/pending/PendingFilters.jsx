import { Select, Input } from '@/components/ui';

export function PendingFilters({ filter, onFilterChange, onClear }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Select
          label="Vehicle Type"
          value={filter.vehicleType || ''}
          onChange={event => onFilterChange({ vehicleType: event.target.value || undefined })}
          options={[
            { value: '', label: 'All Types' },
            { value: 'Bike', label: 'Bikes' },
            { value: 'Car', label: 'Cars' },
            { value: 'Auto', label: 'Auto' },
          ]}
        />

        <div className="w-full sm:w-48">
          <Input
            label="Min Overdue Days"
            type="number"
            placeholder="0"
            value={filter.minOverdueDays || ''}
            onChange={event => onFilterChange({ minOverdueDays: event.target.value ? +event.target.value : undefined })}
          />
        </div>

        <div className="w-full sm:w-48">
          <Input
            label="Min Amount (INR)"
            type="number"
            placeholder="0"
            value={filter.minAmount || ''}
            onChange={event => onFilterChange({ minAmount: event.target.value ? +event.target.value : undefined })}
          />
        </div>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
