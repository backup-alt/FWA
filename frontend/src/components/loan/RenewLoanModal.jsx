import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { formatCurrency } from '@/api';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function RenewLoanModal({ isOpen, onClose, onConfirm, isSubmitting, loan }) {
  const [extraAmount, setExtraAmount] = useState('0');
  const [installmentPeriod, setInstallmentPeriod] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeExistingLoan, setCloseExistingLoan] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loan || !isOpen) return;
    setInstallmentPeriod(String(loan.installmentPeriod || ''));
    setInterestRate(String(loan.interestRate || ''));
    setExtraAmount('0');
    setRenewalDate(new Date().toISOString().split('T')[0]);
    setCloseExistingLoan(true);
    setError('');
  }, [loan, isOpen]);

  if (!loan) return null;

  const outstandingBalance = Number(loan.outstandingPrincipal || 0);
  const extra = Number(extraAmount) || 0;
  const newLoanAmount = outstandingBalance + extra;
  const period = Number(installmentPeriod) || 0;
  const rate = Number(interestRate) || 0;

  const calculateEmi = () => {
    if (period <= 0 || rate < 0 || newLoanAmount <= 0) return 0;
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return newLoanAmount / period;
    const emi = (newLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, period)) /
      (Math.pow(1 + monthlyRate, period) - 1);
    return Math.round(emi);
  };

  const calculateInterest = () => {
    if (period <= 0) return 0;
    const emi = calculateEmi();
    return Math.round(emi * period - newLoanAmount);
  };

  const estimatedEmi = calculateEmi();
  const estimatedInterest = calculateInterest();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (period <= 0) {
      setError('Installment period must be greater than 0.');
      return;
    }
    if (rate < 0) {
      setError('Interest rate cannot be negative.');
      return;
    }
    if (extra < 0) {
      setError('Extra amount cannot be negative.');
      return;
    }
    if (!renewalDate) {
      setError('Renewal date is required.');
      return;
    }
    onConfirm({
      extraAmount: extra,
      installmentPeriod: period,
      interestRate: rate,
      renewalDate,
      closeExistingLoan,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renew Loan"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Current Outstanding:</span> {formatCurrency(outstandingBalance)}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            A new loan will be created with amount = Outstanding + Extra Amount. The original loan will be marked as &quot;Renewed&quot; and all payment history will be preserved.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Input
          label="Extra Amount (allow 0)"
          type="number"
          min="0"
          step="0.01"
          value={extraAmount}
          onChange={(e) => setExtraAmount(e.target.value)}
          placeholder="0"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Installment Period"
            type="number"
            min="1"
            value={installmentPeriod}
            onChange={(e) => setInstallmentPeriod(e.target.value)}
            placeholder="e.g. 12"
          />
          <Input
            label="Interest Rate (%)"
            type="number"
            min="0"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="e.g. 12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Renewal Date
          </label>
          <DatePicker
            value={renewalDate}
            onChange={(val) => setRenewalDate(val)}
            placeholder="Select renewal date"
          />
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={closeExistingLoan}
              onChange={(e) => setCloseExistingLoan(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Close the existing loan
              </span>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                {closeExistingLoan
                  ? 'The original loan will be marked as "Renewed" and all payment history will be preserved. The new loan will replace the outstanding balance.'
                  : 'The original loan will remain "Active" alongside the new renewal loan. Use this if you want to keep both loans active for record-keeping.'}
              </p>
            </div>
          </label>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">New Loan Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500 dark:text-gray-400">New Loan Amount:</div>
            <div className="text-right font-medium text-gray-900 dark:text-white">
              {formatCurrency(newLoanAmount)}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Estimated EMI:</div>
            <div className="text-right font-medium text-gray-900 dark:text-white">
              {formatCurrency(estimatedEmi)}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Estimated Interest:</div>
            <div className="text-right font-medium text-gray-900 dark:text-white">
              {formatCurrency(estimatedInterest)}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Renew Loan
          </Button>
        </div>
      </form>
    </Modal>
  );
}