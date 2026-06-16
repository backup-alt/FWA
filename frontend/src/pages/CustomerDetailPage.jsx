import { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeftIcon, TrashIcon, PlusIcon, PencilIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/api';
import { clsx } from 'clsx';

const statusColors = {
  Active: 'info',
  Completed: 'success',
};

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, isLoading, refetch } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      showToast('Image must be smaller than 500KB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateCustomer.mutateAsync({ id, data: { profileImage: reader.result } });
        showToast('Profile image updated', 'success');
        refetch();
      } catch (err) {
        showToast(err.message || 'Failed to update image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    await deleteCustomer.mutateAsync(id);
    showToast('Customer and all loans deleted', 'success');
    navigate('/customers');
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

  if (!data?.customer) {
    return (
      <div className="mx-auto max-w-7xl py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer not found</h1>
        <NavLink to="/customers" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to customers
        </NavLink>
      </div>
    );
  }

  const { customer, loans = [] } = data;

  const detailRows = [
    ['Address', customer.address || '-'],
    ['Cell Numbers', (customer.cellNumbers || []).map(c => c.number).join(', ') || '-'],
    ['Monthly Salary', customer.monthlySalary ? formatCurrency(customer.monthlySalary) : '-'],
    ['ID Proof', customer.idProofType ? `${customer.idProofType}: ${customer.idProofNumber || '-'}` : '-'],
    ['Guarantor', `${customer.guarantor?.name || '-'}${customer.guarantor?.address ? ` - ${customer.guarantor.address}` : ''}`],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <NavLink to="/customers" className="mt-1 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <ArrowLeftIcon className="h-5 w-5" />
          </NavLink>

          {/* Profile image */}
          <div className="relative group shrink-0">
            {customer.profileImage ? (
              <img
                src={customer.profileImage}
                alt={customer.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl">
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <CameraIcon className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
            </label>
          </div>

          <div className="min-w-0">
            <h1 className="min-w-0 truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {customer.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {loans.length} loan{loans.length !== 1 ? 's' : ''} • Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to={`/customer/${id}/add-loan`}>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-1.5" />
              New Loan
            </Button>
          </NavLink>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-red-500 hover:text-red-600"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete customer"
          >
            <TrashIcon className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Customer Details Card */}
      <Card padding="">
        <CardHeader className="px-5 pt-5 mb-0" title="Customer Details" subtitle="Personal information and guarantor details" />
        <CardContent className="p-5">
          <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:grid-cols-2">
            {detailRows.map(([label, value]) => (
              <div key={label} className="border-b border-gray-200 p-4 last:border-b-0 dark:border-gray-700 sm:odd:border-r">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-950 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Loans List */}
      <Card padding="">
        <CardHeader
          className="px-5 pt-5 mb-0"
          title="Loans"
          subtitle={`${loans.length} loan${loans.length !== 1 ? 's' : ''} associated with this customer`}
          action={
            <NavLink to={`/customer/${id}/add-loan`}>
              <Button size="sm" variant="secondary">
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add Loan
              </Button>
            </NavLink>
          }
        />
        <CardContent className="p-5">
          {loans.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">This customer has no loans yet.</p>
              <NavLink to={`/customer/${id}/add-loan`} className="mt-4 inline-flex">
                <Button>
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Create First Loan
                </Button>
              </NavLink>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {loans.map(loan => (
                <NavLink
                  key={loan._id}
                  to={`/loan/${loan._id}`}
                  className="flex border-b border-gray-200 bg-white p-4 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50 flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {loan.vehicleType} - {loan.make || ''} {loan.model || ''}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {loan.regNo ? `${loan.regNo} • ` : ''}{loan.loanAccountNumber ? `Acct: ${loan.loanAccountNumber} • ` : ''}Started {formatDate(loan.loanStartDate)} • {loan.installmentPeriod} months
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(loan.outstandingPrincipal || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                    </div>
                    <Badge variant={statusColors[loan.status] || 'gray'}>
                      {loan.status}
                    </Badge>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Customer"
        size="sm"
      >
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{customer.name}</strong> and all their loans? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
