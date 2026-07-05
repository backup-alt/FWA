import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Controller } from 'react-hook-form';
import { MakeSelect } from '@/components/ui/MakeSelect';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const PERIOD_UNITS = [
  { value: 'Days', label: 'Days' },
  { value: 'Weeks', label: 'Weeks' },
  { value: 'Months', label: 'Months' },
  { value: 'Years', label: 'Years' },
];

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

const ID_PROOF_OPTIONS = [
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'VoterID', label: 'Voter ID' },
  { value: 'DrivingLicense', label: 'Driving License' },
  { value: 'Passport', label: 'Passport' },
];

const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white";

function getInitialVehicles(loan) {
  if (loan.vehicles && loan.vehicles.length > 0) {
    return loan.vehicles.map(v => ({
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
    vehicleType: loan.vehicleType || 'Bike',
    make: loan.make || '',
    model: loan.model || '',
    regNo: loan.regNo || '',
    rcStatus: '',
    noc: loan.noc || '',
    insurance: loan.insurance || '',
    idProofType: loan.idProofType || '',
    idProofNumber: loan.idProofNumber || '',
    keyStatus: loan.keyStatus || '',
  }];
}

export function EditLoanForm({ loan, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    vehicles: getInitialVehicles(loan),
    loanAccountNumber: loan.loanAccountNumber || '',
    loanAmount: loan.loanAmount ?? '',
    installmentPeriod: loan.installmentPeriod ?? '',
    installmentPeriodUnit: loan.installmentPeriodUnit || 'Months',
    interestRate: loan.interestRate ?? '',
    rcStatus: loan.rcDetails?.status || '',
    rcPaidThrough: loan.rcDetails?.paidThrough || '',
    rcChequeNumber: loan.rcDetails?.chequeNumber || '',
    rcAmount: loan.rcDetails?.amount ?? '',
    salesDoneBy: loan.salesDoneBy || '',
    chequesReceived: loan.chequesReceived?.length ? loan.chequesReceived : [{ chequeNumber: '', bank: '' }],
  });

  const [vehicleMakeSelects, setVehicleMakeSelects] = useState(() => {
    const initial = {};
    const vehicles = getInitialVehicles(loan);
    vehicles.forEach((_, idx) => {
      initial[idx] = vehicles[idx].vehicleType;
    });
    return initial;
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleChequeChange = (index, field, value) => {
    const updated = [...formData.chequesReceived];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, chequesReceived: updated }));
  };

  const addCheque = () => {
    setFormData(prev => ({
      ...prev,
      chequesReceived: [...prev.chequesReceived, { chequeNumber: '', bank: '' }]
    }));
  };

  const removeCheque = (index) => {
    setFormData(prev => ({
      ...prev,
      chequesReceived: prev.chequesReceived.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      make: formData.vehicles[0]?.make || undefined,
      model: formData.vehicles[0]?.model || undefined,
      regNo: formData.vehicles[0]?.regNo || undefined,
      loanAccountNumber: formData.loanAccountNumber || undefined,
      loanAmount: formData.loanAmount !== '' ? Number(formData.loanAmount) : undefined,
      installmentPeriod: formData.installmentPeriod !== '' ? Number(formData.installmentPeriod) : undefined,
      installmentPeriodUnit: formData.installmentPeriodUnit || undefined,
      interestRate: formData.interestRate !== '' ? Number(formData.interestRate) : undefined,
      rcDetails: {
        status: formData.rcStatus || undefined,
        paidThrough: formData.rcPaidThrough || undefined,
        chequeNumber: formData.rcChequeNumber || undefined,
        amount: formData.rcAmount !== '' ? Number(formData.rcAmount) : undefined,
      },
      noc: formData.vehicles[0]?.noc || undefined,
      insurance: formData.vehicles[0]?.insurance || undefined,
      keyStatus: formData.vehicles[0]?.keyStatus || undefined,
      salesDoneBy: formData.salesDoneBy || undefined,
      vehicles: formData.vehicles,
      chequesReceived: formData.chequesReceived.filter(c => c.chequeNumber).map(c => ({
        chequeNumber: c.chequeNumber,
        bank: c.bank || undefined,
      })),
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Vehicles</h4>
        <button
          type="button"
          onClick={addVehicle}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add Vehicle
        </button>
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
                label="Vehicle Type"
                value={vehicle.vehicleType}
                onChange={(value) => {
                  handleVehicleChange(index, 'vehicleType', value);
                  setVehicleMakeSelects(prev => ({ ...prev, [index]: value }));
                }}
                options={VEHICLE_TYPE_OPTIONS}
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
                label="Reg. No."
                value={vehicle.regNo}
                onChange={(e) => handleVehicleChange(index, 'regNo', e.target.value)}
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
                label="ID Proof Type"
                value={vehicle.idProofType}
                onChange={(value) => handleVehicleChange(index, 'idProofType', value)}
                options={ID_PROOF_OPTIONS}
              />
              <Input
                label="ID Number"
                value={vehicle.idProofNumber}
                onChange={(e) => handleVehicleChange(index, 'idProofNumber', e.target.value)}
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

      <Section title="Loan Info">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Loan Account No." value={formData.loanAccountNumber} onChange={(e) => handleChange('loanAccountNumber', e.target.value)} />
          <Input label="Loan Amount (L.AMT)" type="number" value={formData.loanAmount} onChange={(e) => handleChange('loanAmount', e.target.value)} />
          <Input label="Interest Rate (% per month)" type="number" step="0.01" value={formData.interestRate} onChange={(e) => handleChange('interestRate', e.target.value)} />
          <Input label="Installment Period" type="number" value={formData.installmentPeriod} onChange={(e) => handleChange('installmentPeriod', e.target.value)} />
          <Select
            label="Period Unit"
            value={formData.installmentPeriodUnit}
            onChange={(value) => handleChange('installmentPeriodUnit', value)}
            options={PERIOD_UNITS}
          />
        </div>
      </Section>

      <Section title="RC Payment Details">
        <div className="grid grid-cols-2 gap-4">
          <Input label="RC Status / Note" value={formData.rcStatus} onChange={(e) => handleChange('rcStatus', e.target.value)} />
          <Input label="RC Paid Through" value={formData.rcPaidThrough} onChange={(e) => handleChange('rcPaidThrough', e.target.value)} />
          <Input label="RC Cheque Number" value={formData.rcChequeNumber} onChange={(e) => handleChange('rcChequeNumber', e.target.value)} />
          <Input label="RC Amount" type="number" value={formData.rcAmount} onChange={(e) => handleChange('rcAmount', e.target.value)} />
        </div>
      </Section>

      <Section title="Other Details">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Sales Done By" value={formData.salesDoneBy} onChange={(e) => handleChange('salesDoneBy', e.target.value)} />
        </div>
      </Section>

      <ChequeList
        cheques={formData.chequesReceived}
        onChange={handleChequeChange}
        onAdd={addCheque}
        onRemove={removeCheque}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
      {children}
    </div>
  );
}

function ChequeList({ cheques, onChange, onAdd, onRemove }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Cheques Received</h4>
        <button type="button" onClick={onAdd} className="text-xs text-primary-600 hover:underline">
          + Add Cheque
        </button>
      </div>
      <div className="space-y-3">
        {cheques.map((cheque, index) => (
          <div key={index} className="flex gap-2 items-start">
            <input
              type="text"
              value={cheque.chequeNumber}
              onChange={(e) => onChange(index, 'chequeNumber', e.target.value)}
              placeholder="Cheque Number"
              className={inputClass}
            />
            <input
              type="text"
              value={cheque.bank}
              onChange={(e) => onChange(index, 'bank', e.target.value)}
              placeholder="Bank"
              className={inputClass}
            />
            {cheques.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="px-2 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Remove"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}