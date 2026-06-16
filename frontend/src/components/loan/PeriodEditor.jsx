import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function PeriodEditor({ loan, onUpdate, updating }) {
  const [localPeriod, setLocalPeriod] = useState(loan.installmentPeriod);
  const [localUnit, setLocalUnit] = useState(loan.installmentPeriodUnit || 'Months');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!localPeriod || localPeriod <= 0) {
      setError('Please enter a valid period');
      return;
    }
    if (localPeriod === loan.installmentPeriod && localUnit === (loan.installmentPeriodUnit || 'Months')) return;

    const paidCount = loan.installments.filter(i => i.status === 'Paid').length;
    if (localPeriod <= paidCount) {
      setError(`Period must be greater than ${paidCount} paid installments`);
      return;
    }

    setError('');
    try {
      await onUpdate(localPeriod, localUnit);
    } catch (err) {
      setError(err.message || 'Failed to update period');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4">
      <div className="flex items-end gap-2">
        <div className="w-24">
          <Input
            label="Period"
            type="number"
            value={localPeriod}
            onChange={e => setLocalPeriod(+e.target.value || 0)}
            error={error}
            disabled={loan.status === 'Completed' || updating}
          />
        </div>
        <div className="w-28">
          <Select
            label="Unit"
            value={localUnit}
            onChange={e => setLocalUnit(e.target.value)}
            options={[
              { value: 'Months', label: 'Months' },
              { value: 'Weeks', label: 'Weeks' },
              { value: 'Days', label: 'Days' },
            ]}
            disabled={loan.status === 'Completed' || updating}
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={loan.status === 'Completed' || updating || (localPeriod === loan.installmentPeriod && localUnit === (loan.installmentPeriodUnit || 'Months'))}
      >
        Update
      </Button>
      {loan.status === 'Completed' && (
        <span className="text-sm text-gray-500 dark:text-gray-400">Loan completed - period locked</span>
      )}
    </form>
  );
}
