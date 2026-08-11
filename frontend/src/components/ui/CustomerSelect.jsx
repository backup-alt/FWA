import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useInfiniteCustomers } from '@/hooks/useCustomers';

// Remembers customers seen by any CustomerSelect instance so the collapsed
// button keeps showing a label after the customer scrolls out of the loaded
// pages or is filtered out by a search.
const customerCache = new Map();

function renderCustomerLabel(customer) {
  return (
    <>
      {customer.fileId ? (
        <>
          <span className="font-semibold">File No. #{customer.fileId}</span>
          <span className="text-gray-400 dark:text-gray-500"> — {customer.name || 'Unnamed customer'}</span>
        </>
      ) : (
        <span>{customer.name || 'Unnamed customer'}</span>
      )}
    </>
  );
}

export function CustomerSelect({
  value,
  onChange,
  label,
  placeholder = 'Choose a customer',
  error,
  helperText,
  className = '',
  disabled = false,
  onBlur,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const optionsRef = useRef(null);
  const loadingRef = useRef(false);
  const sentinelObserverRef = useRef(null);

  // Debounce the search input (300ms). Empty input resolves immediately so the
  // full list shows up without waiting.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      return undefined;
    }
    const id = setTimeout(() => setDebouncedQuery(trimmed), 300);
    return () => clearTimeout(id);
  }, [query]);

  const searchParams = useMemo(
    () => (debouncedQuery ? { search: debouncedQuery } : {}),
    [debouncedQuery]
  );

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteCustomers(searchParams);

  // Flatten all loaded pages and dedupe by _id (a customer can only appear once).
  const customers = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const page of data?.pages || []) {
      for (const customer of page.data || []) {
        if (!seen.has(customer._id)) {
          seen.add(customer._id);
          list.push(customer);
        }
      }
    }
    return list;
  }, [data?.pages]);

  // Cache every customer we've seen so the button label survives search
  // changes and remounts (value persists but may not be in the loaded pages).
  useEffect(() => {
    for (const customer of customers) {
      customerCache.set(customer._id, customer);
    }
  }, [customers]);

  const selectedCustomer = useMemo(
    () =>
      value
        ? customers.find((customer) => customer._id === value) ||
          customerCache.get(value) ||
          null
        : null,
    [value, customers]
  );

  const handleChange = (newValue) => {
    if (onChange) onChange(newValue);
    setIsOpen(false);
  };

  // Fetch the next page when the list runs low. loadingRef closes the gap
  // between the guard check and the fetch settling (isFetchingNextPage only
  // updates on the next render), so duplicate/parallel fetches never happen.
  const maybeLoadMore = useCallback(() => {
    if (loadingRef.current) return;
    if (!hasNextPage || isFetchingNextPage || isError) return;
    loadingRef.current = true;
    fetchNextPage().catch(() => {}).finally(() => {
      loadingRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  // Primary trigger: a scroll listener on the options list. Deterministic — it
  // fires whenever the user scrolls near the bottom, regardless of how the
  // dropdown is positioned. The listener (and the immediate fill check) are
  // re-armed whenever isOpen or maybeLoadMore changes.
  useEffect(() => {
    if (!isOpen) return undefined;
    const el = optionsRef.current;
    if (!el) return undefined;
    const onScroll = () => maybeLoadMore();
    el.addEventListener('scroll', onScroll, { passive: true });
    // If the first page doesn't fill the container, fill it right away.
    maybeLoadMore();
    return () => el.removeEventListener('scroll', onScroll);
  }, [isOpen, maybeLoadMore]);

  // Backstop: an IntersectionObserver on the sentinel at the bottom of the
  // list, so loading also triggers without a scroll event (e.g. keyboard
  // navigation). The callback ref re-arms the observer whenever the sentinel
  // mounts/unmounts or maybeLoadMore changes.
  const setSentinelRef = useCallback((node) => {
    if (sentinelObserverRef.current) {
      sentinelObserverRef.current.disconnect();
      sentinelObserverRef.current = null;
    }
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) maybeLoadMore();
        },
        { rootMargin: '200px' }
      );
      observer.observe(node);
      sentinelObserverRef.current = observer;
    }
  }, [maybeLoadMore]);

  // Close when clicking outside the component.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Autofocus the search box when the dropdown opens (after Headless UI has
  // focused the options container, so it wins).
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Reset the scroll position whenever the search changes.
  useEffect(() => {
    if (optionsRef.current) optionsRef.current.scrollTop = 0;
  }, [debouncedQuery]);

  const handleSearchKeyDown = (event) => {
    // Let Escape bubble up to Listbox.Options so Headless UI closes too,
    // keeping its internal state in sync with ours.
    if (event.key === 'Escape') return;
    // Stop all other keys so Headless UI's option typeahead/navigation doesn't
    // react while the user is typing in the search box.
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      // Hand keyboard navigation over to the options list.
      event.preventDefault();
      optionsRef.current?.focus();
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const showLoading = isLoading && customers.length === 0;
  const showEmpty = !showLoading && !isError && customers.length === 0;

  return (
    <div className={clsx('w-full relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <Listbox value={value || ''} onChange={handleChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            onBlur={() => {
              if (onBlur) onBlur();
            }}
            onClick={() => {
              const next = !isOpen;
              setIsOpen(next);
              if (next) setQuery('');
            }}
            className={clsx(
              'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2.5 pl-3 pr-10 text-left text-sm border shadow-sm transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-red-900 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
              disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
              !selectedCustomer && 'text-gray-400 dark:text-gray-500'
            )}
          >
            <span className="block truncate">
              {selectedCustomer ? renderCustomerLabel(selectedCustomer) : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            show={isOpen}
            as="div"
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Listbox.Options
              ref={optionsRef}
              static
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsOpen(false);
              }}
              className="absolute z-[100] mt-1.5 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none text-sm"
              style={{ minWidth: '100%' }}
            >
              {/* Search input */}
              <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 pt-2 pb-1.5">
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search by name or file number..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-1.5 pl-8 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="py-1.5">
                {showLoading ? (
                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400">Loading customers...</div>
                ) : isError && customers.length === 0 ? (
                  <div className="px-3 py-2 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">Failed to load customers.</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Retry
                    </button>
                  </div>
                ) : showEmpty ? (
                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                    {debouncedQuery ? 'No customers found' : 'No customers available'}
                  </div>
                ) : (
                  <>
                    {customers.map((customer) => (
                      <Listbox.Option key={customer._id} value={customer._id}>
                        {({ active, selected }) => (
                          <div
                            className={clsx(
                              'relative cursor-pointer select-none py-2.5 pl-10 pr-4 mx-1 rounded-lg transition-colors',
                              active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
                            )}
                          >
                            {customer.fileId ? (
                              <>
                                <span className="block truncate font-semibold">
                                  File No. #{customer.fileId}
                                </span>
                                <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
                                  {customer.name || 'Unnamed customer'}
                                </span>
                              </>
                            ) : (
                              <span className="block truncate font-normal">
                                {customer.name || 'Unnamed customer'}
                              </span>
                            )}
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}

                    <div ref={setSentinelRef} className="h-px" aria-hidden="true" />

                    {isFetchingNextPage && (
                      <div className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                        Loading more…
                      </div>
                    )}
                    {isError && customers.length > 0 && (
                      <div className="px-3 py-2 text-center">
                        <p className="text-xs text-red-600 dark:text-red-400">Failed to load more customers.</p>
                        <button
                          type="button"
                          onClick={() => fetchNextPage()}
                          className="mt-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {!hasNextPage && !isFetchingNextPage && (
                      <div className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                        End of list
                      </div>
                    )}
                  </>
                )}
              </div>
            </Listbox.Options>
          </Transition>
        </div>
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
