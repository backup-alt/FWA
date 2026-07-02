import { Input } from '@/components/ui';

export function GuarantorStep({ form }) {
  const { register } = form;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Guarantor Details</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Guarantor Name"
          {...register('guarantor.name')}
        />

        <Input
          label="Guarantor Mobile"
          type="tel"
          placeholder="Phone number"
          {...register('guarantor.mobile')}
        />

        <Input
          label="Guarantor Address"
          className="sm:col-span-2"
          {...register('guarantor.address')}
        />
      </div>
    </div>
  );
}
