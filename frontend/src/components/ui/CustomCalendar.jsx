import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export function CustomCalendar({ selectedDate, onDateSelect, selectedRange, onRangeSelect, mode = 'single' }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingRangeEnd, setSelectingRangeEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isSelected = (day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    if (mode === 'single' && selectedDate) {
      return date.getTime() === selectedDate.getTime();
    }
    if (mode === 'range' && selectedRange?.start) {
      if (date.getTime() === selectedRange.start.getTime()) return true;
      if (selectedRange.end && date.getTime() === selectedRange.end.getTime()) return true;
      if (!selectedRange.end && hoverDate) {
        const start = selectedRange.start;
        const end = hoverDate;
        const min = Math.min(start.getTime(), end.getTime());
        const max = Math.max(start.getTime(), end.getTime());
        return date.getTime() >= min && date.getTime() <= max;
      }
    }
    return false;
  };

  const isInRange = (day) => {
    if (mode !== 'range' || !selectedRange?.start) return false;
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const start = selectedRange.start;
    if (!selectedRange.end) {
      if (!hoverDate) return false;
      const end = hoverDate;
      const min = Math.min(start.getTime(), end.getTime());
      const max = Math.max(start.getTime(), end.getTime());
      return date.getTime() > min && date.getTime() < max;
    }
    const end = selectedRange.end;
    return date.getTime() > start.getTime() && date.getTime() < end.getTime();
  };

  const handleDateClick = (day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    if (mode === 'single') {
      onDateSelect?.(date);
    } else if (mode === 'range') {
      if (!selectingRangeEnd) {
        onRangeSelect?.({ start: date, end: null });
        setSelectingRangeEnd(true);
      } else {
        const start = selectedRange?.start;
        if (start && date.getTime() < start.getTime()) {
          onRangeSelect?.({ start: date, end: start });
        } else {
          onRangeSelect?.({ start, end: date });
        }
        setSelectingRangeEnd(false);
      }
    }
  };

  const handleDateHover = (day) => {
    if (mode === 'range' && selectingRangeEnd) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      setHoverDate(date);
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className={clsx(mode === 'single' ? 'w-72' : 'w-full max-w-sm')}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => handleDateHover(day)}
              onMouseLeave={() => setHoverDate(null)}
              className={clsx(
                'h-8 w-full text-sm rounded-lg transition-colors',
                isSelected(day)
                  ? 'bg-primary-600 text-white'
                  : isInRange(day)
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
                isToday(day) && !isSelected(day) && 'font-bold text-primary-600 dark:text-primary-400'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {mode === 'range' && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {selectingRangeEnd ? 'Select end date' : 'Select start date'}
        </div>
      )}
    </div>
  );
}