import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Fragment, forwardRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';

/**
 * Custom Select built on Headless UI Listbox.
 * Works with react-hook-form register() when paired with a value prop from watch().
 * Example:
 *   const vehicleType = watch('vehicleType');
 *   <Select value={vehicleType} {...register('vehicleType')} options={...} />
 */
export const Select = forwardRef(function Select({
  className = '',
  label,
  error,
  helperText,
  id,
  options = [],
  placeholder,
  value,
  onChange,
  onBlur,
  name,
  defaultValue,
  disabled = false,
  ...props
}, ref) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || name;

  const [internalValue, setInternalValue] = useState(
    value !== undefined ? value : (defaultValue || '')
  );

  // Sync with controlled value prop (e.g. from watch() restoring cached form state)
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (newVal) => {
    setInternalValue(newVal);
    if (onChange) {
      // Fire synthetic event compatible with react-hook-form's register()
      onChange({ target: { name, value: newVal } });
    }
  };

  const selectedOption = options.find(o => String(o.value) === String(internalValue));

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}

      {/*
        Hidden native <select> — only here so react-hook-form's register() ref
        can find a real DOM node. It is aria-hidden and never interacted with.
        The Listbox below handles all actual user interaction.
      */}
      <select
        ref={ref}
        id={selectId}
        name={name}
        onBlur={onBlur}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <Listbox value={internalValue} onChange={handleChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm border focus:outline-none focus:ring-2 sm:text-sm transition-colors',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500',
              disabled && 'opacity-60 cursor-not-allowed',
              className
            )}
          >
            <span className={clsx('block truncate', !selectedOption && 'text-gray-400 dark:text-gray-500')}>
              {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-default select-none py-2 pl-10 pr-4 transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100'
                        : 'text-gray-900 dark:text-gray-100'
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';