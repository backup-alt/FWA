import { clsx } from 'clsx';

export function Stepper({ steps, currentStep, className = '' }) {
  return (
    <div className={clsx('flex items-center justify-between mb-8', className)}>
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                index < currentStep
                  ? 'bg-primary-600 text-white'
                  : index === currentStep
                  ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900/30'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  'w-16 h-0.5 mx-2',
                  index < currentStep ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
          <span
            className={clsx(
              'hidden sm:block text-sm font-medium text-center w-24',
              index === currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}