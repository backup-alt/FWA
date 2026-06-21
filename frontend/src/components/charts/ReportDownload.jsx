import { useState, useMemo } from 'react';
import { ArrowDownTrayIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/api';
import { clsx } from 'clsx';

export function ReportDownload({ className = '' }) {
  const [mode, setMode] = useState('single');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({ start: new Date(), end: null });
  const [showCalendar, setShowCalendar] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    if (range.end) {
      setShowCalendar(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      if (mode === 'single') {
        startDate = selectedDate;
        endDate = selectedDate;
      } else {
        startDate = selectedRange.start;
        endDate = selectedRange.end || selectedRange.start;
      }

      const response = await fetch(`/api/loans/report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        setReportData({ dueCount: 0, paidCount: 0, dueLoans: [], paidLoans: [] });
      }
    } catch (err) {
      setReportData({ dueCount: 0, paidCount: 0, dueLoans: [], paidLoans: [] });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const formatDateStr = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    let csv = 'Type,Customer Name,Vehicle,Reg No,Amount,Date\n';

    reportData.dueLoans.forEach(loan => {
      csv += `Due,${loan.customerName || ''},${loan.vehicleType || ''} ${loan.make || ''} ${loan.model || ''},${loan.regNo || ''},${loan.dueAmount || 0},${formatDateStr(loan.dueDate)}\n`;
    });

    reportData.paidLoans.forEach(loan => {
      csv += `Paid,${loan.customerName || ''},${loan.vehicleType || ''} ${loan.make || ''} ${loan.model || ''},${loan.regNo || ''},${loan.amountReceived || 0},${formatDateStr(loan.dateReceived)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${formatDateStr(mode === 'single' ? selectedDate : selectedRange.start)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const displayDate = useMemo(() => {
    if (mode === 'single') {
      return selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } else {
      const start = selectedRange.start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const end = selectedRange.end ? selectedRange.end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select end date';
      return `${start} - ${end}`;
    }
  }, [mode, selectedDate, selectedRange]);

  return (
    <Card className={className}>
      <CardHeader
        title="Payment Report"
        subtitle="View and download payment summary for a specific date or range"
      />
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  mode === 'single'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  mode === 'range'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                Date Range
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">{displayDate}</span>
              </button>

              {showCalendar && (
                <div className="absolute z-50 mt-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-end mb-1">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  <CustomCalendar
                    mode={mode}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    selectedRange={selectedRange}
                    onRangeSelect={handleRangeSelect}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={generateReport}
              loading={loading}
              size="sm"
            >
              Generate Report
            </Button>
          </div>

          {reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Due Today</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{reportData.dueCount}</p>
                  <p className="text-sm text-orange-500 dark:text-orange-500 mt-1">
                    Total: {formatCurrency(reportData.dueTotal || 0)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Paid Today</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{reportData.paidCount}</p>
                  <p className="text-sm text-green-500 dark:text-green-500 mt-1">
                    Total: {formatCurrency(reportData.paidTotal || 0)}
                  </p>
                </div>
              </div>

              {(reportData.dueLoans?.length > 0 || reportData.paidLoans?.length > 0) && (
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download CSV Report
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}