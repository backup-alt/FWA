import { Input } from '@/components/ui';
import { useFieldArray, Controller } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export function CustomerStep({ form, control }) {
  const {
    register,
    formState: { errors },
  } = form;
  const { fields: cellFields, append: addCell, remove: removeCell } = useFieldArray({
    control,
    name: 'cellNumbers',
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h3>
      
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
              <div className="w-48">
                <Controller
                  control={control}
                  name={`cellNumbers.${index}.label`}
                  render={({ field }) => (
                    <input
                      {...field}
                      placeholder="Label (e.g. Self)"
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
              onClick={() => addCell({ number: '', label: '' })}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <PlusIcon className="h-5 w-5" />
              Add another number
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
