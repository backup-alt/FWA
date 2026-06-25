import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const PERIOD_UNITS = [
  { value: 'Days', label: 'Days' },
  { value: 'Weeks', label: 'Weeks' },
  { value: 'Months', label: 'Months' },
  { value: 'Years', label: 'Years' },
];

const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white";

export function EditLoanForm({ loan, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    make: loan.make || '',
    model: loan.model || '',
    regNo: loan.regNo || '',
    loanAccountNumber: loan.loanAccountNumber || '',
    loanAmount: loan.loanAmount ?? '',
    installmentPeriod: loan.installmentPeriod ?? '',
    installmentPeriodUnit: loan.installmentPeriodUnit || 'Months',
    interestRate: loan.interestRate ?? '',
    rcStatus: loan.rcDetails?.status || '',
    rcPaidThrough: loan.rcDetails?.paidThrough || '',
    rcChequeNumber: loan.rcDetails?.chequeNumber || '',
    rcAmount: loan.rcDetails?.amount ?? '',
    noc: loan.noc || '',
    insurance: loan.insurance || '',
    keyStatus: loan.keyStatus || '',
    salesDoneBy: loan.salesDoneBy || '',
    chequesReceived: loan.chequesReceived?.length ? loan.chequesReceived : [{ chequeNumber: '', bank: '' }],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      make: formData.make || undefined,
      model: formData.model || undefined,
      regNo: formData.regNo || undefined,
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
      noc: formData.noc || undefined,
      insurance: formData.insurance || undefined,
      keyStatus: formData.keyStatus || undefined,
      salesDoneBy: formData.salesDoneBy || undefined,
      chequesReceived: formData.chequesReceived.filter(c => c.chequeNumber).map(c => ({
        chequeNumber: c.chequeNumber,
        bank: c.bank || undefined,
      })),
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Section title="Vehicle">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Make" value={formData.make} onChange={(e) => handleChange('make', e.target.value)} />
          <Input label="Model" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} />
        </div>
      </Section>

      <Section title="Loan Info">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Registration No." value={formData.regNo} onChange={(e) => handleChange('regNo', e.target.value)} />
          <Input label="Loan Account No." value={formData.loanAccountNumber} onChange={(e) => handleChange('loanAccountNumber', e.target.value)} />
          <Input label="Loan Amount (L.AMT)" type="number" value={formData.loanAmount} onChange={(e) => handleChange('loanAmount', e.target.value)} />
          <Input label="Interest Rate (% per month)" type="number" step="0.01" value={formData.interestRate} onChange={(e) => handleChange('interestRate', e.target.value)} />
          <Input label="Installment Period" type="number" value={formData.installmentPeriod} onChange={(e) => handleChange('installmentPeriod', e.target.value)} />
          <Select
            label="Period Unit"
            value={formData.installmentPeriodUnit}
            onChange={(e) => handleChange('installmentPeriodUnit', e.target.value)}
            options={PERIOD_UNITS}
          />
        </div>
      </Section>

      <Section title="RC Details">
        <div className="grid grid-cols-2 gap-4">
          <Input label="RC Status / Note" value={formData.rcStatus} onChange={(e) => handleChange('rcStatus', e.target.value)} />
          <Input label="RC Paid Through" value={formData.rcPaidThrough} onChange={(e) => handleChange('rcPaidThrough', e.target.value)} />
          <Input label="RC Cheque Number" value={formData.rcChequeNumber} onChange={(e) => handleChange('rcChequeNumber', e.target.value)} />
          <Input label="RC Amount" type="number" value={formData.rcAmount} onChange={(e) => handleChange('rcAmount', e.target.value)} />
        </div>
      </Section>

      <Section title="Other Details">
        <div className="grid grid-cols-2 gap-4">
          <Input label="NOC" value={formData.noc} onChange={(e) => handleChange('noc', e.target.value)} />
          <Input label="Insurance Status" value={formData.insurance} onChange={(e) => handleChange('insurance', e.target.value)} />
          <Input label="Key Status" value={formData.keyStatus} onChange={(e) => handleChange('keyStatus', e.target.value)} />
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
