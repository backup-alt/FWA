import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '@/api';
import { SparklesIcon, ArrowsRightLeftIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export function RestructureModal({ isOpen, onClose, onConfirm, isSubmitting, loan }) {
  const [mode, setMode] = useState('lower-emi');
  const [targetValue, setTargetValue] = useState('');
  
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [currentOutstanding, setCurrentOutstanding] = useState(0);

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

    const outstanding = futureInstallments.reduce((sum, i) => sum + Number(i.dueAmount || 0), 0);
    setCurrentOutstanding(outstanding);
    
    const targetNum = Number(targetValue) || 0;

    if (targetNum <= 0) {
      setError('');
      setPreview(null);
      return;
    }

    const rate = loan.interestRate || 0;
    const prevEmi = Number(futureInstallments[0].dueAmount || 0);
    const prevPeriod = futureInstallments.length;

    let requiredLumpSum = 0;
    let newOutstanding = 0;
    let newPeriod;
    let newEmi;
    let lastEmi;

    if (mode === 'lower-emi') {
      if (targetNum >= prevEmi) {
        setError(`Target EMI must be lower than the current EMI (${formatCurrency(prevEmi)}).`);
        setPreview(null);
        return;
      }
      newOutstanding = targetNum / ((1 / prevPeriod) + (rate / 100));
      requiredLumpSum = outstanding - newOutstanding;
      newPeriod = prevPeriod;
      newEmi = targetNum;
    } else {
      if (!Number.isInteger(targetNum)) {
        setError('Target period must be a whole number of months.');
        setPreview(null);
        return;
      }
      if (targetNum >= prevPeriod) {
        setError(`Target period must be fewer than the current remaining period (${prevPeriod} months).`);
        setPreview(null);
        return;
      }
      newOutstanding = prevEmi / ((1 / targetNum) + (rate / 100));
      requiredLumpSum = outstanding - newOutstanding;
      newPeriod = targetNum;
      newEmi = prevEmi;
    }

    if (requiredLumpSum <= 0 || requiredLumpSum >= outstanding) {
      setError(`This target requires an invalid lump sum payment. Outstanding balance is ${formatCurrency(outstanding)}.`);
      setPreview(null);
      return;
    }

    setError('');
    
    const totalPayable = newOutstanding + (newOutstanding * (rate / 100)) * newPeriod;
    const sumSoFar = newEmi * (newPeriod - 1);
    lastEmi = totalPayable - sumSoFar;

    const oldInterestRemaining = (prevEmi * prevPeriod) - outstanding;
    const newInterestRemaining = (newOutstanding * (rate / 100)) * newPeriod;
    const interestSaved = oldInterestRemaining - newInterestRemaining;

    setPreview({
      requiredLumpSum,
      newOutstanding,
      newPeriod,
      newEmi,
      lastEmi,
      prevEmi,
      prevPeriod,
      interestSaved
    });

  }, [targetValue, mode, loan, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error || !preview) return;
    
    onConfirm({
      mode,
      targetValue: Number(targetValue)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restructure Loan">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Mode Selection Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('lower-emi')}
            className={clsx(
              "flex flex-col items-start p-4 border rounded-xl transition-all text-left",
              mode === 'lower-emi' 
                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:border-primary-500" 
                : "border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-gray-600"
            )}
          >
            <ArrowTrendingDownIcon className={clsx("h-6 w-6 mb-2", mode === 'lower-emi' ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
            <span className={clsx("font-semibold text-sm", mode === 'lower-emi' ? "text-primary-900 dark:text-white" : "text-gray-900 dark:text-white")}>Lower EMI</span>
            <span className="text-xs text-gray-500 mt-1">Keep the same duration, reduce monthly payments.</span>
          </button>
          
          <button
            type="button"
            onClick={() => setMode('shorten-period')}
            className={clsx(
              "flex flex-col items-start p-4 border rounded-xl transition-all text-left",
              mode === 'shorten-period' 
                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:border-primary-500" 
                : "border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-gray-600"
            )}
          >
            <ArrowsRightLeftIcon className={clsx("h-6 w-6 mb-2", mode === 'shorten-period' ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
            <span className={clsx("font-semibold text-sm", mode === 'shorten-period' ? "text-primary-900 dark:text-white" : "text-gray-900 dark:text-white")}>Shorten Period</span>
            <span className="text-xs text-gray-500 mt-1">Keep EMI same, finish the loan faster.</span>
          </button>
        </div>

        <div>
          <Input
            label={mode === 'lower-emi' ? 'Target Monthly EMI (₹) *' : 'Target Remaining Period (Months) *'}
            type="number"
            step={mode === 'lower-emi' ? '0.01' : '1'}
            min="1"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={mode === 'lower-emi' ? 'e.g. 10000' : 'e.g. 8'}
            className="text-lg"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {preview && !error && (
          <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-5 dark:border-primary-900/30 dark:bg-primary-900/10 space-y-4">
            <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Restructure Preview
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <p className="font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Current Schedule</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-medium text-gray-900 dark:text-white">{preview.prevPeriod} months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">EMI</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(preview.prevEmi)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(currentOutstanding)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="font-medium text-primary-700 dark:text-primary-400 border-b border-primary-200 dark:border-primary-800 pb-2">New Schedule</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-medium text-primary-700 dark:text-primary-400">{preview.newPeriod} months</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 pt-1">EMI</span>
                  <span className="font-medium text-primary-700 dark:text-primary-400 text-right">
                    {preview.newPeriod > 1 ? (
                      <span className="flex flex-col gap-1">
                        <span>{formatCurrency(preview.newEmi)} <span className="text-xs opacity-75 font-normal">× {preview.newPeriod - 1}</span></span>
                        <span>{formatCurrency(preview.lastEmi)} <span className="text-xs opacity-75 font-normal">× 1 (Last)</span></span>
                      </span>
                    ) : (
                      formatCurrency(preview.newEmi)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="font-medium text-primary-700 dark:text-primary-400">{formatCurrency(preview.newOutstanding)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-800 flex justify-between items-center bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Total Interest Saved</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Math.max(0, preview.interestSaved))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">To Pay Now</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(preview.requiredLumpSum)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !!error || !targetValue}>
            {isSubmitting ? 'Processing...' : 'Confirm Restructure'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

