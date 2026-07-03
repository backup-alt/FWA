import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getYear,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

function parseInputDate(value) {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

function toInputDate(date) {
  return format(date, 'yyyy-MM-dd');
}

function getScrollableAncestor(element) {
  if (!element) return window;
  let current = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.getPropertyValue('overflow-y');
    const overflowX = style.getPropertyValue('overflow-x');
    const isScrollableY = overflowY === 'auto' || overflowY === 'scroll';
    const isScrollableX = overflowX === 'auto' || overflowX === 'scroll';
    if ((isScrollableY && current.scrollHeight > current.clientHeight) ||
        (isScrollableX && current.scrollWidth > current.clientWidth)) {
      return current;
    }
    current = current.parentElement;
  }
  return window;
}

function calculatePosition(buttonRect, panelHeight, panelWidth) {
  const spaceBelow = window.innerHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  const openAbove = spaceBelow < panelHeight + 16 && spaceAbove > spaceBelow;

  let left = buttonRect.left;
  if (left + panelWidth > window.innerWidth - 16) {
    left = window.innerWidth - panelWidth - 16;
  }
  if (left < 16) left = 16;

  const top = openAbove ? buttonRect.top - panelHeight - 8 : buttonRect.bottom + 8;
  return { top, left };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function DatePicker({
  value,
  onChange,
  disabled = false,
  allowClear = true,
  placeholder = 'Select date',
  ariaLabel = 'Select date',
}) {
  const buttonRef = useRef(null);
  const selectedDate = useMemo(() => parseInputDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate || new Date());
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const [view, setView] = useState('days');
  const scrollTargetRef = useRef(null);

  useEffect(() => {
    if (selectedDate) setViewMonth(selectedDate);
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const currentYear = getYear(new Date());
  const viewYear = getYear(viewMonth);
  const years = useMemo(() => {
    const start = currentYear - 10;
    return Array.from({ length: 21 }, (_, i) => start + i);
  }, [currentYear]);

  const recalculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const panelHeight = 340;
    const panelWidth = 288;
    const rect = buttonRef.current.getBoundingClientRect();
    setPanelPosition(calculatePosition(rect, panelHeight, panelWidth));
  }, []);

  useEffect(() => {
    if (!open) return;
    recalculatePosition();
    const scrollEl = scrollTargetRef.current || window;
    const scrollEvent = () => recalculatePosition();
    scrollEl.addEventListener('scroll', scrollEvent, { passive: true });
    window.addEventListener('resize', recalculatePosition);
    return () => {
      scrollEl.removeEventListener('scroll', scrollEvent);
      window.removeEventListener('resize', recalculatePosition);
    };
  }, [open, recalculatePosition]);

  const openCalendar = () => {
    if (disabled) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    scrollTargetRef.current = getScrollableAncestor(buttonRef.current);

    const panelHeight = 340;
    const panelWidth = 288;
    setPanelPosition(calculatePosition(rect, panelHeight, panelWidth));
    setOpen(true);
    setView('days');
  };

  const selectDate = (date) => {
    onChange(toInputDate(date));
    setOpen(false);
  };

  const clearDate = () => {
    onChange('');
    setOpen(false);
  };

  const handleYearChange = (year) => {
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
    setView('days');
  };

  const handleMonthChange = (monthIdx) => {
    setViewMonth(new Date(viewYear, monthIdx, 1));
    setView('days');
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openCalendar}
        disabled={disabled}
        aria-label={ariaLabel}
        className={clsx(
          'inline-flex w-40 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-left text-sm text-gray-900 shadow-sm outline-none transition',
          'hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className={clsx('truncate', !selectedDate && 'text-gray-400')}>
          {selectedDate ? format(selectedDate, 'dd MMM yyyy') : placeholder}
        </span>
        <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[70]" onMouseDown={() => setOpen(false)}>
          <div
            className="fixed w-72 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-xl dark:border-gray-700 dark:bg-gray-800"
            style={{ top: panelPosition.top, left: panelPosition.left }}
            onMouseDown={event => event.stopPropagation()}
          >
            {view === 'days' && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth(month => subMonths(month, 1))}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Previous month"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setView('months')}
                      className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      {format(viewMonth, 'MMM')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('years')}
                      className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      {format(viewMonth, 'yyyy')}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMonth(month => addMonths(month, 1))}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Next month"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {calendarDays.map(day => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, viewMonth);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => selectDate(day)}
                        className={clsx(
                          'h-9 rounded-lg text-sm transition',
                          isSelected
                            ? 'bg-primary-600 font-semibold text-white'
                            : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700',
                          !inMonth && !isSelected && 'text-gray-300 dark:text-gray-600',
                          isToday && !isSelected && 'ring-1 ring-primary-500'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => selectDate(new Date())}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-gray-700"
                  >
                    Today
                  </button>
                  {allowClear && (
                    <button
                      type="button"
                      onClick={clearDate}
                      className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </>
            )}

            {view === 'months' && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth(d => new Date(d.getFullYear() - 1, d.getMonth(), 1))}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Previous year"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('years')}
                    className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  >
                    {viewYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMonth(d => new Date(d.getFullYear() + 1, d.getMonth(), 1))}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Next year"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_NAMES.map((name, idx) => {
                    const isCurrent = viewMonth.getMonth() === idx;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleMonthChange(idx)}
                        className={clsx(
                          'rounded-lg py-2.5 text-sm font-medium transition',
                          isCurrent
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        {MONTH_ABBR[idx]}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === 'years' && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth(d => new Date(d.getFullYear() - 21, d.getMonth(), 1))}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Previous years"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {years[0]} - {years[years.length - 1]}
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMonth(d => new Date(d.getFullYear() + 21, d.getMonth(), 1))}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Next years"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {years.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleYearChange(y)}
                      className={clsx(
                        'rounded-lg py-2.5 text-sm font-medium transition',
                        y === viewYear
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}