import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Select } from '../ui/Select';
import { formatDateInput, formatCurrency } from '@/api';

const REASONS = [
  { value: 'Full Prepayment', label: 'Full Prepayment' },
  { value: 'Foreclosure', label: 'Foreclosure' },
  { value: 'Write-off', label: 'Write-off' },
  { value: 'Settlement', label: 'Settlement' },
  { value: 'Waiver', label: 'Waiver' },
];

export function CloseLoanModal({ isOpen, onClose, onConfirm, isSubmitting, loan }) {
  const isAlreadyClosed = loan?.status === 'Closed' || loan?.status === 'Completed';

  const [reason, setReason] = useState('Full Prepayment');
  const [remarks, setRemarks] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [closureDate, setClosureDate] = useState(formatDateInput(new Date()));
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const outstandingPrincipal = loan?.outstandingPrincipal || 0;

  useEffect(() => {
    if (isOpen) {
      if (isAlreadyClosed && loan?.closureInfo) {
        setReason(loan.closureInfo.reason || 'Full Prepayment');
        setRemarks(loan.closureInfo.remarks || '');
        setAmountReceived(loan.closureInfo.amountReceived?.toString() || '');
        setClosureDate(loan.closureInfo.closureDate ? formatDateInput(new Date(loan.closureInfo.closureDate)) : formatDateInput(new Date()));
      } else {
        setReason('Full Prepayment');
        setRemarks('');
        setAmountReceived(outstandingPrincipal > 0 ? outstandingPrincipal.toString() : '');
        setClosureDate(formatDateInput(new Date()));
      }
    }
  }, [isOpen, isAlreadyClosed, loan, outstandingPrincipal]);

  const handleReasonChange = (newReason) => {
    setReason(newReason);
    if (newReason === 'Full Prepayment') {
      setAmountReceived(outstandingPrincipal.toString());
    } else {
      setAmountReceived('');
    }
  };

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmYes = () => {
    setShowConfirmModal(false);
    const payload = {
      closureReason: reason,
      closureRemarks: remarks,
      amountReceived: Number(amountReceived) || 0,
      closureDate: closureDate || new Date().toISOString(),
    };
    if (isAlreadyClosed) {
      payload.updateOnly = true;
    }
    onConfirm(payload);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isAlreadyClosed ? 'Edit Closure Details' : 'Close Loan'}>
        <form onSubmit={(e) => { e.preventDefault(); handleOpenConfirm(); }} className="space-y-4">
          <Select
            label="Closure Reason"
            options={REASONS}
            value={reason}
            onChange={handleReasonChange}
            placeholder="Select reason"
          />

          <div>
            <Input
              label={`Amount Received at Closure (₹)${reason === 'Full Prepayment' && !isAlreadyClosed ? ' - Full Payoff Amount' : ''}`}
              type="number"
              step="0.01"
              min="0"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="0.00"
            />
            {reason === 'Full Prepayment' && outstandingPrincipal > 0 && !isAlreadyClosed && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Full payoff amount: {formatCurrency(outstandingPrincipal)}
              </p>
            )}
          </div>

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
              Remarks
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
              {isSubmitting ? 'Updating...' : (isAlreadyClosed ? 'Update' : 'Confirm Closure')}
            </Button>
          </div>
        </form>
      </Modal>

      {isAlreadyClosed ? (
        <Modal
          isOpen={showConfirmModal}
          onClose={handleCancel}
          title="Update Closure Details"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to update the closure details?
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Closure Reason:</span>
                <span className="font-medium text-gray-900 dark:text-white">{reason}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Amount Received:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(amountReceived) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Closure Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDateInput(closureDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Remarks:</span>
                <span className="font-medium text-gray-900 dark:text-white">{remarks || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmYes}>
              Update
            </Button>
          </div>
        </Modal>
      ) : (
        <Modal
          isOpen={showConfirmModal}
          onClose={handleCancel}
          title="Confirm Closure"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to close this loan?
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Closure Reason:</span>
                <span className="font-medium text-gray-900 dark:text-white">{reason}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Amount Received:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(Number(amountReceived) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Closure Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDateInput(closureDate)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action will mark the loan as closed and cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmYes}>
              Yes, Close Loan
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}