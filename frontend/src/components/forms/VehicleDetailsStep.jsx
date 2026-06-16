import { Input, Select } from '@/components/ui';

export function VehicleDetailsStep({ form }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicle & Finance Details</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Vehicle Type *"
          name="vehicleType"
          options={[
            { value: 'Bike', label: 'Bike' },
            { value: 'Car', label: 'Car' },
          ]}
          placeholder="Select vehicle type"
          error={errors.vehicleType?.message}
          {...register('vehicleType')}
        />
        
        <Input
          label="Make"
          placeholder="e.g. Honda"
          error={errors.make?.message}
          {...register('make')}
        />
        
        <Input
          label="Model"
          placeholder="e.g. Activa"
          error={errors.model?.message}
          {...register('model')}
        />
        
        <Input
          label="Registration No."
          placeholder="e.g. TN09AB1234"
          error={errors.regNo?.message}
          {...register('regNo')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Loan Amount (L.AMT) *"
          type="number"
          placeholder="0"
          error={errors.loanAmount?.message}
          {...register('loanAmount')}
        />
        
        <Input
          label="Finance Amount (F.AMT) *"
          type="number"
          placeholder="0"
          error={errors.financeAmount?.message}
          {...register('financeAmount')}
        />
        
        <Input
          label="Interest Rate (%) *"
          type="number"
          step="0.01"
          placeholder="12"
          error={errors.interestRate?.message}
          {...register('interestRate')}
        />
        
        <Input
          label="Installment Period (months) *"
          type="number"
          placeholder="12"
          error={errors.installmentPeriod?.message}
          {...register('installmentPeriod')}
        />
        
        <Input
          label="Loan Start Date *"
          type="date"
          error={errors.loanStartDate?.message}
          {...register('loanStartDate')}
        />
      </div>
    </div>
  );
}
