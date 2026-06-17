import { clsx } from 'clsx';
import { forwardRef } from 'react';

export const Select = forwardRef(function Select({
  options = [],
  placeholder,
  error,
  helperText,
  label,
  className = '',
  disabled = false,
  value,
  name,
  onChange,
  onBlur,
  ...props
}, ref) {
  const currentValue = value ?? '';

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={name}
          name={name}
          value={currentValue}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={clsx(
            'w-full appearance-none px-3 py-2.5 pr-10 text-sm rounded-lg shadow-sm border transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'dark:bg-gray-800 dark:text-white dark:border-gray-600',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-900 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600 text-gray-900',
            disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
            !currentValue && 'text-gray-400 dark:text-gray-500'
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});