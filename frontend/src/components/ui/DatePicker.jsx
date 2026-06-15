import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
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

  useEffect(() => {
    if (selectedDate) setViewMonth(selectedDate);
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const openCalendar = () => {
    if (disabled) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 288;
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
      setPanelPosition({ top: rect.bottom + 8, left });
    }
    setOpen(true);
  };

  const selectDate = (date) => {
    onChange(toInputDate(date));
    setOpen(false);
  };

  const clearDate = () => {
    onChange('');
    setOpen(false);
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
                onClick={() => setViewMonth(month => subMonths(month, 1))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {format(viewMonth, 'MMMM yyyy')}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth(month => addMonths(month, 1))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
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
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-800',
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
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-gray-800"
              >
                Today
              </button>
              {allowClear && (
                <button
                  type="button"
                  onClick={clearDate}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
