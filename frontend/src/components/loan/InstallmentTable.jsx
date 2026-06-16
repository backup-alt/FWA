import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/Table';
import { InstallmentRow } from './InstallmentRow';
import { formatCurrency, formatDate, formatDateInput } from '@/api';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

function roundMoney(value) {
  return +Number(value || 0).toFixed(2);
}

function hasActivity(inst) {
  return (
    Number(inst.amountReceived || 0) > 0 ||
    Boolean(inst.dateReceived) ||
    inst.status === 'Paid' ||
    inst.status === 'Partial'
  );
}

function normalizeInstallments(installments = []) {
  const normalized = installments
    .map((inst) => ({
      ...inst,
      dueAmount: roundMoney(Number(inst.dueAmount || 0) - Number(inst.adjustment || 0)),
      adjustment: 0,
      pendingAmount: 0,
      shortfallAmount: 0,
      extraAmount: 0,
    }))
    .sort((a, b) => a.sNo - b.sNo);

  let carry = 0;
  let carriedDisplayPlaced = false;

  normalized.forEach((inst) => {
    const dueAmount = roundMoney(inst.dueAmount);
    const received = roundMoney(inst.amountReceived);

    if (hasActivity(inst)) {
      const requiredAmount = roundMoney(dueAmount + Math.max(carry, 0) - Math.max(-carry, 0));
      const nextCarry = roundMoney(Math.max(requiredAmount, 0) - received);
      const credit = roundMoney(received - Math.max(requiredAmount, 0));

      inst.shortfallAmount = received < dueAmount && nextCarry > 0 ? nextCarry : 0;
      inst.extraAmount = credit > 0 ? credit : 0;
      carry = nextCarry > 0 ? nextCarry : credit > 0 ? -credit : 0;
      carriedDisplayPlaced = false;
      return;
    }

    if (carry > 0 && !carriedDisplayPlaced) {
      inst.pendingAmount = carry;
      carriedDisplayPlaced = true;
    } else if (carry < 0 && !carriedDisplayPlaced) {
      inst.extraAmount = Math.abs(carry);
      carriedDisplayPlaced = true;
    }
  });

  if (carry > 0 && !carriedDisplayPlaced && normalized.length > 0) {
    normalized[normalized.length - 1].pendingAmount = carry;
  } else if (carry < 0 && !carriedDisplayPlaced && normalized.length > 0) {
    normalized[normalized.length - 1].extraAmount = Math.abs(carry);
  }

  return normalized;
}

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export function InstallmentTable({ loan, onRecordPayment, saving }) {
  const [optimisticData, setOptimisticData] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const installments = normalizeInstallments(loan.installments);

  const handleSave = async (sNo, paymentData) => {
    setOptimisticData(prev => ({ ...prev, [sNo]: paymentData }));
    try {
      const updatedLoan = await onRecordPayment(sNo, paymentData);
      setOptimisticData(prev => {
        const next = { ...prev };
        delete next[sNo];
        return next;
      });
      return updatedLoan;
    } catch (err) {
      setOptimisticData(prev => {
        const next = { ...prev };
        delete next[sNo];
        return next;
      });
      throw err;
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmation) return;

    const { installment, complete } = confirmation;

    await handleSave(installment.sNo, {
      sNo: installment.sNo,
      dueAmount: installment.dueAmount || 0,
      dueDate: formatDateInput(installment.dueDate),
      amountReceived: complete ? (installment.dueAmount || 0) : 0,
      dateReceived: complete ? (formatDateInput(installment.dateReceived) || todayInputValue()) : null,
      completed: complete,
    });

    setConfirmation(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Due Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount Received</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Extra</TableHead>
              <TableHead>Date Received</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map(inst => (
              <InstallmentRow
                key={inst.sNo}
                inst={inst}
                loan={loan}
                onSave={handleSave}
                onToggleComplete={(installment) => setConfirmation({
                  installment,
                  complete: installment.status !== 'Paid',
                })}
                saving={saving}
                optimisticData={optimisticData[inst.sNo]}
              />
            ))}
          </TableBody>
        </Table>

      </div>

      <Modal
        isOpen={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        title={confirmation?.complete ? 'Mark Installment Completed' : 'Reopen Installment'}
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {confirmation?.complete
            ? `This will mark installment #${confirmation.installment.sNo} as completed and set the received amount to ${formatCurrency(confirmation.installment.dueAmount)}.`
            : `This will reopen installment #${confirmation?.installment.sNo} and clear the received amount and received date.`}
        </p>
        {confirmation?.complete && Number(confirmation.installment.pendingAmount || 0) > 0 && (
          <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            The carried pending balance of {formatCurrency(confirmation.installment.pendingAmount)} will remain open and move to the next installment.
          </p>
        )}
        {confirmation?.complete && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Received date will be set to {formatDate(formatDateInput(confirmation.installment.dateReceived) || todayInputValue())}.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmation(null)}>Cancel</Button>
          <Button onClick={handleConfirmToggle} loading={saving}>
            {confirmation?.complete ? 'Mark Completed' : 'Reopen'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
