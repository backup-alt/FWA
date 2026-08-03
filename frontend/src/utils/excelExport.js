import * as XLSX from 'xlsx';

function formatCellDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 1971) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCellCurrency(amount) {
  return Number(amount || 0);
}

function buildReportRows(data) {
  if (!data || data.length === 0) return [];
  return data.map((item, idx) => ({
    'S.No': idx + 1,
    'Customer': item.customerName || '',
    'Address': item.address || '',
    'Vehicle Type': item.vehicleType || '',
    'Reg. No.': item.regNo || '',
    'Phone': Array.isArray(item.cellNumbers) ? item.cellNumbers.join(', ') : (item.cellNumbers || ''),
    'Make': item.make || '',
    'Model': item.model || '',
    'Installment #': item.sNo != null ? `#${item.sNo}` : '',
    'Due Date': formatCellDate(item.dueDate),
    'Paid Date': formatCellDate(item.dateReceived),
    'Days Overdue': item.daysOverdue != null ? item.daysOverdue : '',
    'Status': item.daysOverdue > 0
      ? `Overdue by ${item.daysOverdue} day${item.daysOverdue !== 1 ? 's' : ''}`
      : (item.dateReceived ? 'Paid' : 'Due'),
    'Amount Due (INR)': formatCellCurrency(item.dueAmount),
    'Amount Received (INR)': formatCellCurrency(item.amountReceived),
  }));
}

export function exportReportToExcel(reportData, options = {}) {
  const {
    type = 'all',
    fileName = 'Payment_Report',
    title = 'Payment Report',
  } = options;

  if (!reportData) {
    throw new Error('No report data to export');
  }

  const workbook = XLSX.utils.book_new();
  const sheetData = [];
  const merges = [];

  const dateRange = title;

  sheetData.push([dateRange]);
  sheetData.push([]);
  const titleRowCount = 2;

  const summaryStartRow = sheetData.length;
  const dueCount = reportData.due?.count || 0;
  const dueTotal = reportData.due?.total || 0;
  const paidCount = reportData.paid?.count || 0;
  const paidTotal = reportData.paid?.total || 0;

  sheetData.push(['Summary']);
  sheetData.push(['Due Count', dueCount, 'Paid Count', paidCount]);
  sheetData.push(['Due Total (INR)', dueTotal, 'Paid Total (INR)', paidTotal]);
  sheetData.push([]);
  const summaryEndRow = sheetData.length;

  const showDue = type === 'all' || type === 'due';
  const showPaid = type === 'all' || type === 'paid';

  if (showDue) {
    const dueRows = buildReportRows(reportData.due?.data || []);
    const dueHeaderRow = sheetData.length;
    let dueHeaders = [];
    sheetData.push(['PENDING DUES']);
    if (dueRows.length > 0) {
      dueHeaders = Object.keys(dueRows[0]);
      sheetData.push(dueHeaders);
      dueRows.forEach(row => {
        sheetData.push(dueHeaders.map(h => row[h]));
      });
    } else {
      sheetData.push(['No pending dues for this period']);
    }
    sheetData.push([]);
    if (dueRows.length > 0) {
      const totalsRow = sheetData.length;
      const amountColIdx = dueHeaders.indexOf('Amount Due (INR)');
      sheetData.push([
        '', '', '', '', '', '', '', '', '', '', '', '',
        'Total Due (INR)',
        dueTotal
      ]);
    }
    void dueHeaderRow;
  }

  if (showPaid) {
    const paidRows = buildReportRows(reportData.paid?.data || []);
    const paidHeaderRow = sheetData.length;
    let paidHeaders = [];
    sheetData.push(['PAYMENTS RECEIVED']);
    if (paidRows.length > 0) {
      paidHeaders = Object.keys(paidRows[0]);
      sheetData.push(paidHeaders);
      paidRows.forEach(row => {
        sheetData.push(paidHeaders.map(h => row[h]));
      });
    } else {
      sheetData.push(['No payments received for this period']);
    }
    sheetData.push([]);
    if (paidRows.length > 0) {
      sheetData.push([
        '', '', '', '', '', '', '', '', '', '', '', '',
        'Total Received (INR)',
        paidTotal
      ]);
    }
    void paidHeaderRow;
  }

  sheetData.push([]);
  sheetData.push([`Generated on ${new Date().toLocaleString()} | RAM Finance`]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 28 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ];

  try {
    const ref = worksheet['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[addr];
          if (cell && typeof cell.v === 'number') {
            cell.z = '#,##0.00';
          }
        }
      }
    }
  } catch {
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  const safeFileName = fileName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  XLSX.writeFile(workbook, `${safeFileName}.xlsx`);
}

export function exportPendingDuesExcel(reportData, options = {}) {
  const title = options.title || 'Pending Dues Report';
  return exportReportToExcel(reportData, {
    ...options,
    type: 'due',
    fileName: options.fileName || 'Pending_Dues_Report',
    title,
  });
}

export function exportPaymentsReceivedExcel(reportData, options = {}) {
  const title = options.title || 'Payments Received Report';
  return exportReportToExcel(reportData, {
    ...options,
    type: 'paid',
    fileName: options.fileName || 'Payments_Received_Report',
    title,
  });
}

export function exportCompleteReportExcel(reportData, options = {}) {
  const title = options.title || 'Complete Payment Report';
  return exportReportToExcel(reportData, {
    ...options,
    type: 'all',
    fileName: options.fileName || 'Complete_Payment_Report',
    title,
  });
}
