import { useState } from 'react';
import { clsx } from 'clsx';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  TrashIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useLoan, useUpdateLoan, useRecordPayment, useDeleteLoan, useCloseLoan, useRestructureLoan } from '@/hooks/useLoans';
import { useCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { InstallmentTable } from '@/components/loan/InstallmentTable';
import { PeriodEditor } from '@/components/loan/PeriodEditor';
import { CloseLoanModal } from '@/components/loan/CloseLoanModal';
import { RestructureModal } from '@/components/loan/RestructureModal';
import { DocumentsTab } from '@/components/loan/DocumentsTab';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/api';
import { Loans } from '@/api';
import { useQueryClient } from '@tanstack/react-query';

const statusColors = {
  Active: 'info',
  Completed: 'success',
};

export function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { data: loan, isLoading, refetch } = useLoan(id);
  const { data: customerData } = useCustomer(loan?.customerId);
  const customer = customerData?.customer;
  const updateLoan = useUpdateLoan();
  const recordPayment = useRecordPayment();
  const deleteLoan = useDeleteLoan();
  const closeLoan = useCloseLoan();
  const restructureLoan = useRestructureLoan();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showRestructureModal, setShowRestructureModal] = useState(false);
  const [savingInstallment, setSavingInstallment] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');

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
    if (loan.customerId) {
      navigate(`/customer/${loan.customerId}`);
    } else {
      navigate('/');
    }
  };

  const handleUploadDocument = async (docData) => {
    await Loans.uploadDocument(id, docData);
    qc.invalidateQueries({ queryKey: ['loan', id] });
  };

  const handleDeleteDocument = async (docId) => {
    await Loans.deleteDocument(id, docId);
    qc.invalidateQueries({ queryKey: ['loan', id] });
  };

  const handleCloseLoan = async (data) => {
    await closeLoan.mutateAsync({ id, data });
    showToast('Loan closed successfully', 'success');
    setShowCloseModal(false);
  };

  const handleRestructure = async (data) => {
    await restructureLoan.mutateAsync({ id, data });
    showToast('Loan restructured successfully', 'success');
    setShowRestructureModal(false);
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

  const tabs = [
    { id: 'schedule', label: 'Installment Schedule' },
    { id: 'documents', label: 'Documents' },
    { id: 'client', label: 'Client Details' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <NavLink
            to={loan.customerId ? `/customer/${loan.customerId}` : "/"}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </NavLink>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
              {loan.vehicleType} - {loan.make || ''} {loan.model || ''}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="truncate">{loan.customerName}</span>
              <span>•</span>
              <span>{loan.regNo}</span>
              {loan.loanAccountNumber && (
                <>
                  <span>•</span>
                  <span>Acct: {loan.loanAccountNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={statusColors[loan.status] || 'gray'} className="text-sm">
            {loan.status}
          </Badge>
          {loan.status === 'Active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseModal(true)}
            >
              Close Loan
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-red-500 hover:text-red-600"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete loan"
          >
            <TrashIcon className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>

      {loan.status === 'Closed' && loan.closureInfo && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Loan Closed</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Reason</p>
              <p className="font-medium text-gray-900 dark:text-white">{loan.closureInfo.reason}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Amount Received</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(loan.closureInfo.amountReceived)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Closure Date</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(loan.closureInfo.closureDate)}</p>
            </div>
            {loan.closureInfo.remarks && (
              <div className="col-span-2 md:col-span-1">
                <p className="text-gray-500 dark:text-gray-400">Remarks</p>
                <p className="font-medium text-gray-900 dark:text-white">{loan.closureInfo.remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payable</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(loan.financeAmount + loan.interestAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</p>
            <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(loan.totalPaid || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Principal</p>
            <p className="mt-1 text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {formatCurrency(loan.outstandingPrincipal || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Installments</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {pendingInstallments.length} / {loan.installmentPeriod}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <Card padding="">
            <CardHeader
              className="px-5 pt-5 mb-0 border-b border-gray-200 dark:border-gray-700 pb-4"
              title="Installment Schedule"
              subtitle="Track and record installment payments"
              action={
                <div className="flex gap-2">
                  {loan.status === 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRestructureModal(true)}
                    >
                      Restructure
                    </Button>
                  )}
                  {loan.status === 'Active' && (
                    <PeriodEditor
                      loan={scheduleLoan}
                      onUpdate={handlePeriodUpdate}
                    />
                  )}
                </div>
              }
            />
            <CardContent className="p-0">
              <InstallmentTable
                loan={scheduleLoan}
                onRecordPayment={handleRecordPayment}
                saving={savingInstallment !== null}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader title="Loan Documents" subtitle="Upload receipts, RC copies, and other relevant files" />
          <CardContent className="p-5">
            <DocumentsTab 
              loanId={id} 
              documents={loan.documents || []} 
              onUpload={handleUploadDocument}
              onDelete={handleDeleteDocument}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'client' && customer && (
        <div className="space-y-6">
          <Card padding="">
            <CardHeader 
              className="px-5 pt-5 mb-0" 
              title="Client Details" 
              subtitle="Vehicle, documentation, customer, and loan terms" 
            />
            <CardContent className="p-5">
              <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:grid-cols-2">
                {[
                  ['Vehicle', `${loan.vehicleType || '-'} - ${loan.make || ''} ${loan.model || ''}`],
                  ['Registration No.', loan.regNo || '-'],
                  ['Loan Amount (L.AMT)', formatCurrency(loan.loanAmount || 0)],
                  ['Finance Amount (F.AMT)', formatCurrency(loan.financeAmount || 0)],
                  ['Loan Start Date', formatDate(loan.loanStartDate)],
                  ['Interest', `${formatCurrency(loan.interestAmount || 0)} (${loan.interestRate || 0}% flat per month)`],
                  ['Address', customer.address || '-'],
                  ['Cell Numbers', (customer.cellNumbers || []).map(c => c.number).join(', ') || '-'],
                  ['Guarantor', customer.guarantor?.name ? `${customer.guarantor.name} ${customer.guarantor.address ? `(${customer.guarantor.address})` : ''}` : '-'],
                  ['RC Status', loan.rcDetails?.status || '-'],
                  ['NOC', loan.noc || '-'],
                  ['Insurance', loan.insurance || '-'],
                  ['ID Proof', customer.idProofType ? `${customer.idProofType} - ${customer.idProofNumber || ''}` : '-'],
                  ['Monthly Salary', customer.monthlySalary ? formatCurrency(customer.monthlySalary) : '-'],
                  ['Key Status', loan.keyStatus || '-'],
                  ['Sales Done By', loan.salesDoneBy || '-'],
                  ['Cheques Received', (loan.chequesReceived || []).length > 0 ? loan.chequesReceived.map(c => c.chequeNumber).join(', ') : '-'],
                  ['', '']
                ].map(([label, value], idx, arr) => (
                  <div 
                    key={idx} 
                    className={`border-gray-200 p-4 dark:border-gray-700 sm:odd:border-r ${
                      idx >= arr.length - 2 ? '' : 'border-b'
                    }`}
                  >
                    {label ? (
                      <>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                        <dd className="mt-1 text-sm font-medium text-gray-950 dark:text-white">{value}</dd>
                      </>
                    ) : null}
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      <CloseLoanModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseLoan}
        isSubmitting={closeLoan.isPending}
      />

      <RestructureModal
        isOpen={showRestructureModal}
        onClose={() => setShowRestructureModal(false)}
        onConfirm={handleRestructure}
        isSubmitting={restructureLoan.isPending}
        loan={loan}
      />

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Loan"
        size="sm"
      >
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this loan for <strong>{loan.customerName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
