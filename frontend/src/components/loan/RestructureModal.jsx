import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '@/api';

export function RestructureModal({ isOpen, onClose, onConfirm, isSubmitting, loan }) {
  const [mode, setMode] = useState('lower-emi');
  const [lumpSum, setLumpSum] = useState('');
  
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loan || !isOpen) return;
    
    const futureInstallments = loan.installments.filter(
      (i) => i.status !== 'Paid' && i.status !== 'Cancelled' && Number(i.amountReceived || 0) === 0
    ).sort((a, b) => a.sNo - b.sNo);

    if (futureInstallments.length === 0) {
      setError('No future installments available to restructure.');
      setPreview(null);
      return;
    }

    const currentOutstanding = futureInstallments.reduce((sum, i) => sum + Number(i.dueAmount || 0), 0);
    const lumpSumNum = Number(lumpSum) || 0;

    if (lumpSumNum <= 0) {
      setError('');
      setPreview(null);
      return;
    }

    if (lumpSumNum >= currentOutstanding) {
      setError(`Lump sum must be less than outstanding balance (${formatCurrency(currentOutstanding)}). Use Close Loan instead.`);
      setPreview(null);
      return;
    }

    setError('');
    
    const newOutstanding = currentOutstanding - lumpSumNum;
    const rate = loan.interestRate || 0;
    const prevEmi = Number(futureInstallments[0].dueAmount || 0);
    const prevPeriod = futureInstallments.length;
    
    let newPeriod;
    let newEmi;

    if (mode === 'lower-emi') {
      newPeriod = prevPeriod;
      const monthlyInterest = newOutstanding * (rate / 100);
      const monthlyPrincipal = newOutstanding / newPeriod;
      newEmi = monthlyPrincipal + monthlyInterest;
    } else {
      const monthlyInterest = newOutstanding * (rate / 100);
      const principalPerInstallment = prevEmi - monthlyInterest;
      
      if (principalPerInstallment <= 0) {
        setError('EMI is too low to cover the interest on the new balance. Use "Lower EMI" mode.');
        setPreview(null);
        return;
      }
      newPeriod = Math.ceil(newOutstanding / principalPerInstallment);
      newEmi = prevEmi;
    }

    setPreview({
      newOutstanding,
      newPeriod,
      newEmi,
      prevEmi,
      prevPeriod
    });

  }, [lumpSum, mode, loan, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error || !preview) return;
    
    onConfirm({
      mode,
      lumpSum: Number(lumpSum)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restructure Loan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Restructure Mode
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="lower-emi"
                checked={mode === 'lower-emi'}
                onChange={(e) => setMode(e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm dark:text-gray-300">Lower EMI</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="shorten-period"
                checked={mode === 'shorten-period'}
                onChange={(e) => setMode(e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm dark:text-gray-300">Shorten Period</span>
            </label>
          </div>
        </div>

        <Input
          label="Lump Sum Payment (₹) *"
          type="number"
          step="0.01"
          min="1"
          value={lumpSum}
          onChange={(e) => setLumpSum(e.target.value)}
          placeholder="Enter prepayment amount"
          required
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {preview && !error && (
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 space-y-2 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Live Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Current Remaining</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {preview.prevPeriod} months @ {formatCurrency(preview.prevEmi)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">New Remaining</p>
                <p className="font-medium text-primary-600 dark:text-primary-400">
                  {preview.newPeriod} months @ {formatCurrency(preview.newEmi)}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">New Outstanding Balance</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(preview.newOutstanding)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !!error || !lumpSum}>
            {isSubmitting ? 'Processing...' : 'Confirm Restructure'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
