import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeftIcon, ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon, ChevronUpDownIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { formatCurrency, Loans } from '@/api';
import { exportPendingDuesExcel, exportPaymentsReceivedExcel, exportCompleteReportExcel } from '@/utils/excelExport';
import { clsx } from 'clsx';
import { useToast } from '@/context/ToastContext';

const REPORT_PAGE_SIZE = 25;
const autoIcon = '/FWA/icons8-auto-rickshaw-50.png';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
];
const VEHICLE_OPTIONS = [
  { value: '', label: 'All Vehicles' },
  { value: 'Bike', label: 'Bike' },
  { value: 'Car', label: 'Car' },
  { value: 'Auto', label: 'Auto' },
];

const BikeIcon = () => (
  <svg viewBox="0 0 512 512" className="h-4 w-4" fill="currentColor">
    <path d="M417.975,226.338c-5.966,0-11.764,0.618-17.404,1.684l-33.048-100.841c-5.781-17.644-22.258-29.577-40.822-29.577h-45.506v24.414h45.506c8.038-0.008,15.147,5.155,17.636,12.768l6.028,18.433h-60.684c-31.084,0-15.542,15.542v45.358h135.064l7.064,21.54c-31.579,15.163-53.42,47.345-53.435,84.704c0.016,51.936,42.09,94.018,94.026,94.033c51.92-0.015,94.01-42.097,94.025-94.033C511.985,268.435,469.895,226.353,417.975,226.338z M461.456,363.844c-11.175,11.144-26.462,18.007-43.48,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.144-11.176-18.008-26.447-18.008-43.481c0-17.026,6.863-32.29,18.008-43.465c3.88-3.88,8.409-7.01,13.185-9.754l11.114,33.928c-4.962,4.931-8.037,11.748-8.037,19.29c0,15.032,12.18,27.22,27.204,27.22c15.024,0,27.204-12.188,27.204-27.22c0-13.633-10.062-24.809-23.14-26.787l-11.128-33.974c2.35-0.278,4.637-0.711,7.064-0.711c17.018,0,32.305,6.855,43.48,18.008c11.144,11.175,17.977,26.439,18.008,43.465C479.432,337.397,472.6,352.668,461.456,363.844z"/>
    <path d="M94.01,226.338C42.074,226.353,0.016,268.435,0,320.363c0.016,51.936,42.074,94.018,94.01,94.033c51.936-0.015,94.01-42.097,94.026-94.033C188.02,268.435,145.946,226.353,94.01,226.338z M137.491,363.844c-11.176,11.144-26.447,18.007-43.481,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.16-11.176-18.008-26.447-18.008-43.481c0-17.026,6.848-32.29,18.008-43.465C61.72,265.745,76.976,258.89,94.01,258.89c17.034,0,32.306,6.855,43.481,18.008c11.144,11.175,17.992,26.439,18.008,43.465C155.483,337.397,148.636,352.668,137.491,363.844z"/>
    <path d="M94.01,293.167c-15.024,0-27.204,12.172-27.204,27.196c0,15.032,12.18,27.22,27.204,27.22c15.025,0,27.22-12.188,27.22-27.22C121.23,305.339,109.035,293.167,94.01,293.167z"/>
    <path d="M439.074,207.55v-65.855c-27.854,0-45.583,18.997-45.583,18.997v27.854C393.491,188.546,411.22,207.55,439.074,207.55z"/>
    <rect x="450.868" class="st0" width="13.525" height="65.847"/>
    <path d="M70.5,214.119H220.17v-42.762h-45.52c-12.212,0-24.345-1.932-35.954-5.742l-16.261-5.34c-11.592-3.81-23.742-5.758-35.953-5.758H70.5c-8.47,0-15.348,6.886-15.348,15.372v28.858C55.151,207.233,62.029,214.119,70.5,214.119z"/>
    <path d="M343.302,232.111v-1.352H167.03c26.029,21.161,42.708,53.435,42.708,89.636c0,3.246,1.112,9.761,10.433,9.761h69.928c8.888,0,12.118-6.515,12.118-9.761C302.217,284.998,318.199,253.272,343.302,232.111z"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 10 11C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z"/>
  </svg>
);

function ReportTable({
  title,
  data,
  type,
  icon: Icon,
  emptyMessage,
  totalCount,
  page,
  pageSize,
  onPrevPage,
  onNextPage,
  isFetching,
  hasPrevPage,
  hasNextPage,
}) {
  const total = totalCount ?? 0;
  const ps = pageSize || REPORT_PAGE_SIZE;
  const currentPage = page || 1;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / ps)) : 1;
  const hasPager = total > ps;
  const startIdx = total > 0 ? (currentPage - 1) * ps + 1 : 0;
  const endIdx = total > 0 ? Math.min(startIdx + data.length - 1, total) : 0;
  const rangeLabel = total > 0 ? `${startIdx}–${endIdx} of ${total}` : `0 of 0`;

  const pagination = hasPager ? (
    <div className="inline-flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={onPrevPage}
        disabled={!hasPrevPage || isFetching}
        className={clsx(
          'inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors',
          'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
        )}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span className="px-2 font-medium text-gray-600 dark:text-gray-300 tabular-nums">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNextPage}
        disabled={!hasNextPage || isFetching}
        className={clsx(
          'inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors',
          'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
        )}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
      {isFetching && (
        <span className="ml-1 inline-block h-3 w-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-hidden="true" />
      )}
    </div>
  ) : null;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} subtitle={emptyMessage || 'No data found'} action={pagination} />
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
        subtitle={`Showing ${rangeLabel} record${total === 1 ? '' : 's'}`}
        action={pagination}
      />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">File ID</th>
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
                  <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                    {item.customerFileId || '-'}
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [regNoSearch, setRegNoSearch] = useState('');
  const [fileIdSearch, setFileIdSearch] = useState('');
  const calendarRef = useRef(null);

  const formatDateString = useCallback((date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [activeRange, setActiveRange] = useState(() => {
    const today = new Date();
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return { startDate: t, endDate: t, hasGenerated: true };
  });
  const [showFilters, setShowFilters] = useState(false);
  const [paidPage, setPaidPage] = useState(1);
  const [duePage, setDuePage] = useState(1);

  const generateReport = () => {
    let startDateStr, endDateStr;
    if (mode === 'single') {
      startDateStr = formatDateString(selectedDate);
      endDateStr = formatDateString(selectedDate);
    } else {
      startDateStr = formatDateString(selectedRange.start);
      endDateStr = selectedRange.end ? formatDateString(selectedRange.end) : formatDateString(selectedRange.start);
    }
    setActiveRange({ startDate: startDateStr, endDate: endDateStr, hasGenerated: true });
    setPaidPage(1);
    setDuePage(1);
    showToast(`Loaded report for ${startDateStr}${startDateStr !== endDateStr ? ` – ${endDateStr}` : ''}`, 'success');
  };

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

  // Build query keys (separately for paid & due, both with tab so pagination is per-tab)
  const baseFilters = useMemo(() => ({
    startDate: activeRange.startDate,
    endDate: activeRange.endDate,
    vehicleType: vehicleFilter || undefined,
    status: statusFilter || undefined,
    customerSearch: customerSearch || undefined,
    regNo: regNoSearch || undefined,
    fileId: fileIdSearch || undefined,
  }), [activeRange, vehicleFilter, statusFilter, customerSearch, regNoSearch, fileIdSearch]);

  // Reset page to 1 whenever filters or date range change
  useEffect(() => {
    setPaidPage(1);
    setDuePage(1);
  }, [baseFilters]);

  const paidQuery = useQuery({
    queryKey: ['report', 'paid', baseFilters, paidPage],
    enabled: activeRange.hasGenerated,
    queryFn: () =>
      Loans.report(activeRange.startDate, activeRange.endDate, {
        tab: 'paid',
        page: paidPage,
        pageSize: REPORT_PAGE_SIZE,
        vehicleType: baseFilters.vehicleType,
        status: baseFilters.status,
        customerSearch: baseFilters.customerSearch,
        regNo: baseFilters.regNo,
        fileId: baseFilters.fileId,
      }),
    placeholderData: (prev) => prev,
  });

  const dueQuery = useQuery({
    queryKey: ['report', 'due', baseFilters, duePage],
    enabled: activeRange.hasGenerated,
    queryFn: () =>
      Loans.report(activeRange.startDate, activeRange.endDate, {
        tab: 'due',
        page: duePage,
        pageSize: REPORT_PAGE_SIZE,
        vehicleType: baseFilters.vehicleType,
        status: baseFilters.status,
        customerSearch: baseFilters.customerSearch,
        regNo: baseFilters.regNo,
        fileId: baseFilters.fileId,
      }),
    placeholderData: (prev) => prev,
  });

  const paidSection = paidQuery.data?.paid || { count: 0, total: 0, data: [], page: paidPage, pageSize: REPORT_PAGE_SIZE, hasMore: false };
  const dueSection = dueQuery.data?.due || { count: 0, total: 0, data: [], page: duePage, pageSize: REPORT_PAGE_SIZE, hasMore: false };

  const paidData = paidSection.data || [];
  const dueData = dueSection.data || [];

  const loading = paidQuery.isLoading || dueQuery.isLoading;
  const reportData = activeRange.hasGenerated
    ? { paid: paidSection, due: dueSection }
    : null;

  const fetchFullSection = async (tab) => {
    return Loans.report(activeRange.startDate, activeRange.endDate, {
      tab,
      pageSize: 10000,
      page: 1,
      download: true,
      vehicleType: baseFilters.vehicleType,
      status: baseFilters.status,
      customerSearch: baseFilters.customerSearch,
      regNo: baseFilters.regNo,
      fileId: baseFilters.fileId,
    });
  };

  const downloadPendingDues = async () => {
    try {
      const data = await fetchFullSection('due');
      const dateRange = getDateRangeLabel();
      exportPendingDuesExcel(data, {
        title: `Pending Dues Report - ${dateRange}`,
        fileName: `Pending_Dues_Report_${getDateRangeFileName()}`,
      });
      showToast('Excel downloaded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to download Excel. Please try again.', 'error');
    }
  };

  const downloadPaymentsReceived = async () => {
    try {
      const data = await fetchFullSection('paid');
      const dateRange = getDateRangeLabel();
      exportPaymentsReceivedExcel(data, {
        title: `Payments Received Report - ${dateRange}`,
        fileName: `Payments_Received_Report_${getDateRangeFileName()}`,
      });
      showToast('Excel downloaded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to download Excel. Please try again.', 'error');
    }
  };

  const downloadAllReport = async () => {
    try {
      const [paidRes, dueRes] = await Promise.all([fetchFullSection('paid'), fetchFullSection('due')]);
      const combined = {
        paid: { count: paidRes.paid?.count || 0, total: paidRes.paid?.total || 0, data: paidRes.paid?.data || [] },
        due: { count: dueRes.due?.count || 0, total: dueRes.due?.total || 0, data: dueRes.due?.data || [] },
      };
      const dateRange = getDateRangeLabel();
      exportCompleteReportExcel(combined, {
        title: `Complete Payment Report - ${dateRange}`,
        fileName: `Complete_Payment_Report_${getDateRangeFileName()}`,
      });
      showToast('Excel downloaded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to download Excel. Please try again.', 'error');
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

  // Print/PDF flow uses the same approach: fetch full sections
  const downloadReport = async (type = 'all') => {
    if (!activeRange.hasGenerated) {
      showToast('Please generate a report first', 'error');
      return;
    }
    try {
      const sections = type === 'paid' ? ['paid'] : type === 'due' ? ['due'] : ['paid', 'due'];
      const fetched = {};
      for (const t of sections) fetched[t] = await fetchFullSection(t);
      const dataForHtml = {
        paid: {
          count: fetched.paid?.paid?.count || 0,
          total: fetched.paid?.paid?.total || 0,
          data: fetched.paid?.paid?.data || [],
        },
        due: {
          count: fetched.due?.due?.count || 0,
          total: fetched.due?.due?.total || 0,
          data: fetched.due?.due?.data || [],
        },
      };
      const htmlContent = generateHtmlContent(dataForHtml, type);
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

  const generateHtmlContent = (data, type) => {
    const dateRange = mode === 'single'
      ? formatDisplayDate(selectedDate)
      : `${formatDisplayDate(selectedRange.start)} - ${selectedRange.end ? formatDisplayDate(selectedRange.end) : 'N/A'}`;

    const showDue = type === 'all' || type === 'due';
    const showPaid = type === 'all' || type === 'paid';

    const dueSection = showDue ? `
        <h2 class="due-section">Pending Dues</h2>
        ${data.due?.data?.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>File ID</th>
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
            ${data.due.data.map(item => `
              <tr>
                <td>${item.customerName}</td>
                <td>${item.customerFileId || '-'}</td>
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
        ${data.paid?.data?.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>File ID</th>
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
            ${data.paid.data.map(item => `
              <tr>
                <td>${item.customerName}</td>
                <td>${item.customerFileId || '-'}</td>
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

    const summarySection = `
      <div class="summary">
        <div class="summary-card due">
          <div>Pending Dues</div>
          <div class="summary-number">${data.due?.count || 0}</div>
          <div>Total: ₹${(data.due?.total || 0).toLocaleString()}</div>
        </div>
        <div class="summary-card paid">
          <div>Payments Received</div>
          <div class="summary-number">${data.paid?.count || 0}</div>
          <div>Total: ₹${(data.paid?.total || 0).toLocaleString()}</div>
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${getReportTitle(type)}</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
          h1 { font-size: 22px; margin: 0 0 16px; }
          h2 { font-size: 16px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; }
          h2.due-section { color: #c2410c; border-color: #fdba74; }
          h2.paid-section { color: #15803d; border-color: #86efac; }
          .summary { display: flex; gap: 16px; margin: 16px 0 24px; }
          .summary-card { flex: 1; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .summary-card.due { background: #fff7ed; border-color: #fdba74; }
          .summary-card.paid { background: #f0fdf4; border-color: #86efac; }
          .summary-number { font-size: 32px; font-weight: 700; margin: 8px 0 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; color: #374151; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
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

  const getDateRangeLabel = () => {
    return mode === 'single'
      ? formatDisplayDate(selectedDate)
      : `${formatDisplayDate(selectedRange.start)} - ${selectedRange.end ? formatDisplayDate(selectedRange.end) : 'N/A'}`;
  };

  const getDateRangeFileName = () => {
    const safe = (d) => {
      if (!d) return 'NA';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return 'NA';
      const day = String(dt.getDate()).padStart(2, '0');
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const year = dt.getFullYear();
      return `${day}-${month}-${year}`;
    };
    if (mode === 'single') {
      return safe(selectedDate);
    }
    return `${safe(selectedRange.start)}_to_${safe(selectedRange.end || selectedRange.start)}`;
  };

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

              <Button
                variant="outline"
                onClick={() => setShowFilters(s => !s)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                  <Listbox value={statusFilter} onChange={setStatusFilter}>
                    <div className="relative">
                      <Listbox.Button className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left">
                        {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 inline float-right mt-1" />
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-75" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-[9999] mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 text-sm">
                          {STATUS_OPTIONS.map(opt => (
                            <Listbox.Option key={opt.value} value={opt.value} as={Fragment}>
                              {({ active, selected }) => (
                                <li className={clsx('relative cursor-pointer select-none py-2 pl-8 pr-4 mx-1 rounded-lg transition-colors', active ? 'bg-primary-50 dark:bg-primary-900/30' : 'text-gray-900 dark:text-gray-100')}>
                                  {selected && <CheckIcon className="h-4 w-4 absolute left-2 top-2.5 text-primary-600" />}
                                  <span>{opt.label}</span>
                                </li>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vehicle</label>
                  <Listbox value={vehicleFilter} onChange={setVehicleFilter}>
                    <div className="relative">
                      <Listbox.Button className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left">
                        {VEHICLE_OPTIONS.find(s => s.value === vehicleFilter)?.label}
                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 inline float-right mt-1" />
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-75" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-[9999] mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 text-sm">
                          {VEHICLE_OPTIONS.map(opt => (
                            <Listbox.Option key={opt.value} value={opt.value} as={Fragment}>
                              {({ active, selected }) => (
                                <li className={clsx('relative cursor-pointer select-none py-2 pl-8 pr-4 mx-1 rounded-lg transition-colors', active ? 'bg-primary-50 dark:bg-primary-900/30' : 'text-gray-900 dark:text-gray-100')}>
                                  {selected && <CheckIcon className="h-4 w-4 absolute left-2 top-2.5 text-primary-600" />}
                                  <span>{opt.label}</span>
                                </li>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reg. Number</label>
                  <input
                    type="text"
                    value={regNoSearch}
                    onChange={e => setRegNoSearch(e.target.value)}
                    placeholder="Search by reg no..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">File ID</label>
                  <input
                    type="text"
                    value={fileIdSearch}
                    onChange={e => setFileIdSearch(e.target.value)}
                    placeholder="Search by file ID..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            )}

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
                  <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Print / PDF:</span>
                      <Button onClick={() => downloadReport('due')} variant="outline" size="sm" className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Pending Dues
                      </Button>
                      <Button onClick={() => downloadReport('paid')} variant="outline" size="sm" className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Payments Received
                      </Button>
                      <Button onClick={() => downloadReport('all')} size="sm" className="flex items-center gap-1">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Complete Report
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Excel:</span>
                      <Button onClick={downloadPendingDues} variant="outline" size="sm" className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50">
                        <TableCellsIcon className="h-4 w-4" />
                        Pending Dues
                      </Button>
                      <Button onClick={downloadPaymentsReceived} variant="outline" size="sm" className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50">
                        <TableCellsIcon className="h-4 w-4" />
                        Payments Received
                      </Button>
                      <Button onClick={downloadAllReport} size="sm" className="flex items-center gap-1">
                        <TableCellsIcon className="h-4 w-4" />
                        Complete Report
                      </Button>
                    </div>
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
                      data={dueData}
                      type="due"
                      icon={DocumentTextIcon}
                      emptyMessage="No pending dues match the current filters"
                      totalCount={dueSection.count}
                      page={dueSection.page}
                      pageSize={dueSection.pageSize}
                      onPrevPage={() => setDuePage((p) => Math.max(1, p - 1))}
                      onNextPage={() => setDuePage((p) => p + 1)}
                      isFetching={dueQuery.isFetching}
                      hasPrevPage={duePage > 1}
                      hasNextPage={!!dueSection.hasMore}
                    />
                  )}
                  {(activeTab === 'all' || activeTab === 'paid') && (
                    <ReportTable
                      title="Payments Received"
                      data={paidData}
                      type="paid"
                      icon={DocumentTextIcon}
                      emptyMessage="No payments received match the current filters"
                      totalCount={paidSection.count}
                      page={paidSection.page}
                      pageSize={paidSection.pageSize}
                      onPrevPage={() => setPaidPage((p) => Math.max(1, p - 1))}
                      onNextPage={() => setPaidPage((p) => p + 1)}
                      isFetching={paidQuery.isFetching}
                      hasPrevPage={paidPage > 1}
                      hasNextPage={!!paidSection.hasMore}
                    />
                  )}
                </div>
              </div>
            )}

            {activeRange.hasGenerated && !loading && reportData && reportData.paid?.count === 0 && reportData.due?.count === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No payment data found for this period.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try selecting a different date, date range, or filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}