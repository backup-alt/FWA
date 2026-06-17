import { Input, Select } from '@/components/ui';
import { useEffect } from 'react';

const ID_PROOF_OPTIONS = [
  { value: '', label: 'Select ID Proof' },
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'VoterID', label: 'Voter ID' },
  { value: 'DrivingLicense', label: 'Driving License' },
  { value: 'Passport', label: 'Passport' },
];

const ID_FORMATS = {
  Aadhar: { placeholder: 'xxxx xxxx xxxx', maxLength: 14, format: (v) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().slice(0, 14) },
  PAN: { placeholder: 'ABCDE1234F', maxLength: 10, format: (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10) },
  VoterID: { placeholder: 'ABC1234567', maxLength: 10, format: (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10) },
  DrivingLicense: { placeholder: 'TN01 20230001234', maxLength: 16, format: (v) => v.toUpperCase().slice(0, 16) },
  Passport: { placeholder: 'A1234567', maxLength: 8, format: (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) },
};

export function DocumentationStep({ form }) {
  const { register, watch, setValue } = form;
  const idProofType = watch('idProofType') || '';
  const idProofNumber = watch('idProofNumber') || '';

  const formatConfig = ID_FORMATS[idProofType];

  const handleIdNumberChange = (e) => {
    const raw = e.target.value;
    if (formatConfig) {
      setValue('idProofNumber', formatConfig.format(raw));
    } else {
      setValue('idProofNumber', raw);
    }
  };

  // Clear the ID number when the type changes
  useEffect(() => {
    setValue('idProofNumber', '');
  }, [idProofType, setValue]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">RC & Documentation</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="RC Status / Note"
          placeholder="e.g. Amt paid through cheque"
          {...register('rcDetails.status')}
        />
        
        <Input
          label="RC Paid Through (Payee Name)"
          placeholder="e.g. RAM AUTO CONSULTING"
          {...register('rcDetails.paidThrough')}
        />
        
        <Input
          label="RC Cheque Number"
          {...register('rcDetails.chequeNumber')}
        />
        
        <Input
          label="RC Amount"
          type="number"
          placeholder="0"
          {...register('rcDetails.amount')}
        />
        
        <Input
          label="NOC"
          {...register('noc')}
        />
        
        <Input
          label="Insurance"
          {...register('insurance')}
        />
        
        <Select
          label="ID Proof Type"
          options={ID_PROOF_OPTIONS}
          placeholder="Select ID Proof"
          {...register('idProofType')}
        />
        
        {idProofType && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {idProofType === 'Aadhar' ? 'Aadhar Number' :
               idProofType === 'PAN' ? 'PAN Number' :
               idProofType === 'VoterID' ? 'Voter ID Number' :
               idProofType === 'DrivingLicense' ? 'Driving License Number' :
               idProofType === 'Passport' ? 'Passport Number' : 'ID Number'}
            </label>
            <input
              value={idProofNumber}
              onChange={handleIdNumberChange}
              placeholder={formatConfig?.placeholder || ''}
              maxLength={formatConfig?.maxLength || 20}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Format: {formatConfig?.placeholder || ''}
            </p>
          </div>
        )}
        
        <Input
          label="Key Status"
          {...register('keyStatus')}
        />
        
        <Input
          label="Sales Done By"
          {...register('salesDoneBy')}
        />
      </div>
    </div>
  );
}
