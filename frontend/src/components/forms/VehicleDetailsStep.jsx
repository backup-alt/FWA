import { Input, Select } from '@/components/ui';
import { Controller } from 'react-hook-form';
import { MakeSelect } from '@/components/ui/MakeSelect';

export function VehicleDetailsStep({ form }) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const vehicleType = watch('vehicleType') || '';
  const periodUnit = watch('installmentPeriodUnit') || 'Months';
  const make = watch('make') || '';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicle & Finance Details</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="vehicleType"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Vehicle Type *"
              options={[
                { value: 'Bike', label: 'Bike' },
                { value: 'Car', label: 'Car' },
                { value: 'Auto', label: 'Auto' },
              ]}
              placeholder="Select vehicle type"
              error={errors.vehicleType?.message}
            />
          )}
        />
        
        <Controller
          name="make"
          control={control}
          render={({ field }) => (
            <MakeSelect
              {...field}
              value={make}
              onChange={(val) => {
                setValue('make', val, { shouldValidate: true, shouldDirty: true });
              }}
              vehicleType={vehicleType}
              error={errors.make?.message}
            />
          )}
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

        <Input
          label="Loan Account Number"
          placeholder="e.g. LA-12345"
          error={errors.loanAccountNumber?.message}
          {...register('loanAccountNumber')}
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
          label="Loan Disbursement Amount (F.AMT) *"
          type="number"
          placeholder="0"
          error={errors.financeAmount?.message}
          {...register('financeAmount')}
        />
        
        <Input
          label="Monthly Interest Rate (%) *"
          type="number"
          step="0.01"
          placeholder="2"
          error={errors.interestRate?.message}
          {...register('interestRate')}
        />
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="Installment Period *"
              type="number"
              placeholder="12"
              error={errors.installmentPeriod?.message}
              {...register('installmentPeriod')}
            />
          </div>
          <div className="w-1/2">
            <Controller
              name="installmentPeriodUnit"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Unit *"
                  options={[
                    { value: 'Months', label: 'Months' },
                    { value: 'Weeks', label: 'Weeks' },
                    { value: 'Days', label: 'Days' },
                  ]}
                  error={errors.installmentPeriodUnit?.message}
                />
              )}
            />
          </div>
        </div>
        
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