import { formatCurrency, formatDate, formatDateInput } from '@/api';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DatePicker } from '@/components/ui/DatePicker';

export function InstallmentRow({ 
  inst, 
  loan, 
  onSave, 
  onToggleComplete,
  saving,
  optimisticData 
}) {
  const isLocked = loan.status === 'Completed';
  const data = optimisticData || inst;
  const isCompleted = data.status === 'Paid';
  const [editing, setEditing] = useState(false);
  const [localSNo, setLocalSNo] = useState(data.sNo || '');
  const [localDueAmount, setLocalDueAmount] = useState(data.dueAmount || '');
  const [localDueDate, setLocalDueDate] = useState(formatDateInput(data.dueDate));
  const [localAmount, setLocalAmount] = useState(data.amountReceived || '');
  const [localDate, setLocalDate] = useState(formatDateInput(data.dateReceived));

  useEffect(() => {
    if (!editing) {
      setLocalSNo(data.sNo || '');
      setLocalDueAmount(data.dueAmount || '');
      setLocalDueDate(formatDateInput(data.dueDate));
      setLocalAmount(data.amountReceived || '');
      setLocalDate(formatDateInput(data.dateReceived));
    }
  }, [data.amountReceived, data.dateReceived, data.dueAmount, data.dueDate, data.sNo, editing]);

  const resetLocalState = () => {
    setLocalSNo(data.sNo || '');
    setLocalDueAmount(data.dueAmount || '');
    setLocalDueDate(formatDateInput(data.dueDate));
    setLocalAmount(data.amountReceived || '');
    setLocalDate(formatDateInput(data.dateReceived));
  };

  const handleSave = async () => {
    await onSave(inst.sNo, {
      sNo: +localSNo || inst.sNo,
      dueAmount: +localDueAmount || 0,
      dueDate: localDueDate,
      amountReceived: +localAmount || 0,
      dateReceived: localDate || null,
    });
    setEditing(false);
  };

  return (
    <tr className={clsx('border-b border-gray-200 dark:border-gray-700', data.status === 'Overdue' && 'bg-red-50 dark:bg-red-900/20')}>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
        {editing ? (
          <input
            type="number"
            min="1"
            step="1"
            value={localSNo}
            onChange={e => setLocalSNo(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            disabled={isLocked}
          />
        ) : (
          <span className="font-medium">{data.sNo}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
        {editing ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={localDueAmount}
            onChange={e => setLocalDueAmount(e.target.value)}
            className="w-32 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            disabled={isLocked}
          />
        ) : (
          <span className="font-medium">{formatCurrency(data.dueAmount)}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {editing ? (
          <DatePicker
            value={localDueDate}
            onChange={setLocalDueDate}
            disabled={isLocked}
            allowClear={false}
            ariaLabel="Select due date"
          />
        ) : (
          formatDate(data.dueDate)
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={localAmount}
            onChange={e => setLocalAmount(e.target.value)}
            className="w-32 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            disabled={isLocked}
          />
        ) : (
          <span className={clsx('font-medium', data.amountReceived > 0 && 'text-green-600')}>
            {data.amountReceived ? formatCurrency(data.amountReceived) : '-'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        {(() => {
          const due = data.dueAmount || 0;
          const received = data.amountReceived || 0;
          if (received > 0 && received < due) {
            const pendingAmt = due - received;
            return <span className="text-red-500">{formatCurrency(pendingAmt)}</span>;
          }
          return <span className="text-gray-400">-</span>;
        })()}
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        {(() => {
          const due = data.dueAmount || 0;
          const received = data.amountReceived || 0;
          const extraAmt = Math.max(received - due, 0);
          if (extraAmt > 0) return <span className="text-green-500">{formatCurrency(extraAmt)}</span>;
          return <span className="text-gray-400">-</span>;
        })()}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {editing ? (
          <DatePicker
            value={localDate}
            onChange={setLocalDate}
            disabled={isLocked}
            placeholder="Not received"
            ariaLabel="Select received date"
          />
        ) : (
          data.dateReceived ? formatDate(data.dateReceived) : '-'
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={isCompleted}
          disabled={isLocked || saving}
          onClick={() => onToggleComplete(inst)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium transition',
            isCompleted
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-primary-200 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
            (isLocked || saving) && 'cursor-not-allowed opacity-60'
          )}
        >
          <span
            className={clsx(
              'relative h-5 w-9 rounded-full transition',
              isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                isCompleted ? 'left-4' : 'left-0.5'
              )}
            />
          </span>
          {isCompleted ? 'Completed' : 'Pending'}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!editing && !isLocked && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
              aria-label="Edit installment"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary-600 p-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
                aria-label="Save installment"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => { resetLocalState(); setEditing(false); }}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                aria-label="Cancel editing"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
