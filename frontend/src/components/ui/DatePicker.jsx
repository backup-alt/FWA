import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [yearPicker, setYearPicker] = useState(false);

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
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const openCalendar = () => {
    if (disabled) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const panelHeight = 340;
      const panelWidth = 288;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;

      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 16) {
        left = window.innerWidth - panelWidth - 16;
      }
      if (left < 16) left = 16;

      const top = openAbove ? rect.top - panelHeight - 8 : rect.bottom + 8;
      setPanelPosition({ top, left });
    }
    setOpen(true);
    setYearPicker(false);
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
    const newDate = new Date(year, viewMonth.getMonth(), 1);
    setViewMonth(newDate);
    setYearPicker(false);
  };

  const handleMonthChange = (monthIdx) => {
    const newDate = new Date(viewYear, monthIdx, 1);
    setViewMonth(newDate);
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
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => yearPicker ? setYearPicker(false) : setViewMonth(month => subMonths(month, 1))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label={yearPicker ? 'Close year picker' : 'Previous month'}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {yearPicker ? (
                <div className="flex gap-1 flex-wrap justify-center max-w-full">
                  {years.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleYearChange(y)}
                      className={clsx(
                        'w-12 rounded-lg py-1.5 text-sm font-medium transition',
                        y === viewYear
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setYearPicker(true)}
                    className="text-sm font-bold text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 cursor-pointer"
                  >
                    {format(viewMonth, 'yyyy')}
                  </button>
                  <div className="flex gap-1">
                    {months.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMonthChange(idx)}
                        className={clsx(
                          'w-6 rounded text-xs font-medium transition p-0.5',
                          format(viewMonth, 'MMMM') === m
                            ? 'text-primary-600 dark:text-primary-400 font-bold'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        )}
                      >
                        {m.slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => yearPicker ? setYearPicker(false) : setViewMonth(month => addMonths(month, 1))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label={yearPicker ? 'Close year picker' : 'Next month'}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            {!yearPicker && (
              <>
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
              </>
            )}

            {!yearPicker && (
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
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
