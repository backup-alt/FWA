import { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, PencilIcon, CameraIcon, TrashIcon, ChevronRightIcon, ArrowPathIcon, LinkIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useUpdateLoan } from '@/hooks/useLoans';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/api';
import bikeIcon from '../../../bike-svgrepo-com.svg';
import carIcon from '../../../car-svgrepo-com.svg';
const autoIcon = '/FWA/icons8-auto-rickshaw-50.png';

const statusColors = {
  Active: 'info',
  Completed: 'success',
  Closed: 'warning',
  Renewed: 'purple',
};

const VEHICLE_TYPE_OPTIONS = [
  { value: 'Bike', label: 'Bike' },
  { value: 'Car', label: 'Car' },
  { value: 'Auto', label: 'Auto' },
];

const NOC_OPTIONS = [
  { value: 'Received', label: 'Received' },
  { value: 'Not Received', label: 'Not Received' },
  { value: 'NA', label: 'NA' },
];

const INSURANCE_OPTIONS = [
  { value: 'Expired', label: 'Expired' },
  { value: 'Not Expired', label: 'Not Expired' },
  { value: 'NA', label: 'NA' },
];

const KEY_STATUS_OPTIONS = [
  { value: 'Given', label: 'Given' },
  { value: 'Not Given', label: 'Not Given' },
];

function getInitialVehicles(firstLoan) {
  if (!firstLoan) return [];
  if (firstLoan.vehicles && firstLoan.vehicles.length > 0) {
    return firstLoan.vehicles.map(v => ({
      vehicleType: v.vehicleType || 'Bike',
      make: v.make || '',
      model: v.model || '',
      regNo: v.regNo || '',
      rcStatus: v.rcStatus || '',
      noc: v.noc || '',
      insurance: v.insurance || '',
      idProofType: v.idProofType || '',
      idProofNumber: v.idProofNumber || '',
      keyStatus: v.keyStatus || '',
    }));
  }
  return [{
    vehicleType: firstLoan.vehicleType || 'Bike',
    make: firstLoan.make || '',
    model: firstLoan.model || '',
    regNo: firstLoan.regNo || '',
    rcStatus: firstLoan.rcDetails?.status || '',
    noc: firstLoan.noc || '',
    insurance: firstLoan.insurance || '',
    idProofType: firstLoan.idProofType || '',
    idProofNumber: firstLoan.idProofNumber || '',
    keyStatus: firstLoan.keyStatus || '',
  }];
}

function EditCustomerForm({ customer, loans, onSubmit, onCancel, isSubmitting }) {
  const firstLoan = loans && loans.length > 0 ? loans[0] : null;

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
    vehicles: getInitialVehicles(firstLoan),
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

  const handleVehicleChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        vehicleType: 'Bike',
        make: '',
        model: '',
        regNo: '',
        rcStatus: '',
        noc: '',
        insurance: '',
        idProofType: '',
        idProofNumber: '',
        keyStatus: '',
      }]
    }));
  };

  const removeVehicle = (index) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const customerData = {
      name: formData.customerName,
      address: formData.address,
      temporaryAddress: formData.temporaryAddress || undefined,
      monthlySalary: formData.monthlySalary ? Number(formData.monthlySalary) : undefined,
      cellNumbers: formData.cellNumbers.filter(c => c.number).map(c => ({ number: c.number })),
      guarantor: (formData.guarantor.name || formData.guarantor.address || formData.guarantor.mobile) ? formData.guarantor : undefined,
      idProofType: formData.idProofType || undefined,
      idProofNumber: formData.idProofNumber || undefined,
      idStatus: formData.idStatus || undefined,
    };
    const loanData = firstLoan ? {
      vehicles: formData.vehicles,
      vehicleType: formData.vehicles[0]?.vehicleType || 'Bike',
      make: formData.vehicles[0]?.make || '',
      model: formData.vehicles[0]?.model || '',
      regNo: formData.vehicles[0]?.regNo || '',
      noc: formData.vehicles[0]?.noc || '',
      insurance: formData.vehicles[0]?.insurance || '',
      keyStatus: formData.vehicles[0]?.keyStatus || '',
    } : null;
    onSubmit({ customerData, loanData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Customer Information</h3>
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
        <div className="space-y-2">
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
      </div>

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

      {firstLoan && (
        <>
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Vehicles</h3>
              <button
                type="button"
                onClick={addVehicle}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Vehicle
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {formData.vehicles.map((vehicle, index) => (
              <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vehicle {index + 1}</span>
                  {formData.vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Type"
                    value={vehicle.vehicleType}
                    onChange={(value) => handleVehicleChange(index, 'vehicleType', value)}
                    options={VEHICLE_TYPE_OPTIONS}
                  />
                  <Input
                    label="Reg. No."
                    value={vehicle.regNo}
                    onChange={(e) => handleVehicleChange(index, 'regNo', e.target.value)}
                  />
                  <Input
                    label="Make"
                    value={vehicle.make}
                    onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                  />
                  <Input
                    label="Model"
                    value={vehicle.model}
                    onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                  />
                  <Input
                    label="RC Status"
                    value={vehicle.rcStatus}
                    onChange={(e) => handleVehicleChange(index, 'rcStatus', e.target.value)}
                  />
                  <Select
                    label="NOC"
                    value={vehicle.noc}
                    onChange={(value) => handleVehicleChange(index, 'noc', value)}
                    options={NOC_OPTIONS}
                  />
                  <Select
                    label="Insurance"
                    value={vehicle.insurance}
                    onChange={(value) => handleVehicleChange(index, 'insurance', value)}
                    options={INSURANCE_OPTIONS}
                  />
                  <Select
                    label="Key Status"
                    value={vehicle.keyStatus}
                    onChange={(value) => handleVehicleChange(index, 'keyStatus', value)}
                    options={KEY_STATUS_OPTIONS}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </div>
    </form>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, isLoading, refetch } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();
  const updateLoan = useUpdateLoan();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [loanFilter, setLoanFilter] = useState('all');
  const [showVehicleEditModal, setShowVehicleEditModal] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editingVehicles, setEditingVehicles] = useState([]);

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is too large (max 5MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateCustomer.mutateAsync({ id, data: { profileImage: reader.result } });
        showToast('Profile image updated', 'success');
        setShowProfileModal(false);
        refetch();
      } catch (err) {
        showToast(err.message || 'Failed to update image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = async () => {
    try {
      await updateCustomer.mutateAsync({ id, data: { profileImage: '' } });
      showToast('Profile image removed', 'success');
      setShowProfileModal(false);
      refetch();
    } catch (err) {
      showToast(err.message || 'Failed to remove image', 'error');
    }
  };

  const handleUpdateCustomer = async (data) => {
    const { customerData, loanData } = data;
    await updateCustomer.mutateAsync({ id, data: customerData });
    if (loanData && loans.length > 0) {
      await updateLoan.mutateAsync({ id: loans[0]._id, data: loanData });
    }
    showToast('Updated successfully', 'success');
    setShowEditCustomerModal(false);
    refetch();
  };

  const openVehicleEditModal = (loan) => {
    const loanVehicles = loan.vehicles && loan.vehicles.length > 0
      ? loan.vehicles.map(v => ({ ...v }))
      : [{
          vehicleType: loan.vehicleType || 'Bike',
          make: loan.make || '',
          model: loan.model || '',
          regNo: loan.regNo || '',
          rcStatus: loan.rcDetails?.status || '',
          noc: loan.noc || '',
          insurance: loan.insurance || '',
          idProofType: loan.idProofType || '',
          idProofNumber: loan.idProofNumber || '',
          keyStatus: loan.keyStatus || '',
        }];
    setEditingLoanId(loan._id);
    setEditingVehicles(loanVehicles);
    setShowVehicleEditModal(true);
  };

  const handleVehicleEditChange = (index, field, value) => {
    setEditingVehicles(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVehicleToEdit = () => {
    setEditingVehicles(prev => [...prev, {
      vehicleType: 'Bike',
      make: '',
      model: '',
      regNo: '',
      rcStatus: '',
      noc: '',
      insurance: '',
      idProofType: '',
      idProofNumber: '',
      keyStatus: '',
    }]);
  };

  const removeVehicleFromEdit = (index) => {
    setEditingVehicles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveVehicles = async () => {
    try {
      const firstVehicle = editingVehicles[0] || {};
      await updateLoan.mutateAsync({
        id: editingLoanId,
        data: {
          vehicles: editingVehicles,
          vehicleType: firstVehicle.vehicleType || 'Bike',
          make: firstVehicle.make || '',
          model: firstVehicle.model || '',
          regNo: firstVehicle.regNo || '',
          noc: firstVehicle.noc || '',
          insurance: firstVehicle.insurance || '',
          keyStatus: firstVehicle.keyStatus || '',
        }
      });
      showToast('Vehicles updated successfully', 'success');
      setShowVehicleEditModal(false);
      refetch();
    } catch (err) {
      showToast(err.message || 'Failed to update vehicles', 'error');
    }
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
    ['Customer Name', customer.name || '-'],
    ['Address', customer.address || '-'],
    ['Temporary Address', customer.temporaryAddress || '-'],
    ['Cell Numbers', (customer.cellNumbers || []).map(c => c.number).join(', ') || '-'],
    ['Monthly Salary', customer.monthlySalary ? formatCurrency(customer.monthlySalary) : '-'],
    ['ID Proof', customer.idProofType ? `${customer.idProofType}: ${customer.idProofNumber || '-'}` : '-'],
    ['ID Status', customer.idStatus || '-'],
    ['Guarantor', `${customer.guarantor?.name || '-'}${customer.guarantor?.mobile ? ` - ${customer.guarantor.mobile}` : ''}${customer.guarantor?.address ? ` (${customer.guarantor.address})` : ''}`],
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
            <button
              onClick={() => customer.profileImage && setShowProfileModal(true)}
              className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              disabled={!customer.profileImage}
            >
              {customer.profileImage ? (
                <img
                  src={customer.profileImage}
                  alt={customer.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl ring-2 ring-gray-200 dark:ring-gray-700">
                  {customer.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {customer.profileImage && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
              )}
            </button>
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <CameraIcon className="h-4 w-4" />
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
        </div>
      </div>

      {/* Customer Details Card */}
      <Card padding="">
        <CardHeader 
          className="px-5 pt-5 mb-0" 
          title="Customer Details" 
          subtitle="Personal information and guarantor details"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditCustomerModal(true)}
            >
              <PencilIcon className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          }
        />
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
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLoanFilter('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  loanFilter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                All ({loans.length})
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('active')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  loanFilter === 'active'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Active ({loans.filter(l => l.status === 'Active').length})
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('completed')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  loanFilter === 'completed'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Completed ({loans.filter(l => l.status === 'Completed' || l.status === 'Closed').length})
              </button>
            </div>
          }
        />
        <CardContent className="p-5">
          {loans.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">This customer has no loans yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const sortedLoans = [...loans].sort((a, b) => {
                  const dateA = new Date(a.loanStartDate || a.createdAt || 0);
                  const dateB = new Date(b.loanStartDate || b.createdAt || 0);
                  return dateA - dateB;
                });
                const renewalChains = new Map();
                const rootLoans = new Map();
                sortedLoans.forEach(loan => {
                  if (loan.renewedFromLoanId) {
                    renewalChains.set(loan.renewedFromLoanId.toString(), loan);
                  }
                  if (!loan.renewedFromLoanId) {
                    rootLoans.set(loan._id.toString(), loan);
                  }
                });
                return sortedLoans.map((loan, idx) => {
                  const loanNumber = idx + 1;
                  const isRenewal = !!loan.isRenewal;
                  const renewedToLoan = renewalChains.get(loan._id.toString());
                  const isLastInChain = !renewedToLoan;
                  const loanVehicles = loan.vehicles && loan.vehicles.length > 0
                    ? loan.vehicles
                    : [{ vehicleType: loan.vehicleType, make: loan.make, model: loan.model, regNo: loan.regNo, rcStatus: loan.rcDetails?.status || '', noc: loan.noc || '', insurance: loan.insurance || '', idProofType: loan.idProofType || '', idProofNumber: loan.idProofNumber || '', keyStatus: loan.keyStatus || '' }];

                  return (
                    <div
                      key={loan._id}
                      className={`border rounded-lg overflow-hidden ${
                        isRenewal
                          ? 'border-purple-200 dark:border-purple-700 ml-4 md:ml-8'
                          : 'border-gray-200 dark:border-gray-700'
                      } ${isLastInChain && loan.status === 'Active' ? 'ring-2 ring-primary-100 dark:ring-primary-900/30' : ''}`}
                    >
                      <NavLink
                        to={`/loan/${loan._id}`}
                        className={`flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${
                          isRenewal ? 'bg-purple-50/40 dark:bg-purple-900/10' : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex flex-col items-center shrink-0">
                            <span className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${
                              isRenewal
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                            }`}>
                              #{loanNumber}
                            </span>
                            {isRenewal && (
                              <span className="text-purple-500 dark:text-purple-400 text-xs mt-1">
                                <ArrowPathIcon className="h-3 w-3 mx-auto" />
                              </span>
                            )}
                          </div>
                          {loan.vehicleType === 'Bike' ? (
                            <img src={bikeIcon} alt="Bike" className="h-8 w-8 shrink-0" />
                          ) : loan.vehicleType === 'Car' ? (
                            <img src={carIcon} alt="Car" className="h-8 w-8 shrink-0" />
                          ) : (
                            <img src={autoIcon} alt="Auto" className="h-8 w-8 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {loan.vehicleType} - {loan.make || ''} {loan.model || ''}
                              </h3>
                              {isRenewal && (
                                <Badge variant="purple">Renewal</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {loan.regNo ? `${loan.regNo} • ` : ''}{loan.loanAccountNumber ? `Acct: ${loan.loanAccountNumber} • ` : ''}{loan.installmentPeriod} months
                            </p>
                            {isRenewal && loan.renewedFromLoanId && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                Renewed from previous loan
                              </p>
                            )}
                            {renewedToLoan && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                                <ArrowPathIcon className="h-3 w-3" />
                                Renewed to a new loan
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(loan.outstandingPrincipal || 0)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                          </div>
                          <Badge variant={statusColors[loan.status] || 'gray'}>
                            {loan.status}
                          </Badge>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </NavLink>

                      {loanVehicles.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Vehicles ({loanVehicles.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() => openVehicleEditModal(loan)}
                                className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded"
                                title="Edit vehicles"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <NavLink
                              to={`/loan/${loan._id}`}
                              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                              View Loan Details →
                            </NavLink>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {loanVehicles.map((v, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                  {v.vehicleType === 'Bike' ? (
                                    <img src={bikeIcon} alt="Bike" className="h-5 w-5 shrink-0" />
                                  ) : v.vehicleType === 'Car' ? (
                                    <img src={carIcon} alt="Car" className="h-5 w-5 shrink-0" />
                                  ) : (
                                    <img src={autoIcon} alt="Auto" className="h-5 w-5 shrink-0" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {v.vehicleType} {v.make} {v.model}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono">
                                  {v.regNo || 'No Reg. No.'}
                                </p>
                                <div className="flex flex-wrap gap-1 text-xs">
                                  {v.rcStatus && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">RC: {v.rcStatus}</span>}
                                  {v.noc && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">NOC: {v.noc}</span>}
                                  {v.insurance && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">INS: {v.insurance}</span>}
                                  {v.keyStatus && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">Key: {v.keyStatus}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Picture Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title={customer.name}
        size="lg"
      >
        <div className="space-y-4">
          {/* Full size image */}
          <div className="flex justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
            <img
              src={customer.profileImage}
              alt={customer.name}
              className="max-h-[60vh] rounded-lg object-contain"
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 cursor-pointer">
              <PencilIcon className="h-4 w-4" />
              Edit Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
            </label>
            <Button
              variant="danger"
              onClick={handleRemoveProfileImage}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditCustomerModal}
        onClose={() => setShowEditCustomerModal(false)}
        title="Edit Customer & Vehicle"
        size="lg"
      >
        <EditCustomerForm 
          customer={customer} 
          loans={loans} 
          onSubmit={handleUpdateCustomer} 
          onCancel={() => setShowEditCustomerModal(false)} 
          isSubmitting={updateCustomer.isPending || updateLoan.isPending} 
        />
      </Modal>

      <Modal
        isOpen={showVehicleEditModal}
        onClose={() => setShowVehicleEditModal(false)}
        title="Edit Vehicles"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {editingVehicles.map((vehicle, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle {index + 1}</h4>
                {editingVehicles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVehicleFromEdit(index)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Type"
                  value={vehicle.vehicleType}
                  onChange={(value) => handleVehicleEditChange(index, 'vehicleType', value)}
                  options={VEHICLE_TYPE_OPTIONS}
                />
                <Input
                  label="Reg. No."
                  value={vehicle.regNo}
                  onChange={(e) => handleVehicleEditChange(index, 'regNo', e.target.value)}
                />
                <Input
                  label="Make"
                  value={vehicle.make}
                  onChange={(e) => handleVehicleEditChange(index, 'make', e.target.value)}
                />
                <Input
                  label="Model"
                  value={vehicle.model}
                  onChange={(e) => handleVehicleEditChange(index, 'model', e.target.value)}
                />
                <Input
                  label="RC Status"
                  value={vehicle.rcStatus}
                  onChange={(e) => handleVehicleEditChange(index, 'rcStatus', e.target.value)}
                />
                <Select
                  label="NOC"
                  value={vehicle.noc}
                  onChange={(value) => handleVehicleEditChange(index, 'noc', value)}
                  options={NOC_OPTIONS}
                />
                <Select
                  label="Insurance"
                  value={vehicle.insurance}
                  onChange={(value) => handleVehicleEditChange(index, 'insurance', value)}
                  options={INSURANCE_OPTIONS}
                />
                <Select
                  label="Key Status"
                  value={vehicle.keyStatus}
                  onChange={(value) => handleVehicleEditChange(index, 'keyStatus', value)}
                  options={KEY_STATUS_OPTIONS}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addVehicleToEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Vehicle
          </button>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <Button variant="secondary" onClick={() => setShowVehicleEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveVehicles} loading={updateLoan.isPending}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}