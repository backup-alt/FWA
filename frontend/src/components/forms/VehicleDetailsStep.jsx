import { Input, Select } from '@/components/ui';
import { Controller, useFieldArray } from 'react-hook-form';
import { MakeSelect } from '@/components/ui/MakeSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const ID_PROOF_OPTIONS = [
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'VoterID', label: 'Voter ID' },
  { value: 'DrivingLicense', label: 'Driving License' },
  { value: 'Passport', label: 'Passport' },
];

const KEY_STATUS_OPTIONS = [
  { value: 'Given', label: 'Given' },
  { value: 'Not Given', label: 'Not Given' },
];

const INSURANCE_STATUS_OPTIONS = [
  { value: 'Expired', label: 'Expired' },
  { value: 'Not Expired', label: 'Not Expired' },
  { value: 'NA', label: 'NA' },
];

function VehicleEntry({ index, vehicle, control, register, watch, setValue, errors, onRemove, canRemove }) {
  const vehicleType = watch(`vehicles.${index}.vehicleType`) || '';
  const make = watch(`vehicles.${index}.make`) || '';

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Controller
          name={`vehicles.${index}.vehicleType`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Vehicle Type"
              options={[
                { value: 'Bike', label: 'Bike' },
                { value: 'Car', label: 'Car' },
                { value: 'Auto', label: 'Auto' },
              ]}
              placeholder="Select type"
            />
          )}
        />

        <Controller
          name={`vehicles.${index}.make`}
          control={control}
          render={({ field }) => (
            <MakeSelect
              {...field}
              value={make}
              onChange={(val) => setValue(`vehicles.${index}.make`, val, { shouldValidate: true, shouldDirty: true })}
              vehicleType={vehicleType}
            />
          )}
        />

        <Input
          label="Model"
          placeholder="e.g. Activa"
          {...register(`vehicles.${index}.model`)}
        />

        <Input
          label="Reg. No."
          placeholder="e.g. TN09AB1234"
          {...register(`vehicles.${index}.regNo`)}
        />

        <Input
          label="RC Status"
          placeholder="e.g. Amt paid"
          {...register(`vehicles.${index}.rcStatus`)}
        />

        <Controller
          name={`vehicles.${index}.noc`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="NOC"
              options={[
                { value: 'Received', label: 'Received' },
                { value: 'Not Received', label: 'Not Received' },
                { value: 'NA', label: 'NA' },
              ]}
              placeholder="Select"
            />
          )}
        />

        <Controller
          name={`vehicles.${index}.insurance`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Insurance"
              options={INSURANCE_STATUS_OPTIONS}
              placeholder="Select"
            />
          )}
        />

        <Controller
          name={`vehicles.${index}.idProofType`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="ID Proof"
              options={ID_PROOF_OPTIONS}
              placeholder="Select"
            />
          )}
        />

        <Input
          label="ID Number"
          placeholder="ID number"
          {...register(`vehicles.${index}.idProofNumber`)}
        />

        <Controller
          name={`vehicles.${index}.keyStatus`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Key Status"
              options={KEY_STATUS_OPTIONS}
              placeholder="Select"
            />
          )}
        />
      </div>
    </div>
  );
}

export function VehicleDetailsStep({ form }) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'vehicles',
  });

  const addVehicle = () => {
    append({
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
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicle & Finance Details</h3>
        <button
          type="button"
          onClick={addVehicle}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <VehicleEntry
            key={field.id}
            index={index}
            vehicle={field}
            control={control}
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No vehicles added yet. Click "Add Vehicle" to add one.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Input
          label="Loan Account Number"
          placeholder="e.g. LA-12345"
          {...register('loanAccountNumber')}
        />

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

        <Controller
          name="loanStartDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Loan Start Date *"
              value={field.value}
              onChange={(date) => field.onChange(date)}
              error={errors.loanStartDate?.message}
            />
          )}
        />

        <Input
          label="Sales Done By"
          placeholder="Sales person name"
          {...register('salesDoneBy')}
        />
      </div>
    </div>
  );
}