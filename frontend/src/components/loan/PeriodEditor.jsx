import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function PeriodEditor({ loan, onUpdate, updating }) {
  const [localPeriod, setLocalPeriod] = useState(loan.installmentPeriod);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!localPeriod || localPeriod <= 0) {
      setError('Please enter a valid period');
      return;
    }
    if (localPeriod === loan.installmentPeriod) return;

    const paidCount = loan.installments.filter(i => i.status === 'Paid').length;
    if (localPeriod <= paidCount) {
      setError(`Period must be greater than ${paidCount} paid installments`);
      return;
    }

    setError('');
    try {
      await onUpdate(localPeriod);
    } catch (err) {
      setError(err.message || 'Failed to update period');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4">
      <div className="w-32">
        <Input
          label="Installment Period (months)"
          type="number"
          value={localPeriod}
          onChange={e => setLocalPeriod(+e.target.value || 0)}
          error={error}
          disabled={loan.status === 'Completed' || updating}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={loan.status === 'Completed' || updating || localPeriod === loan.installmentPeriod}
      >
        Update
      </Button>
      {loan.status === 'Completed' && (
        <span className="text-sm text-gray-500 dark:text-gray-400">Loan completed - period locked</span>
      )}
    </form>
  );
}
