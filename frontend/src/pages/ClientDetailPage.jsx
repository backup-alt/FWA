import { useState } from 'react';
import { clsx } from 'clsx';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLoan, useUpdateLoan, useRecordPayment, useDeleteLoan } from '@/hooks/useLoans';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { InstallmentTable } from '@/components/loan/InstallmentTable';
import { PeriodEditor } from '@/components/loan/PeriodEditor';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/api';

const statusColors = {
  Active: 'info',
  Completed: 'success',
};

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: loan, isLoading, refetch } = useLoan(id);
  const updateLoan = useUpdateLoan();
  const recordPayment = useRecordPayment();
  const deleteLoan = useDeleteLoan();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingInstallment, setSavingInstallment] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const handlePeriodUpdate = async (newPeriod, newUnit) => {
    await updateLoan.mutateAsync({ id, data: { installmentPeriod: newPeriod, installmentPeriodUnit: newUnit } });
    showToast('Installment period updated', 'success');
    refetch();
  };

  const handleRecordPayment = async (sNo, paymentData) => {
    setSavingInstallment(sNo);
    try {
      await recordPayment.mutateAsync({ id, sNo, data: paymentData });
      showToast('Installment updated', 'success');
      refetch();
    } finally {
      setSavingInstallment(null);
    }
  };

  const handleDelete = async () => {
    await deleteLoan.mutateAsync(id);
    showToast('Loan deleted', 'success');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="mx-auto max-w-7xl py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan not found</h1>
        <NavLink to="/" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to dashboard
        </NavLink>
      </div>
    );
  }

  const installments = loan.installments || [];
  const pendingInstallments = installments.filter(installment => installment.status !== 'Paid');
  const scheduleLoan = { ...loan, installments };
  const overdueCount = pendingInstallments.filter(installment => installment.status === 'Overdue').length;
  const pendingTotal = pendingInstallments.reduce((sum, installment) => (
    sum + Math.max((installment.dueAmount || 0) - (installment.amountReceived || 0), 0)
  ), 0);
  const nextDue = pendingInstallments[0];

  const detailRows = [
    ['Vehicle', `${loan.vehicleType} - ${loan.make || '-'} ${loan.model || ''}`],
    ['Registration No.', loan.regNo || '-'],
    ['Loan Amount (L.AMT)', formatCurrency(loan.loanAmount)],
    ['Finance Amount (F.AMT)', formatCurrency(loan.financeAmount)],
    ['Loan Start Date', formatDate(loan.loanStartDate)],
    ['Interest', `${formatCurrency(loan.interestAmount)} (${loan.interestRate}% annual flat rate)`],
    ['Address', loan.address || '-'],
    ['Cell Numbers', (loan.cellNumbers || []).map(cell => cell.number).join(', ') || '-'],
    ['Guarantor', `${loan.guarantor?.name || '-'}${loan.guarantor?.address ? ` - ${loan.guarantor.address}` : ''}`],
    ['RC Status', `${loan.rcDetails?.status || '-'}${loan.rcDetails?.paidThrough ? ` via ${loan.rcDetails.paidThrough}` : ''}`],
    ['NOC', loan.noc || '-'],
    ['Insurance', loan.insurance || '-'],
    ['ID Proof', loan.idProofType ? `${loan.idProofType}: ${loan.idProofNumber || '-'}` : '-'],
    ['Monthly Salary', loan.monthlySalary ? formatCurrency(loan.monthlySalary) : '-'],
    ['Key Status', loan.keyStatus || '-'],
    ['Sales Done By', loan.salesDoneBy || '-'],
    ['Cheques Received', (loan.chequesReceived || []).map(cheque => (
      `${cheque.chequeNumber}${cheque.bank ? ` - ${cheque.bank}` : ''} (${formatCurrency(cheque.amount)})`
    )).join(', ') || '-'],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <NavLink to="/" className="mt-1 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <ArrowLeftIcon className="h-5 w-5" />
          </NavLink>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="min-w-0 truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{loan.customerName}</h1>
              <Badge variant={statusColors[loan.status] || 'gray'} className="text-sm">
                {loan.status}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
              {loan.vehicleType} loan file {loan.regNo ? `- ${loan.regNo}` : ''}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-1 shrink-0 px-2 text-red-500 hover:text-red-600"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Delete loan"
        >
          <TrashIcon className="h-5 w-5 text-red-500" />
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={clsx(
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
            )}
          >
            Client Details
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={clsx(
              activeTab === 'schedule'
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
              'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
            )}
          >
            Installment Schedule
          </button>
        </nav>
      </div>

      {activeTab === 'details' ? (
        <Card padding="">
        <CardHeader className="px-5 pt-5 mb-0" title="Client Details" subtitle="Vehicle, documentation, customer, and loan terms" />
        <CardContent className="p-5">
          <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:grid-cols-2">
            {detailRows.map(([label, value]) => (
              <div key={label} className="border-b border-gray-200 p-4 last:border-b-0 dark:border-gray-700 sm:odd:border-r">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-950 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Monthly due</p>
                  <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{formatCurrency(loan.emiAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Outstanding</p>
                  <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{formatCurrency(loan.outstandingPrincipal)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total paid</p>
                  <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{formatCurrency(loan.totalPaid)}</p>
                </div>
              </div>
              <PeriodEditor loan={loan} onUpdate={handlePeriodUpdate} updating={updateLoan.isPending} />
            </div>
          </div>
        </CardContent>
      </Card>
      ) : (
      <Card padding="">
        <CardHeader
          className="px-5 pt-5 mb-0"
          title="Installment Schedule"
          subtitle={
            pendingInstallments.length
              ? `${pendingInstallments.length} unpaid installment${pendingInstallments.length === 1 ? '' : 's'} - ${formatCurrency(pendingTotal)} pending`
              : 'All installments completed'
          }
          action={
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {overdueCount > 0 && <Badge variant="danger">{overdueCount} overdue</Badge>}
              {nextDue && <span className="text-gray-500 dark:text-gray-400">Next due {formatDate(nextDue.dueDate)}</span>}
            </div>
          }
        />
        <CardContent className="p-5">
          {installments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              This client does not have an installment schedule yet.
            </div>
          ) : (
            <InstallmentTable
              loan={scheduleLoan}
              onRecordPayment={handleRecordPayment}
              saving={savingInstallment}
            />
          )}
        </CardContent>
      </Card>
      )}

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Loan"
        size="sm"
      >
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this loan? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
