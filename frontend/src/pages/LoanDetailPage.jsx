import { useState } from 'react';
import { clsx } from 'clsx';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useLoan, useUpdateLoan, useRecordPayment, useCloseLoan, useRestructureLoan } from '@/hooks/useLoans';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InstallmentTable } from '@/components/loan/InstallmentTable';
import { PeriodEditor } from '@/components/loan/PeriodEditor';
import { CloseLoanModal } from '@/components/loan/CloseLoanModal';
import { RestructureModal } from '@/components/loan/RestructureModal';
import { EditLoanForm } from '@/components/loan/EditLoanForm';
import { DocumentsTab } from '@/components/loan/DocumentsTab';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/api';
import { Loans } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import bikeIcon from '../../../bike-svgrepo-com.svg';
import carIcon from '../../../car-svgrepo-com.svg';
const autoIcon = '/FWA/icons8-auto-rickshaw-50.png';

const statusColors = {
  Active: 'info',
  Completed: 'success',
};

function EditCustomerForm({ customer, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    customerName: customer.name || '',
    address: customer.address || '',
    temporaryAddress: customer.temporaryAddress || '',
    monthlySalary: customer.monthlySalary || '',
    cellNumbers: customer.cellNumbers?.length ? customer.cellNumbers : [{ number: '' }],
    guarantor: { name: '', address: '', mobile: '', ...(customer.guarantor || {}) },
    idProofType: customer.idProofType || '',
    idProofNumber: customer.idProofNumber || '',
    idStatus: customer.idStatus || '',
    profileImage: customer.profileImage || '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCellChange = (index, value) => {
    const newCells = [...formData.cellNumbers];
    newCells[index] = { number: value };
    setFormData(prev => ({ ...prev, cellNumbers: newCells }));
  };

  const handleGuarantorChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      guarantor: { ...prev.guarantor, [field]: value }
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setFormData(prev => ({ ...prev, profileImage: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      name: formData.customerName,
      address: formData.address,
      temporaryAddress: formData.temporaryAddress || undefined,
      monthlySalary: formData.monthlySalary ? Number(formData.monthlySalary) : undefined,
      cellNumbers: formData.cellNumbers.filter(c => c.number).map(c => ({ number: c.number })),
      guarantor: (formData.guarantor.name || formData.guarantor.address || formData.guarantor.mobile) ? formData.guarantor : undefined,
      idProofType: formData.idProofType || undefined,
      idProofNumber: formData.idProofNumber || undefined,
      idStatus: formData.idStatus || undefined,
      profileImage: formData.profileImage || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          {formData.profileImage ? (
            <img src={formData.profileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-gray-400">
              {formData.customerName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 cursor-pointer">
            {formData.profileImage ? 'Replace Photo' : 'Upload Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
          </label>
          {formData.profileImage && (
            <button
              type="button"
              onClick={handleRemoveProfileImage}
              className="text-xs text-red-600 hover:underline"
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>
      <Input
        label="Customer Name"
        value={formData.customerName}
        onChange={(e) => handleChange('customerName', e.target.value)}
      />
      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
      />
      <Input
        label="Temporary Address"
        value={formData.temporaryAddress}
        onChange={(e) => handleChange('temporaryAddress', e.target.value)}
      />
      <Input
        label="Monthly Salary"
        type="number"
        value={formData.monthlySalary}
        onChange={(e) => handleChange('monthlySalary', e.target.value)}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contact Numbers
        </label>
        <div className="space-y-3">
          {formData.cellNumbers.map((cell, index) => (
            <input
              key={index}
              type="tel"
              value={cell.number}
              onChange={(e) => handleCellChange(index, e.target.value)}
              placeholder="Phone number"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Guarantor Name"
          value={formData.guarantor.name}
          onChange={(e) => handleGuarantorChange('name', e.target.value)}
        />
        <Input
          label="Guarantor Mobile"
          type="tel"
          value={formData.guarantor.mobile}
          onChange={(e) => handleGuarantorChange('mobile', e.target.value)}
        />
        <Input
          label="Guarantor Address"
          className="sm:col-span-2"
          value={formData.guarantor.address}
          onChange={(e) => handleGuarantorChange('address', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="ID Proof Type"
          value={formData.idProofType}
          onChange={(e) => handleChange('idProofType', e.target.value)}
        />
        <Input
          label="ID Proof Number"
          value={formData.idProofNumber}
          onChange={(e) => handleChange('idProofNumber', e.target.value)}
        />
        <Select
          label="ID Status"
          value={formData.idStatus}
          onChange={(value) => handleChange('idStatus', value)}
          options={[
            { value: '', label: 'Select' },
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
          ]}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </div>
    </form>
  );
}

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
  const closeLoan = useCloseLoan();
  const restructureLoan = useRestructureLoan();
  const updateCustomer = useUpdateCustomer();

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showRestructureModal, setShowRestructureModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showEditLoanModal, setShowEditLoanModal] = useState(false);
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

  const handleUploadDocument = async (docData) => {
    await Loans.uploadDocument(id, docData);
    qc.invalidateQueries({ queryKey: ['loan', id] });
  };

  const handleDeleteDocument = async (docId) => {
    await Loans.deleteDocument(id, docId);
    qc.invalidateQueries({ queryKey: ['loan', id] });
  };

  const handleCloseLoan = async (data) => {
    try {
      const isUpdate = data.updateOnly;
      await closeLoan.mutateAsync({ id, data });
      showToast(isUpdate ? 'Closure details updated' : 'Loan closed successfully', 'success');
      setShowCloseModal(false);
      refetch();
    } catch (err) {
      showToast(err?.message || 'Failed to update closure details', 'error');
    }
  };

  const handleRestructure = async (data) => {
    await restructureLoan.mutateAsync({ id, data });
    showToast('Loan restructured successfully', 'success');
    setShowRestructureModal(false);
  };

  const handleUpdateCustomer = async (data) => {
    await updateCustomer.mutateAsync({ id: loan.customerId, data });
    showToast('Customer updated successfully', 'success');
    setShowEditCustomerModal(false);
    refetch();
  };

  const handleUpdateLoan = async (data) => {
    await updateLoan.mutateAsync({ id, data });
    showToast('Loan updated successfully', 'success');
    setShowEditLoanModal(false);
    refetch();
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingInstallments = installments.filter(inst => {
    if (!inst.status || inst.status === 'Paid' || inst.status === 'Cancelled') return false;
    if (loan.status === 'Closed' || loan.status === 'Completed') return false;
    if (!inst.dueDate) return false;
    const due = new Date(inst.dueDate);
    if (Number.isNaN(due.getTime())) return false;
    return due <= today;
  });
  const scheduleLoan = { ...loan, installments };

  const tabs = [
    { id: 'schedule', label: 'Installment Schedule' },
    { id: 'documents', label: 'Documents' },
    { id: 'client', label: 'Customer Details' },
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
            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {loan.vehicleType === 'Bike' ? (
                <img src={bikeIcon} alt="Bike" className="h-8 w-8 shrink-0" />
              ) : loan.vehicleType === 'Car' ? (
                <img src={carIcon} alt="Car" className="h-8 w-8 shrink-0" />
              ) : (
                <img src={autoIcon} alt="Auto" className="h-8 w-8 shrink-0" />
              )}
              <span>{loan.vehicleType} - {loan.make || ''} {loan.model || ''}</span>
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="truncate">{customer?.name}</span>
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
          {(loan.status === 'Active' || loan.status === 'Completed') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseModal(true)}
            >
              Close Loan
            </Button>
          )}
        </div>
      </div>

      {loan.status === 'Closed' && loan.closureInfo && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Loan Closed</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCloseModal(true)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
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
              {formatCurrency((loan.installments || []).reduce((sum, inst) => sum + Number(inst.dueAmount || 0), 0))}
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
                      variant="secondary"
                      size="sm"
                      className="px-3 text-xs"
                      onClick={() => setShowRestructureModal(true)}
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4 mr-1.5" />
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
              title="Customer Details"
              subtitle="Vehicle, documentation, customer, and loan terms"
              action={
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditLoanModal(true)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Edit Loan
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditCustomerModal(true)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Edit Customer
                  </Button>
                </div>
              }
            />
            <CardContent className="p-5">
              <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:grid-cols-2">
                {[
                  ['Vehicle', `${loan.vehicleType || '-'} - ${loan.make || ''} ${loan.model || ''}`],
                  ['Registration No.', loan.regNo || '-'],
                  ['Loan Account No.', loan.loanAccountNumber || '-'],
                  ['Loan Amount (L.AMT)', formatCurrency(loan.loanAmount || 0)],
                  ['Finance Amount (F.AMT)', formatCurrency(loan.financeAmount || 0)],
                  ['Loan Start Date', formatDate(loan.loanStartDate)],
                  ['Interest Rate', `${loan.interestRate || 0}% flat per month`],
                  ['Interest Amount', formatCurrency(loan.interestAmount || 0)],
                  ['EMI Amount', formatCurrency(loan.emiAmount || 0)],
                  ['Installment Period', `${loan.installmentPeriod || 0} ${loan.installmentPeriodUnit || 'Months'}`],
                  ['Customer Name', customer.name || '-'],
                  ['Address', customer.address || '-'],
                  ['Temporary Address', customer.temporaryAddress || '-'],
                  ['Cell Numbers', (customer.cellNumbers || []).map(c => c.number).join(', ') || '-'],
                  ['Monthly Salary', customer.monthlySalary ? formatCurrency(customer.monthlySalary) : '-'],
                  ['Guarantor', customer.guarantor?.name ? `${customer.guarantor.name}${customer.guarantor?.mobile ? ` - ${customer.guarantor.mobile}` : ''}${customer.guarantor?.address ? ` (${customer.guarantor.address})` : ''}` : '-'],
                  ['RC Status / Note', loan.rcDetails?.status || '-'],
                  ['RC Paid Through', loan.rcDetails?.paidThrough || '-'],
                  ['RC Cheque Number', loan.rcDetails?.chequeNumber || '-'],
                  ['RC Amount', loan.rcDetails?.amount ? formatCurrency(loan.rcDetails.amount) : '-'],
                  ['NOC', loan.noc || '-'],
                  ['Insurance Status', loan.insurance || '-'],
                  ['Key Status', loan.keyStatus || '-'],
                  ['ID Proof', customer.idProofType ? `${customer.idProofType} - ${customer.idProofNumber || ''}` : '-'],
                  ['ID Status', customer.idStatus || '-'],
                  ['Sales Done By', loan.salesDoneBy || '-'],
                  ['Cheques Received', (loan.chequesReceived || []).length > 0 ? loan.chequesReceived.map(c => `${c.chequeNumber}${c.bank ? ` (${c.bank})` : ''}`).join(', ') : '-'],
                  ['Status', loan.status || '-'],
                  ['Outstanding Principal', formatCurrency(loan.outstandingPrincipal || 0)],
                  ['Total Paid', formatCurrency(loan.totalPaid || 0)],
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
        loan={loan}
      />

      <RestructureModal
        isOpen={showRestructureModal}
        onClose={() => setShowRestructureModal(false)}
        onConfirm={handleRestructure}
        isSubmitting={restructureLoan.isPending}
        loan={loan}
      />

      <Modal
        isOpen={showEditCustomerModal}
        onClose={() => setShowEditCustomerModal(false)}
        title="Edit Customer Details"
        size="lg"
      >
        <EditCustomerForm customer={customer} onSubmit={handleUpdateCustomer} onCancel={() => setShowEditCustomerModal(false)} isSubmitting={updateCustomer.isPending} />
      </Modal>

      <Modal
        isOpen={showEditLoanModal}
        onClose={() => setShowEditLoanModal(false)}
        title="Edit Loan Details"
        size="xl"
      >
        <EditLoanForm loan={loan} onSubmit={handleUpdateLoan} onCancel={() => setShowEditLoanModal(false)} isSubmitting={updateLoan.isPending} />
      </Modal>
    </div>
  );
}
