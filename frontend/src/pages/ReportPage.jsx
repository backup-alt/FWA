import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, Loans } from '@/api';
import { clsx } from 'clsx';
import { useToast } from '@/context/ToastContext';
const autoIcon = '/FWA/icons8-auto-rickshaw-50.png';

const BikeIcon = () => (
  <svg viewBox="0 0 512 512" className="h-4 w-4" fill="currentColor">
    <path d="M417.975,226.338c-5.966,0-11.764,0.618-17.404,1.684l-33.048-100.841c-5.781-17.644-22.258-29.577-40.822-29.577h-45.506v24.414h45.506c8.038-0.008,15.147,5.155,17.636,12.768l6.028,18.433h-60.684c-31.084,0-54.424,15.542-54.424,15.542v45.358h135.064l7.064,21.54c-31.579,15.163-53.42,47.345-53.435,84.704c0.016,51.936,42.09,94.018,94.026,94.033c51.92-0.015,94.01-42.097,94.025-94.033C511.985,268.435,469.895,226.353,417.975,226.338z M461.456,363.844c-11.175,11.144-26.462,18.007-43.48,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.144-11.176-18.008-26.447-18.008-43.481c0-17.026,6.863-32.29,18.008-43.465c3.88-3.88,8.409-7.01,13.185-9.754l11.114,33.928c-4.962,4.931-8.037,11.748-8.037,19.29c0,15.032,12.18,27.22,27.204,27.22c15.024,0,27.204-12.188,27.204-27.22c0-13.633-10.062-24.809-23.14-26.787l-11.128-33.974c2.35-0.278,4.637-0.711,7.064-0.711c17.018,0,32.305,6.855,43.48,18.008c11.144,11.175,17.977,26.439,18.008,43.465C479.432,337.397,472.6,352.668,461.456,363.844z"/>
    <path d="M94.01,226.338C42.074,226.353,0.016,268.435,0,320.363c0.016,51.936,42.074,94.018,94.01,94.033c51.936-0.015,94.01-42.097,94.026-94.033C188.02,268.435,145.946,226.353,94.01,226.338z M137.491,363.844c-11.176,11.144-26.447,18.007-43.481,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.16-11.176-18.008-26.447-18.008-43.481c0-17.026,6.848-32.29,18.008-43.465C61.72,265.745,76.976,258.89,94.01,258.89c17.034,0,32.306,6.855,43.481,18.008c11.144,11.175,17.992,26.439,18.008,43.465C155.483,337.397,148.636,352.668,137.491,363.844z"/>
    <path d="M94.01,293.167c-15.024,0-27.204,12.172-27.204,27.196c0,15.032,12.18,27.22,27.204,27.22c15.025,0,27.22-12.188,27.22-27.22C121.23,305.339,109.035,293.167,94.01,293.167z"/>
    <path d="M439.074,207.55v-65.855c-27.854,0-45.583,18.997-45.583,18.997v27.854C393.491,188.546,411.22,207.55,439.074,207.55z"/>
    <rect x="450.868" y="141.68" class="st0" width="13.525" height="65.847"/>
    <path d="M70.5,214.119H220.17v-42.762h-45.52c-12.212,0-24.345-1.932-35.954-5.742l-16.261-5.34c-11.592-3.81-23.742-5.758-35.953-5.758H70.5c-8.47,0-15.348,6.886-15.348,15.372v28.858C55.151,207.233,62.029,214.119,70.5,214.119z"/>
    <path d="M343.302,232.111v-1.352H167.03c26.029,21.161,42.708,53.435,42.708,89.636c0,3.246,1.112,9.761,10.433,9.761h69.928c8.888,0,12.118-6.515,12.118-9.761C302.217,284.998,318.199,253.272,343.302,232.111z"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z"/>
  </svg>
);

function ReportTable({ title, data, type, icon: Icon, emptyMessage }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} subtitle={emptyMessage || 'No data found'} />
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Icon className="h-12 w-12 mb-3 opacity-50" />
            <p>{emptyMessage || 'No data found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={`${data.length} record${data.length !== 1 ? 's' : ''}`}
      />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Reg. No.</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Make/Model</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Installment</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Due Date</th>
                {type === 'paid' && <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Paid Date</th>}
                {type === 'due' && <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Pending Status</th>}
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={`${item.loanId}-${item.sNo}-${idx}`}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{item.customerName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                      {item.address || 'No address'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                      item.vehicleType === 'Bike'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : item.vehicleType === 'Car'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                    )}>
                      {item.vehicleType === 'Bike' ? <BikeIcon /> : item.vehicleType === 'Car' ? <CarIcon /> : <img src={autoIcon} alt="Auto" className="h-4 w-4" />}
                      {item.vehicleType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                    {item.regNo || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {item.cellNumbers?.join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.make} {item.model}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                    #{item.sNo}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {item.dueDate ? (() => { const d = new Date(item.dueDate); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); })() : '-'}
                  </td>
                  {type === 'paid' && (
                    <td className="py-3 px-4 text-green-600 dark:text-green-400 font-medium">
                      {item.dateReceived ? (() => { const d = new Date(item.dateReceived); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); })() : '-'}
                    </td>
                  )}
                  {type === 'due' && (
                    <td className="py-3 px-4 text-center">
                      <Badge variant={item.daysOverdue > 0 ? 'error' : 'warning'}>
                        {item.daysOverdue > 0 ? `Overdue by ${item.daysOverdue} day${item.daysOverdue !== 1 ? 's' : ''}` : 'Due today'}
                      </Badge>
                    </td>
                  )}
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(type === 'paid' ? item.amountReceived : item.dueAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState('single');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({ start: new Date(), end: null });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const calendarRef = useRef(null);

  const formatDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadTodayReport = async () => {
      setLoading(true);
      try {
        const today = formatDateString(new Date());
        const data = await Loans.report(today, today);
        if (data && (data.paid || data.due)) {
          setReportData(data);
        } else {
          setReportData({ paid: { count: 0, total: 0, data: [] }, due: { count: 0, total: 0, data: [] } });
        }
      } catch (err) {
        console.error(err);
        setReportData({ paid: { count: 0, total: 0, data: [] }, due: { count: 0, total: 0, data: [] } });
      } finally {
        setLoading(false);
      }
    };
    loadTodayReport();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let startDateStr, endDateStr;
      if (mode === 'single') {
        startDateStr = formatDateString(selectedDate);
        endDateStr = formatDateString(selectedDate);
      } else {
        startDateStr = formatDateString(selectedRange.start);
        endDateStr = selectedRange.end ? formatDateString(selectedRange.end) : formatDateString(selectedRange.start);
      }

      console.log('Generating report for range:', startDateStr, 'to', endDateStr);
      const data = await Loans.report(startDateStr, endDateStr);
      console.log('Report data received:', data);
      if (data && (data.paid || data.due)) {
        setReportData(data);
        const dueCount = data.due?.count || 0;
        const paidCount = data.paid?.count || 0;
        showToast(`Report loaded: ${dueCount} due, ${paidCount} paid`, 'success');
      } else {
        setReportData({ paid: { count: 0, total: 0, data: [] }, due: { count: 0, total: 0, data: [] } });
        showToast('No data returned from server', 'warning');
      }
    } catch (err) {
      console.error('Generate report error:', err);
      setReportData({ paid: { count: 0, total: 0, data: [] }, due: { count: 0, total: 0, data: [] } });
      showToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getReportTitle = (type) => {
    const dateRange = mode === 'single'
      ? formatDisplayDate(selectedDate)
      : `${formatDisplayDate(selectedRange.start)} - ${selectedRange.end ? formatDisplayDate(selectedRange.end) : 'N/A'}`;
    const titles = {
      all: `Complete Payment Report - ${dateRange}`,
      due: `Pending Dues Report - ${dateRange}`,
      paid: `Payments Received Report - ${dateRange}`,
    };
    return titles[type] || titles.all;
  };

  const generateHtmlContent = (type) => {
    const dateRange = mode === 'single'
      ? formatDisplayDate(selectedDate)
      : `${formatDisplayDate(selectedRange.start)} - ${selectedRange.end ? formatDisplayDate(selectedRange.end) : 'N/A'}`;

    const showDue = type === 'all' || type === 'due';
    const showPaid = type === 'all' || type === 'paid';

    const dueSection = showDue ? `
        <h2 class="due-section">Pending Dues</h2>
        ${reportData.due?.data?.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Reg. No.</th>
              <th>Phone</th>
              <th>Make/Model</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Pending Status</th>
              <th>Amount Due</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.due.data.map(item => `
              <tr>
                <td>${item.customerName}</td>
                <td>${item.vehicleType}</td>
                <td>${item.regNo || '-'}</td>
                <td>${item.cellNumbers?.join(', ') || '-'}</td>
                <td>${item.make} ${item.model}</td>
                <td>#${item.sNo}</td>
                <td>${formatDisplayDate(item.dueDate)}</td>
                <td>${item.daysOverdue > 0 ? 'Overdue by ' + item.daysOverdue + ' day' + (item.daysOverdue !== 1 ? 's' : '') : 'Due today'}</td>
                <td>₹${(item.dueAmount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>No pending dues for this period.</p>'}
    ` : '';

    const paidSection = showPaid ? `
        <h2 class="paid-section">Payments Received</h2>
        ${reportData.paid?.data?.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Reg. No.</th>
              <th>Phone</th>
              <th>Make/Model</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.paid.data.map(item => `
              <tr>
                <td>${item.customerName}</td>
                <td>${item.vehicleType}</td>
                <td>${item.regNo || '-'}</td>
                <td>${item.cellNumbers?.join(', ') || '-'}</td>
                <td>${item.make} ${item.model}</td>
                <td>#${item.sNo}</td>
                <td>${formatDisplayDate(item.dueDate)}</td>
                <td>${formatDisplayDate(item.dateReceived)}</td>
                <td>₹${(item.amountReceived || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>No payments received for this period.</p>'}
    ` : '';

    const summarySection = type === 'all' ? `
        <div class="summary">
          <div class="summary-card due-card">
            <div class="due-section">Due (${mode === 'single' ? 'Today' : 'In Range'})</div>
            <div class="summary-number">${reportData.due?.count || 0}</div>
            <div>Total: ₹${(reportData.due?.total || 0).toLocaleString()}</div>
          </div>
          <div class="summary-card paid-card">
            <div class="paid-section">Paid (${mode === 'single' ? 'Today' : 'In Range'})</div>
            <div class="summary-number">${reportData.paid?.count || 0}</div>
            <div>Total: ₹${(reportData.paid?.total || 0).toLocaleString()}</div>
          </div>
        </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${getReportTitle(type)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .paid-section { color: #2e7d32; }
          .due-section { color: #c62828; }
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
        <h1>${getReportTitle(type)}</h1>
        ${summarySection}
        ${dueSection}
        ${paidSection}
        <div class="footer">
          Generated on ${new Date().toLocaleString()} | RAM Finance
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
  };

  const downloadReport = (type = 'all') => {
    if (!reportData) {
      showToast('Please generate a report first', 'error');
      return;
    }
    try {
      const htmlContent = generateHtmlContent(type);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Please allow popups to download the report', 'error');
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to generate report. Please try again.', 'error');
    }
  };

  const downloadPendingDues = () => downloadReport('due');
  const downloadPaymentsReceived = () => downloadReport('paid');
  const downloadAllReport = () => downloadReport('all');

  const displayDate = useMemo(() => {
    if (mode === 'single') {
      if (!selectedDate || isNaN(selectedDate.getTime())) return 'N/A';
      return selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } else {
      const start = selectedRange.start ? (isNaN(selectedRange.start.getTime()) ? 'N/A' : selectedRange.start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })) : 'N/A';
      const end = selectedRange.end ? (isNaN(selectedRange.end.getTime()) ? 'N/A' : selectedRange.end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })) : 'Select end date';
      return `${start} - ${end}`;
    }
  }, [mode, selectedDate, selectedRange]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <NavLink to="/" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
          <ArrowLeftIcon className="h-5 w-5" />
        </NavLink>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and download payment reports</p>
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

              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
                >
                  <span className="text-gray-700 dark:text-gray-200">{displayDate}</span>
                </button>

                {showCalendar && (
                  <div className="absolute left-0 z-50 top-full mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
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
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Due ({mode === 'single' ? 'Today' : 'In Range'})</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{reportData.due?.count || 0}</p>
                    <p className="text-sm text-orange-500 mt-1">Total: {formatCurrency(reportData.due?.total || 0)}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Paid ({mode === 'single' ? 'Today' : 'In Range'})</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{reportData.paid?.count || 0}</p>
                    <p className="text-sm text-green-500 mt-1">Total: {formatCurrency(reportData.paid?.total || 0)}</p>
                  </div>
                </div>

                {reportData && (
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Download:</span>
                    <Button onClick={downloadPendingDues} variant="outline" size="sm" className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Pending Dues
                    </Button>
                    <Button onClick={downloadPaymentsReceived} variant="outline" size="sm" className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Payments Received
                    </Button>
                    <Button onClick={downloadAllReport} size="sm" className="flex items-center gap-1">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Complete Report
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'due', label: 'Pending Dues', color: 'orange' },
                    { key: 'paid', label: 'Payments Received', color: 'green' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.key
                          ? tab.key === 'due'
                            ? 'border-orange-500 text-orange-600'
                            : tab.key === 'paid'
                              ? 'border-green-500 text-green-600'
                              : 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      )}
                    >
                      {tab.label}
                      {tab.key === 'due' && reportData.due?.count > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          {reportData.due.count}
                        </span>
                      )}
                      {tab.key === 'paid' && reportData.paid?.count > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          {reportData.paid.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  {(activeTab === 'all' || activeTab === 'due') && (
                    <ReportTable
                      title="Pending Dues"
                      data={reportData.due?.data || []}
                      type="due"
                      icon={DocumentTextIcon}
                      emptyMessage="No pending dues in this period"
                    />
                  )}
                  {(activeTab === 'all' || activeTab === 'paid') && (
                    <ReportTable
                      title="Payments Received"
                      data={reportData.paid?.data || []}
                      type="paid"
                      icon={DocumentTextIcon}
                      emptyMessage="No payments received in this period"
                    />
                  )}
                </div>
              </div>
            )}

            {reportData && reportData.paid?.data?.length === 0 && reportData.due?.data?.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No payment data found for this period.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try selecting a different date or date range.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}