import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const BIKE_BRANDS = [
  'Honda', 'TVS', 'Bajaj', 'Hero', 'Royal Enfield', 'Yamaha', 'Suzuki', 'Kawasaki',
  'KTM', 'Harley-Davidson', 'Benelli', 'Ducati', 'BMW', 'Jawa', 'Yezdi', 'Ampere',
  'Ather', 'BGauss', 'Crayon Motors', 'E-Sprinto', 'Evolet', 'Gemopai', 'Gyro',
  'Hop Electric', 'Infinity', 'Joy E-Bike', 'Lectrix EV', 'LML', 'Moter', 'Okinawa',
  'Ola Electric', 'Pbike', 'Piaggio', 'Quantum', 'Rajdoot', 'Rajasthan', 'Rammy',
  'Skey', 'Sringer', 'Styla', 'Suzuki', 'Techo', 'Trinity', 'Tvs', 'Ultron', 'Vespa',
  'Vida', 'Woloo', 'Yulu', 'Zon', 'Other'
];

const CAR_BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Ford', 'Volkswagen',
  'Skoda', 'Renault', 'Nissan', 'Kia', 'MG', 'Jeep', 'Fiat', 'Chevrolet', 'Mercedes-Benz',
  'BMW', 'Audi', 'Volvo', 'Lexus', 'Porsche', 'Land Rover', 'Jaguar', 'Mini', 'Bentley',
  'Ferrari', 'Lamborghini', 'Maserati', 'Rolls-Royce', 'Aston Martin', 'Bugatti', 'Tesla',
  'BYD', 'Citroen', 'Isuzu', 'Lexus', 'Peugeot', 'SsangYong', 'Suzuki', 'Other'
];

const ALL_BRANDS = [...new Set([...BIKE_BRANDS, ...CAR_BRANDS])].sort();

export function MakeSelect({ value, onChange, vehicleType, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const brands = useMemo(() => {
    if (vehicleType === 'Bike') return BIKE_BRANDS;
    if (vehicleType === 'Car') return CAR_BRANDS;
    return ALL_BRANDS;
  }, [vehicleType]);

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase();
    return brands.filter(b => b.toLowerCase().includes(q));
  }, [brands, searchQuery]);

  const selectedBrand = brands.find(b => b.toLowerCase() === (value || '').toLowerCase()) || (value ? { value, label: value } : null);

  const handleSelect = (brandValue) => {
    if (brandValue === '__other__') {
      setShowOtherInput(true);
      setIsOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      onChange(brandValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onChange(otherValue.trim());
      setShowOtherInput(false);
      setOtherValue('');
    }
  };

  const handleOtherKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOtherSubmit();
    } else if (e.key === 'Escape') {
      setShowOtherInput(false);
      setOtherValue('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (showOtherInput) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Make
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyDown={handleOtherKeyDown}
            placeholder="Enter Make"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            autoFocus
          />
          <button
            type="button"
            onClick={handleOtherSubmit}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowOtherInput(false); setOtherValue(''); }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full" ref={containerRef}>
      <Listbox value={value || ''} onChange={handleSelect}>
        <div className="relative">
          <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Make
          </Listbox.Label>
          <Listbox.Button
            onBlur={() => {
              setIsOpen(false);
            }}
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2.5 pl-3 pr-10 text-left text-sm border shadow-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-900 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
              !value && 'text-gray-400 dark:text-gray-500'
            )}
          >
            <span className="block truncate">{selectedBrand ? selectedBrand.label || selectedBrand : 'Select Make'}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none">
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search brands..."
                    className="w-full py-1.5 pl-8 pr-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white dark:placeholder-gray-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect('__other__')}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors border border-dashed border-primary-300 dark:border-primary-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Other (Add New)
                </button>
              </div>
              <div className="max-h-52 overflow-auto py-1.5">
                {filteredBrands.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                    No brands found
                  </div>
                ) : (
                  filteredBrands.map((brand) => (
                    <Listbox.Option
                      key={brand}
                      value={brand}
                      as={Fragment}
                    >
                      {({ active, selected }) => (
                        <li
                          className={clsx(
                            'relative cursor-pointer select-none py-2 pl-10 pr-4 mx-1 rounded-lg transition-colors text-sm',
                            active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                          )}
                        >
                          <span className="block truncate font-normal">
                            {brand}
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
              </div>
            </div>
          </Transition>
        </div>
      </Listbox>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function MagnifyingGlassIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}