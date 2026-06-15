import { useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export function ChequesStep({ form, control }) {
  const { register } = form;
  const { fields: chequeFields, append: addCheque, remove: removeCheque } = useFieldArray({
    control,
    name: 'chequesReceived',
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cheques Received</h3>
      
      <div className="space-y-4">
        {chequeFields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <input
              placeholder="Cheque Number"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
              {...register(`chequesReceived.${index}.chequeNumber`)}
            />
            <input
              placeholder="Bank"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
              {...register(`chequesReceived.${index}.bank`)}
            />
            <input
              type="number"
              placeholder="Amount"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600"
              {...register(`chequesReceived.${index}.amount`)}
            />
            {chequeFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeCheque(index)}
                className="self-end p-2 text-gray-400 hover:text-red-500"
                aria-label="Remove cheque"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        {chequeFields.length < 5 && (
          <button
            type="button"
            onClick={() => addCheque({ chequeNumber: '', bank: '', amount: 0 })}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <PlusIcon className="h-5 w-5" />
            Add another cheque
          </button>
        )}
      </div>
    </div>
  );
}
