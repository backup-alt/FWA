import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/api';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function roundMoney(value) {
  return +Number(value || 0).toFixed(2);
}

export function PrepaymentPlanner({ loan }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('emi'); // 'emi' or 'period'
  const [targetEmi, setTargetEmi] = useState('');
  const [targetPeriod, setTargetPeriod] = useState('');

  const installments = loan?.installments || [];
  const unacted = installments.filter(inst => inst.status !== 'Paid' && inst.status !== 'Partial' && Number(inst.amountReceived || 0) === 0);
  
  // Find the exact next due row to compute any pending values
  const nextOpenIdx = installments.findIndex(inst => inst.status !== 'Paid' && inst.status !== 'Partial' && Number(inst.amountReceived || 0) === 0);
  const nextOpenInst = nextOpenIdx !== -1 ? installments[nextOpenIdx] : null;

  const currentEmi = nextOpenInst ? roundMoney(Number(nextOpenInst.dueAmount || 0) - Number(nextOpenInst.adjustment || 0)) : 0;
  const currentPending = nextOpenInst ? Number(nextOpenInst.pendingAmount || 0) : 0;
  const currentPeriod = unacted.length;

  // Mode: Target EMI
  const tEmi = Number(targetEmi);
  let emiExtraNeeded = 0;
  if (tEmi > 0 && tEmi < currentEmi && currentPeriod > 1) {
    const drop = currentEmi - tEmi;
    // The drop needs to be distributed over the SUBSEQUENT unacted installments
    emiExtraNeeded = roundMoney(drop * (currentPeriod - 1));
  }

  // Mode: Target Period
  const tPeriod = parseInt(targetPeriod, 10);
  let periodExtraNeeded = 0;
  if (tPeriod > 0 && tPeriod < currentPeriod && currentPeriod > 0) {
    const remainingPrincipal = roundMoney(currentEmi * currentPeriod);
    const targetPrincipal = roundMoney(currentEmi * tPeriod);
    periodExtraNeeded = roundMoney(remainingPrincipal - targetPrincipal);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        <CalculatorIcon className="mr-2 -ml-1 h-5 w-5" />
        Prepayment Planner
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Prepayment Planner"
        size="lg"
      >
        <div className="space-y-6 text-gray-900 dark:text-gray-100 p-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Calculate exactly how much extra the client needs to pay today to reach their desired goal.
          </p>

          {currentPeriod === 0 ? (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-gray-500">
              This loan has no remaining unacted installments.
            </div>
          ) : (
            <>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  className={clsx(
                    'flex-1 py-1.5 text-sm font-medium rounded-md',
                    mode === 'emi' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                  onClick={() => setMode('emi')}
                >
                  Lower EMI
                </button>
                <button
                  className={clsx(
                    'flex-1 py-1.5 text-sm font-medium rounded-md',
                    mode === 'period' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                  onClick={() => setMode('period')}
                >
                  Shorten Period
                </button>
              </div>

              {mode === 'emi' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target EMI Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={targetEmi}
                        onChange={e => setTargetEmi(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 py-3 pl-8 text-lg focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder={`Current: ${currentEmi}`}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Current EMI is {formatCurrency(currentEmi)} with {currentPeriod} installments remaining.
                    </p>
                  </div>

                  {emiExtraNeeded > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Required Payment Today</h4>
                      <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                        <li className="flex justify-between">
                          <span>Base Installment:</span>
                          <span>{formatCurrency(currentEmi)}</span>
                        </li>
                        {currentPending > 0 && (
                          <li className="flex justify-between">
                            <span>Pending Dues:</span>
                            <span>{formatCurrency(currentPending)}</span>
                          </li>
                        )}
                        <li className="flex justify-between font-medium">
                          <span>Extra Prepayment Needed:</span>
                          <span>{formatCurrency(emiExtraNeeded)}</span>
                        </li>
                        <li className="flex justify-between font-bold pt-2 border-t border-green-200 dark:border-green-800 mt-2">
                          <span>Total to Pay:</span>
                          <span>{formatCurrency(currentEmi + currentPending + emiExtraNeeded)}</span>
                        </li>
                      </ul>
                      <p className="mt-3 text-xs text-green-600 dark:text-green-500">
                        Record this total payment on the next row. The system will automatically lower all future EMIs to exactly {formatCurrency(tEmi)}.
                      </p>
                    </div>
                  )}
                  {tEmi >= currentEmi && targetEmi !== '' && (
                    <p className="text-sm text-red-500">Target EMI must be less than current EMI.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Remaining Months
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={targetPeriod}
                      onChange={e => setTargetPeriod(e.target.value)}
                      className="mt-1 block w-full rounded-lg border-gray-300 py-3 px-4 text-lg focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder={`Current: ${currentPeriod}`}
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Currently {currentPeriod} installments remaining. Keep EMI at {formatCurrency(currentEmi)}.
                    </p>
                  </div>

                  {periodExtraNeeded > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Required Payment Today</h4>
                      <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-400">
                        <li className="flex justify-between font-medium">
                          <span>Extra Prepayment Needed:</span>
                          <span>{formatCurrency(periodExtraNeeded)}</span>
                        </li>
                        <li className="flex justify-between font-bold pt-2 border-t border-blue-200 dark:border-blue-800 mt-2">
                          <span>Total to Pay Today:</span>
                          <span>{formatCurrency(currentEmi + currentPending + periodExtraNeeded)}</span>
                        </li>
                      </ul>
                      <div className="mt-3 space-y-2 text-xs text-blue-600 dark:text-blue-500">
                        <p>1. Record this total payment on the next row.</p>
                        <p>2. Then, use the <strong>Edit Period</strong> button to change the loan period to end in {tPeriod} months.</p>
                      </div>
                    </div>
                  )}
                  {tPeriod >= currentPeriod && targetPeriod !== '' && (
                    <p className="text-sm text-red-500">Target period must be less than current period.</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
