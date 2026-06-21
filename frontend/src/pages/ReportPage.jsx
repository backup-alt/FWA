import { useState, useMemo } from 'react';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/api';
import { clsx } from 'clsx';

export function ReportPage() {
  const [mode, setMode] = useState('single');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({ start: new Date(), end: null });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
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
        setReportData({ dueCount: 0, paidCount: 0, dueLoans: [], paidLoans: [], dueTotal: 0, paidTotal: 0 });
      }
    } catch (err) {
      setReportData({ dueCount: 0, paidCount: 0, dueLoans: [], paidLoans: [], dueTotal: 0, paidTotal: 0 });
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

    const dateRange = mode === 'single'
      ? formatDateStr(selectedDate)
      : `${formatDateStr(selectedRange.start)} - ${selectedRange.end ? formatDateStr(selectedRange.end) : 'N/A'}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; }
          .due-section { color: #e65100; }
          .paid-section { color: #2e7d32; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { padding: 15px; border-radius: 8px; flex: 1; }
          .due-card { background-color: #fff3e0; }
          .paid-card { background-color: #e8f5e9; }
          .summary-number { font-size: 24px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Payment Report</h1>
        <p><strong>Date Range:</strong> ${dateRange}</p>

        <div class="summary">
          <div class="summary-card due-card">
            <div class="due-section">Due Today</div>
            <div class="summary-number">${reportData.dueCount}</div>
            <div>Total: ₹${(reportData.dueTotal || 0).toLocaleString()}</div>
          </div>
          <div class="summary-card paid-card">
            <div class="paid-section">Paid Today</div>
            <div class="summary-number">${reportData.paidCount}</div>
            <div>Total: ₹${(reportData.paidTotal || 0).toLocaleString()}</div>
          </div>
        </div>

        <h2 class="due-section">Pending Payments</h2>
        ${reportData.dueLoans.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Vehicle</th>
              <th>Reg No</th>
              <th>Amount</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.dueLoans.map(loan => `
              <tr>
                <td>${loan.customerName || '-'}</td>
                <td>${loan.vehicleType || ''} ${loan.make || ''} ${loan.model || ''}</td>
                <td>${loan.regNo || '-'}</td>
                <td>₹${(loan.dueAmount || 0).toLocaleString()}</td>
                <td>${formatDateStr(loan.dueDate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>No pending payments for this period.</p>'}

        <h2 class="paid-section">Payments Received</h2>
        ${reportData.paidLoans.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Vehicle</th>
              <th>Reg No</th>
              <th>Amount</th>
              <th>Paid Date</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.paidLoans.map(loan => `
              <tr>
                <td>${loan.customerName || '-'}</td>
                <td>${loan.vehicleType || ''} ${loan.make || ''} ${loan.model || ''}</td>
                <td>${loan.regNo || '-'}</td>
                <td>₹${(loan.amountReceived || 0).toLocaleString()}</td>
                <td>${formatDateStr(loan.dateReceived)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>No payments received for this period.</p>'}

        <div class="footer">
          Generated on ${new Date().toLocaleString()} | RAM Finance
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <NavLink to="/" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
          <ArrowLeftIcon className="h-5 w-5" />
        </NavLink>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate and download payment reports</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
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
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
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
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
                >
                  <span className="text-gray-700 dark:text-gray-200">{displayDate}</span>
                </button>

                {showCalendar && (
                  <div className="absolute z-50 top-full mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
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

              <Button onClick={generateReport} loading={loading}>
                Generate Report
              </Button>
            </div>

            {reportData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Due</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{reportData.dueCount}</p>
                    <p className="text-sm text-orange-500 mt-1">Total: {formatCurrency(reportData.dueTotal || 0)}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Paid</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{reportData.paidCount}</p>
                    <p className="text-sm text-green-500 mt-1">Total: {formatCurrency(reportData.paidTotal || 0)}</p>
                  </div>
                </div>

                {reportData.dueCount > 0 || reportData.paidCount > 0 ? (
                  <Button onClick={downloadReport} className="flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download PDF Report
                  </Button>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No payment data found for this period.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}