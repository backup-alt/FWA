import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { formatDateInput } from '@/api';

export function CloseLoanModal({ isOpen, onClose, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState('Full Prepayment');
  const [remarks, setRemarks] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [closureDate, setClosureDate] = useState(formatDateInput(new Date()));

  const REASONS = [
    'Full Prepayment',
    'Foreclosure',
    'Write-off',
    'Settlement',
    'Waiver',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      closureReason: reason,
      closureRemarks: remarks,
      amountReceived: Number(amountReceived) || 0,
      closureDate: closureDate || new Date().toISOString(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Loan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Closure Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <Input
          label="Amount Received at Closure (₹)"
          type="number"
          step="0.01"
          min="0"
          value={amountReceived}
          onChange={(e) => setAmountReceived(e.target.value)}
          placeholder="0.00"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Closure Date
          </label>
          <DatePicker
            value={closureDate}
            onChange={setClosureDate}
            maxDate={new Date()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Remarks (Optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Closing...' : 'Confirm Closure'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
