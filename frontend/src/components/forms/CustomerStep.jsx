import { useState } from 'react';
import { Input } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useFieldArray, Controller } from 'react-hook-form';
import { PlusIcon, TrashIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { useCustomers } from '@/hooks/useCustomers';

export function CustomerStep({ form, control }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { fields: cellFields, append: addCell, remove: removeCell } = useFieldArray({
    control,
    name: 'cellNumbers',
  });
  const { showToast } = useToast();

  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = Array.isArray(customersData) ? customersData : (customersData?.customers || []);

  const profileImage = watch('profileImage');
  const customerName = watch('customerName') || '?';
  const isNewCustomer = watch('isNewCustomer');

  // Read current value so Select can display it correctly after tab-switch (cached form state)
  const existingCustomerId = watch('existingCustomerId') || '';

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      showToast('Image must be smaller than 500KB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('profileImage', reader.result, { shouldValidate: true, shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h3>
        <div className="flex bg-gray-100 p-1 rounded-lg dark:bg-gray-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setValue('isNewCustomer', true)}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isNewCustomer 
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            New Customer
          </button>
          <button
            type="button"
            onClick={() => setValue('isNewCustomer', false)}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !isNewCustomer 
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Existing Customer
          </button>
        </div>
      </div>

      {!isNewCustomer ? (
        <div className="animate-fade-in space-y-4">
          <Select
            label="Select Existing Customer *"
            name="existingCustomerId"
            value={existingCustomerId}
            options={customers.map(c => ({ 
              value: c._id, 
              label: `${c.name}${c.cellNumbers?.[0]?.number ? ` (${c.cellNumbers[0].number})` : ''}` 
            }))}
            placeholder={loadingCustomers ? 'Loading customers...' : 'Choose a customer'}
            error={errors.existingCustomerId?.message}
            {...register('existingCustomerId')}
          />
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-gray-100 dark:ring-gray-800">
                  {customerName.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <CameraIcon className="h-6 w-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional. Recommended size: 500x500px (Max 500KB)</p>
              {profileImage && (
                <button
                  type="button"
                  onClick={() => setValue('profileImage', '')}
                  className="text-xs text-red-500 mt-2 hover:text-red-600"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <Input
            label="Customer Name *"
            error={errors.customerName?.message}
            {...register('customerName')}
          />
          
          <Input
            label="Address"
            className="sm:col-span-2"
            {...register('address')}
          />

          <Input
            label="Monthly Salary"
            type="number"
            placeholder="0"
            {...register('monthlySalary')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Numbers
            </label>
            <div className="space-y-3">
              {cellFields.map((field, index) => (
                <div key={field.id} className="flex gap-3">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name={`cellNumbers.${index}.number`}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="tel"
                          placeholder="Phone number"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                      )}
                    />
                  </div>
                  {cellFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCell(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove contact"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              {cellFields.length < 3 && (
                <button
                  type="button"
                  onClick={() => addCell({ number: '' })}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add another number
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
