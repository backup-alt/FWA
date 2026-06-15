import { Input } from '@/components/ui';

export function DocumentationStep({ form }) {
  const { register } = form;

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
        
        <Input
          label="ID Proof"
          {...register('idProof')}
        />
        
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
