import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Fragment, forwardRef, useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

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
  ...props
}, ref) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : (defaultValue || ''));
  const localRef = useRef(null);

  // Set the forwarded ref as well
  const setRef = (node) => {
    localRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    const selectEl = localRef.current;
    if (!selectEl) return;

    const originalValueProp = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (!originalValueProp) return;

    Object.defineProperty(selectEl, 'value', {
      get() {
        return originalValueProp.get.call(this);
      },
      set(val) {
        originalValueProp.set.call(this, val);
        setInternalValue(val);
      },
      configurable: true
    });

    // Sync initial value of selectEl if it was set before our interceptor ran
    if (selectEl.value !== internalValue) {
      setInternalValue(selectEl.value);
    }

    return () => {
      Object.defineProperty(selectEl, 'value', originalValueProp);
    };
  }, [options]);

  const handleChange = (newVal) => {
    setInternalValue(newVal);
    if (onChange) {
      // Simulate event for react-hook-form register
      onChange({
        target: {
          name,
          value: newVal
        }
      });
    }
  };

  const selectedOption = options.find(o => String(o.value) === String(internalValue));

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      {/* Hidden select to hold the actual value for RHF and native form submisison */}
      <select
        ref={setRef}
        id={selectId}
        name={name}
        value={internalValue}
        onChange={handleChange}
        onBlur={onBlur}
        className="hidden"
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <Listbox value={internalValue} onChange={handleChange}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm border focus:outline-none focus:ring-2 sm:text-sm',
              error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500',
              className
            )}
          >
            <span className={clsx('block truncate', !selectedOption && 'text-gray-500')}>
              {selectedOption ? selectedOption.label : placeholder || 'Select...'}
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
                      active ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
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