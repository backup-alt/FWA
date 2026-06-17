import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { forwardRef, useState, useEffect } from 'react';

export const Select = forwardRef(function Select({
  className = '',
  label,
  error,
  helperText,
  id,
  name,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  onChange,
  onBlur,
  value,
  defaultValue,
  searchable = false,
  ...props
}, ref) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || name;
  
  const currentValue = value || defaultValue || '';
  
  const selectedOption = options.find(opt => opt.value === currentValue);

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleChange = (newValue) => {
    if (onChange) {
      onChange({ target: { name, value: newValue } });
    }
    setSearchQuery('');
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      <Listbox
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        defaultValue={defaultValue}
      >
        <div className="relative">
          <Listbox.Button
            ref={ref}
            id={selectId}
            name={name}
            onBlur={onBlur}
            className={clsx(
              'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2.5 pl-3 pr-10 text-left text-sm border shadow-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-900 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
              disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
              !selectedOption && 'text-gray-400 dark:text-gray-500'
            )}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1.5 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none text-sm">
              {searchable && (
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
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
          </Transition>
        </div>
      </Listbox>

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

Select.displayName = 'Select';