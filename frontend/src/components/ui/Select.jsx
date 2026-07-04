import { Fragment, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export function Select({
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  label,
  className = '',
  disabled = false,
  value,
  onChange,
  onBlur,
  name,
  ref,
}) {
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find(opt => opt.value === value);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (buttonRef.current) {
      updatePosition();
    }
  }, []);

  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <Listbox value={value || ''} onChange={handleChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Button
              ref={(el) => {
                buttonRef.current = el;
                if (ref) {
                  if (typeof ref === 'function') ref(el);
                  else ref.current = el;
                }
              }}
              onBlur={() => {
                if (onBlur) onBlur();
              }}
              onClick={updatePosition}
              className={clsx(
                'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2.5 pl-3 pr-10 text-left text-sm border shadow-sm transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                error
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-900 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
                disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
                !selectedOption && 'text-gray-400 dark:text-gray-500'
              )}
            >
              <span className="block truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            {open && createPortal(
              <div className="fixed inset-0 z-[100]">
                <div
                  className="fixed inset-0"
                  onClick={() => document.body.click()}
                />
                <Listbox.Options
                  static
                  className="absolute z-[101] max-h-60 overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1.5 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none text-sm"
                  style={{
                    top: menuPosition.top,
                    left: menuPosition.left,
                    width: menuPosition.width,
                  }}
                >
                  {options.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      No options available
                    </div>
                  ) : (
                    options.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        as={Fragment}
                      >
                        {({ active, selected }) => (
                          <li
                            className={clsx(
                              'relative cursor-pointer select-none py-2.5 pl-10 pr-4 mx-1 rounded-lg transition-colors',
                              active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                            )}
                          >
                            <span className="block truncate font-normal">
                              {option.label}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </li>
                        )}
                      </Listbox.Option>
                    ))
                  )}
                </Listbox.Options>
              </div>,
              document.body
            )}
          </>
        )}
      </Listbox>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error.message || error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
