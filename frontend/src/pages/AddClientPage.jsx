import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Stepper } from '@/components/forms/Stepper';
import { VehicleDetailsStep } from '@/components/forms/VehicleDetailsStep';
import { DocumentationStep } from '@/components/forms/DocumentationStep';
import { CustomerStep } from '@/components/forms/CustomerStep';
import { GuarantorStep } from '@/components/forms/GuarantorStep';
import { ChequesStep } from '@/components/forms/ChequesStep';
import { useCreateLoan } from '@/hooks/useLoans';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/api';

const steps = [
  { label: 'Vehicle & Finance' },
  { label: 'Documentation' },
  { label: 'Customer' },
  { label: 'Guarantor' },
  { label: 'Cheques' },
];

const schema = z.object({
  vehicleType: z.enum(['Bike', 'Car'], { required_error: 'Vehicle type is required' }),
  make: z.string().optional(),
  model: z.string().optional(),
  regNo: z.string().optional(),
  loanAmount: z.coerce.number().min(1, 'Loan amount is required'),
  financeAmount: z.coerce.number().min(1, 'Finance amount is required'),
  interestRate: z.coerce.number().min(0.01, 'Interest rate is required'),
  installmentPeriod: z.coerce.number().min(1, 'Period is required'),
  loanStartDate: z.string().min(1, 'Start date is required'),
  rcDetails: z.object({
    status: z.string().optional(),
    paidThrough: z.string().optional(),
    chequeNumber: z.string().optional(),
    amount: z.coerce.number().optional(),
  }).optional(),
  noc: z.string().optional(),
  insurance: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  keyStatus: z.string().optional(),
  salesDoneBy: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  address: z.string().optional(),
  monthlySalary: z.coerce.number().optional(),
  cellNumbers: z.array(z.object({
    number: z.string().optional(),
  })).optional(),
  guarantor: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  chequesReceived: z.array(z.object({
    chequeNumber: z.string().optional(),
    bank: z.string().optional(),
    amount: z.coerce.number().optional(),
  })).optional(),
});

export function AddClientPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createLoan = useCreateLoan();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      loanStartDate: new Date().toISOString().split('T')[0],
      cellNumbers: [{ number: '' }],
      guarantor: { name: '', address: '' },
      chequesReceived: [{ chequeNumber: '', bank: '', amount: 0 }],
      rcDetails: { status: '', paidThrough: '', chequeNumber: '', amount: 0 },
    },
  });

  const watchedValues = watch();
  const loanAmount = Number(watchedValues.loanAmount || 0);
  const financeAmount = Number(watchedValues.financeAmount || 0);
  const interestRate = Number(watchedValues.interestRate || 0);
  const installmentPeriod = Number(watchedValues.installmentPeriod || 0);
  const interestAmount = financeAmount && interestRate && installmentPeriod
    ? +(financeAmount * (interestRate / 100) * (installmentPeriod / 12)).toFixed(2)
    : 0;
  const monthlyDue = financeAmount && installmentPeriod
    ? +((financeAmount + interestAmount) / installmentPeriod).toFixed(2)
    : 0;

  const hasAnyValue = (obj = {}) =>
    Object.values(obj).some(value => value !== undefined && value !== null && value !== '' && value !== 0);

  const nextStep = (event) => {
    event?.preventDefault();
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = (event) => {
    event?.preventDefault();
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      
      const payload = {
        ...data,
        cellNumbers: data.cellNumbers?.filter(c => c.number) || [],
        chequesReceived: data.chequesReceived?.filter(c => c.chequeNumber) || [],
        guarantor: hasAnyValue(data.guarantor) ? data.guarantor : undefined,
        rcDetails: hasAnyValue(data.rcDetails) ? data.rcDetails : undefined,
      };
      
      const loan = await createLoan.mutateAsync(payload);
      showToast('Loan created successfully!', 'success');
      navigate(`/client/${loan._id}`);
    } catch (err) {
      showToast(err.message || 'Failed to create loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <VehicleDetailsStep form={ { register, watch, setValue, formState: { errors } } } />;
      case 1: return <DocumentationStep form={ { register, watch, setValue, formState: { errors } } } />;
      case 2: return <CustomerStep form={ { register, watch, setValue, formState: { errors }, control } } control={control} />;
      case 3: return <GuarantorStep form={ { register, watch, setValue, formState: { errors } } } />;
      case 4: return <ChequesStep form={ { register, watch, setValue, formState: { errors }, control } } control={control} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Client Loan File</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {watchedValues.vehicleType ? `${watchedValues.vehicleType} project` : 'Bike or car project'} - customer loan register
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loan Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(loanAmount)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">L.AMT in the ledger</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Due</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(monthlyDue)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Auto schedule amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Interest Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(interestAmount)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{interestRate || 0}% annual flat rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Installment Period</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{installmentPeriod || 0} months</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Editable before save</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Ledger Entry"
          subtitle="Page 116 fields first, then the repayment tracker is generated automatically"
        />
        <CardContent className="p-6">
          <Stepper steps={steps} currentStep={currentStep} />
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="animate-fade-in">
              {renderStep()}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </Button>
              
              <div className="flex gap-3">
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" loading={submitting || createLoan.isPending}>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Create Loan & Generate Schedule
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
