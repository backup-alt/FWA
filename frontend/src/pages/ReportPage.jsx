import { useState, useMemo } from 'react';
import { ArrowLeftIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/api';
import { clsx } from 'clsx';

const BikeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/>
    <circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h3l3 5h-4"/>
    <path d="M8.5 17.5L5 6"/>
    <path d="M4 9h5"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5.1C2.7 10.3 2 11.1 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

export function ReportPage() {
  const [mode, setMode] = useState('single');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({ start: new Date(), end: null });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
      let startDateStr, endDateStr;
      if (mode === 'single') {
        startDateStr = formatDateString(selectedDate);
        endDateStr = formatDateString(selectedDate);
      } else {
        startDateStr = formatDateString(selectedRange.start);
        endDateStr = selectedRange.end ? formatDateString(selectedRange.end) : formatDateString(selectedRange.start);
      }

      const response = await fetch(`/api/loans/report?startDate=${startDateStr}&endDate=${endDateStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        setReportData({ loans: [], dueCount: 0, paidCount: 0, dueTotal: 0, paidTotal: 0 });
      }
    } catch (err) {
      console.error(err);
      setReportData({ loans: [], dueCount: 0, paidCount: 0, dueTotal: 0, paidTotal: 0 });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const formatDisplayDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const dateRange = mode === 'single'
      ? formatDisplayDate(selectedDate)
      : `${formatDisplayDate(selectedRange.start)} - ${selectedRange.end ? formatDisplayDate(selectedRange.end) : 'N/A'}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; font-size: 16px; }
          h3 { color: #444; margin-top: 20px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .due-section { color: #e65100; }
          .paid-section { color: #2e7d32; }
          .pending-section { color: #c62828; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { padding: 15px; border-radius: 8px; flex: 1; }
          .due-card { background-color: #fff3e0; }
          .paid-card { background-color: #e8f5e9; }
          .summary-number { font-size: 24px; font-weight: bold; }
          .loan-block { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
          .loan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .loan-info { font-size: 13px; color: #666; }
          .status-paid { color: #2e7d32; font-weight: bold; }
          .status-pending { color: #e65100; font-weight: bold; }
          .status-overdue { color: #c62828; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Payment Report</h1>
        <p><strong>Date Range:</strong> ${dateRange}</p>

        <div class="summary">
          <div class="summary-card due-card">
            <div class="due-section">Due (${mode === 'single' ? 'Today' : 'In Range'})</div>
            <div class="summary-number">${reportData.dueCount}</div>
            <div>Total: ₹${(reportData.dueTotal || 0).toLocaleString()}</div>
          </div>
          <div class="summary-card paid-card">
            <div class="paid-section">Paid (${mode === 'single' ? 'Today' : 'In Range'})</div>
            <div class="summary-number">${reportData.paidCount}</div>
            <div>Total: ₹${(reportData.paidTotal || 0).toLocaleString()}</div>
          </div>
        </div>

        <h2>Detailed Report</h2>
        ${reportData.loans.length > 0 ? reportData.loans.map(loan => `
          <div class="loan-block">
            <div class="loan-header">
              <div>
                <strong>${loan.customerName || 'Unknown'}</strong>
                <span style="margin-left: 10px;">${loan.vehicleType === 'Bike' ? '🏍️' : '🚗'} ${loan.make || ''} ${loan.model || ''}</span>
              </div>
              <div class="loan-info">
                Reg: ${loan.regNo || 'N/A'} | Loan Amt: ₹${(loan.loanAmount || 0).toLocaleString()}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Due Amount</th>
                  <th>Amount Received</th>
                  <th>Date Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${loan.installments.map(inst => `
                  <tr>
                    <td>${inst.sNo}</td>
                    <td>${formatDisplayDate(inst.dueDate)}</td>
                    <td>₹${(inst.dueAmount || 0).toLocaleString()}</td>
                    <td>₹${(inst.amountReceived || 0).toLocaleString()}</td>
                    <td>${inst.dateReceived ? formatDisplayDate(inst.dateReceived) : '-'}</td>
                    <td class="status-${inst.status?.toLowerCase() || 'pending'}">${inst.status || 'Pending'}</td>
                  </tr>
                `).join('')}
                ${loan.installments.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">No installments in range</td></tr>' : ''}
              </tbody>
            </table>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
              Outstanding: ₹${(loan.outstandingPrincipal || 0).toLocaleString()} | Total Paid: ₹${(loan.totalPaid || 0).toLocaleString()}
            </div>
          </div>
        `).join('') : '<p>No loan data found for this period.</p>'}

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

  const getInstallmentStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="success">Paid</Badge>;
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'Overdue':
        return <Badge variant="error">Overdue</Badge>;
      case 'Partial':
        return <Badge variant="info">Partial</Badge>;
      default:
        return <Badge variant="gray">{status || 'Pending'}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <NavLink to="/" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
          <ArrowLeftIcon className="h-5 w-5" />
        </NavLink>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate and download detailed payment reports</p>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Due ({mode === 'single' ? 'Today' : 'In Range'})</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{reportData.dueCount}</p>
                    <p className="text-sm text-orange-500 mt-1">Total: {formatCurrency(reportData.dueTotal || 0)}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Paid ({mode === 'single' ? 'Today' : 'In Range'})</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{reportData.paidCount}</p>
                    <p className="text-sm text-green-500 mt-1">Total: {formatCurrency(reportData.paidTotal || 0)}</p>
                  </div>
                </div>

                {reportData.loans && reportData.loans.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Detailed Breakdown ({reportData.loans.length} loan{reportData.loans.length !== 1 ? 's' : ''})
                      </h3>
                      <Button onClick={downloadReport} className="flex items-center gap-2">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Download PDF Report
                      </Button>
                    </div>

                    {reportData.loans.map(loan => (
                      <Card key={loan.loanId}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                loan.vehicleType === 'Bike' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              )}>
                                {loan.vehicleType === 'Bike' ? <BikeIcon /> : <CarIcon />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{loan.customerName || 'Unknown'}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {loan.vehicleType} • {loan.make} {loan.model} • {loan.regNo}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Amount</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(loan.loanAmount)}</p>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">#</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Due Date</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Due Amt</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Received</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Received Date</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loan.installments.length > 0 ? loan.installments.map(inst => (
                                  <tr key={inst.sNo} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{inst.sNo}</td>
                                    <td className="py-2 px-3 text-gray-900 dark:text-white">
                                      {new Date(inst.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-2 px-3 text-right text-gray-900 dark:text-white">{formatCurrency(inst.dueAmount)}</td>
                                    <td className="py-2 px-3 text-right text-gray-900 dark:text-white">{formatCurrency(inst.amountReceived || 0)}</td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                                      {inst.dateReceived ? new Date(inst.dateReceived).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      {getInstallmentStatusBadge(inst.status)}
                                    </td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan="6" className="py-4 text-center text-gray-500 dark:text-gray-400">
                                      No installments in selected date range
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex gap-6">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(loan.outstandingPrincipal || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(loan.totalPaid || 0)}</p>
                              </div>
                            </div>
                            <NavLink to={`/loan/${loan.loanId}`}>
                              <Button variant="ghost" size="sm">View Loan</Button>
                            </NavLink>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No payment data found for this period.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try selecting a different date or date range.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}