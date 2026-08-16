import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import * as XLSX from 'xlsx';
import { DueRow, PaymentRow, ReportResponse } from '../models/loan.model';

export type ReportExportScope = 'due' | 'paid' | 'all';
export type ReportExportFormat = 'xlsx' | 'pdf';

function displayDate(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-GB');
}

function reportRows(rows: Array<PaymentRow | DueRow>): Array<Array<string | number>> {
  return rows.map((row, index) => [
    index + 1, row.customerName || '', row.customerFileId || '', row.address || '', row.vehicleType || '', row.regNo || '',
    Array.isArray(row.cellNumbers) ? row.cellNumbers.join(', ') : '', row.make || '', row.model || '', `#${row.sNo}`,
    displayDate(row.dueDate), displayDate(row.dateReceived), row.daysOverdue ?? '',
    row.daysOverdue > 0 ? `Overdue by ${row.daysOverdue} day${row.daysOverdue === 1 ? '' : 's'}` : (row.dateReceived ? 'Paid' : 'Due'),
    Number(row.dueAmount || 0), Number(row.amountReceived || 0)
  ]);
}

export async function exportReportFile(report: ReportResponse, title: string, scope: ReportExportScope, format: ReportExportFormat): Promise<string> {
  const datePart = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const label = scope === 'due' ? 'Pending_Dues' : scope === 'paid' ? 'Payments_Received' : 'Complete_Payment_Report';
  const fileName = `${label}_${datePart}.${format}`;
  const base64 = format === 'xlsx' ? workbookBase64(report, title, scope) : await pdfBase64(report, title, scope);
  const mimeType = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
  return await saveAndOpen(fileName, base64, mimeType);
}

function workbookBase64(report: ReportResponse, title: string, scope: ReportExportScope): string {
  const rows: Array<Array<string | number>> = [[title], [], ['Summary'], ['Due Count', report.due.count, 'Paid Count', report.paid.count], ['Due Total (INR)', report.due.total, 'Paid Total (INR)', report.paid.total], []];
  const headers = ['S.No', 'Customer', 'File ID', 'Address', 'Vehicle Type', 'Reg. No.', 'Phone', 'Make', 'Model', 'Installment #', 'Due Date', 'Paid Date', 'Days Overdue', 'Status', 'Amount Due (INR)', 'Amount Received (INR)'];
  const append = (heading: string, data: Array<Array<string | number>>, totalLabel: string, total: number) => {
    rows.push([heading]);
    if (!data.length) { rows.push([`No ${heading.toLowerCase()} for this period`], []); return; }
    rows.push(headers);
    rows.push(...data);
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', totalLabel, total], []);
  };
  if (scope !== 'paid') append('PENDING DUES', reportRows(report.due.data), 'Total Due (INR)', report.due.total);
  if (scope !== 'due') append('PAYMENTS RECEIVED', reportRows(report.paid.data), 'Total Received (INR)', report.paid.total);
  rows.push([], [`Generated on ${new Date().toLocaleString()} | RAM Finance`]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 13 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 20 }, { wch: 19 }, { wch: 22 }];
  worksheet['!freeze'] = { xSplit: 0, ySplit: 8 } as any;
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64', compression: true });
}

async function pdfBase64(report: ReportResponse, title: string, scope: ReportExportScope): Promise<string> {
  (pdfMake as any).addVirtualFileSystem(pdfFonts);
  const content: Content[] = [
    { text: title, style: 'title' },
    { columns: [summaryCard('Pending Dues', report.due.count, report.due.total, '#fff7ed', '#c2410c'), summaryCard('Payments Received', report.paid.count, report.paid.total, '#f0fdf4', '#15803d')], columnGap: 10, margin: [0, 8, 0, 14] }
  ];
  if (scope !== 'paid') content.push(section('Pending Dues', report.due.data, false));
  if (scope !== 'due') content.push(section('Payments Received', report.paid.data, true));
  const definition: TDocumentDefinitions = {
    pageSize: 'A4', pageOrientation: 'portrait', pageMargins: [22, 24, 22, 28], content,
    defaultStyle: { font: 'Roboto', fontSize: 6.4, color: '#1f2937' },
    styles: { title: { fontSize: 14, bold: true, color: '#111827' }, sectionDue: { fontSize: 10, bold: true, color: '#c2410c', margin: [0, 8, 0, 5] }, sectionPaid: { fontSize: 10, bold: true, color: '#15803d', margin: [0, 8, 0, 5] } },
    footer: (currentPage, pageCount) => ({ columns: [{ text: `Generated ${new Date().toLocaleString()} | RAM Finance`, alignment: 'left' }, { text: `${currentPage}/${pageCount}`, alignment: 'right' }], margin: [22, 8, 22, 0], fontSize: 6, color: '#6b7280' })
  };
  return await (pdfMake as any).createPdf(definition).getBase64();
}

function summaryCard(label: string, count: number, total: number, fill: string, color: string): Content {
  return { table: { widths: ['*'], body: [[{ stack: [{ text: label, bold: true, color }, { text: String(count), fontSize: 18, bold: true, color, margin: [0, 4, 0, 2] }, { text: `Total: ₹${Number(total || 0).toLocaleString('en-IN')}`, color }], fillColor: fill, margin: 8 }]] }, layout: { hLineColor: () => color, vLineColor: () => color, hLineWidth: () => 0.6, vLineWidth: () => 0.6 } };
}

function section(heading: string, rows: Array<PaymentRow | DueRow>, paid: boolean): Content {
  if (!rows.length) return { stack: [{ text: heading, style: paid ? 'sectionPaid' : 'sectionDue' }, { text: `No ${heading.toLowerCase()} for this period.`, margin: [0, 0, 0, 8] }] };
  const header = ['Customer', 'File', 'Vehicle', 'Reg. No.', 'Make/Model', 'Inst.', 'Due Date', paid ? 'Paid Date' : 'Status', paid ? 'Paid' : 'Due'].map(text => ({ text, bold: true, fillColor: '#f3f4f6', color: '#374151' }));
  const body: TableCell[][] = [header, ...rows.map(item => [
    item.customerName || '', item.customerFileId || '-', item.vehicleType || '', item.regNo || '-', `${item.make || ''} ${item.model || ''}`.trim(), `#${item.sNo}`,
    displayDate(item.dueDate), paid ? displayDate(item.dateReceived) : (item.daysOverdue > 0 ? `${item.daysOverdue} days overdue` : 'Due today'),
    `₹${Number(paid ? item.amountReceived : item.dueAmount).toLocaleString('en-IN')}`
  ])];
  return { stack: [{ text: heading, style: paid ? 'sectionPaid' : 'sectionDue' }, { table: { headerRows: 1, widths: ['*', 25, 26, 42, 50, 23, 38, 52, 38], body }, layout: { fillColor: rowIndex => rowIndex > 0 && rowIndex % 2 === 0 ? '#fafafa' : null, hLineColor: () => '#e5e7eb', vLineColor: () => '#ffffff', hLineWidth: () => 0.45, vLineWidth: () => 0.2, paddingLeft: () => 2.5, paddingRight: () => 2.5, paddingTop: () => 3, paddingBottom: () => 3 } }] };
}

async function saveAndOpen(fileName: string, base64: string, mimeType: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    let directory = Directory.Documents;
    let path = `RAM Finance/Reports/${fileName}`;
    let savedInDocuments = true;
    try {
      await Filesystem.writeFile({ path, data: base64, directory, recursive: true });
    } catch {
      directory = Directory.Cache;
      path = `reports/${fileName}`;
      savedInDocuments = false;
      await Filesystem.writeFile({ path, data: base64, directory, recursive: true });
    }
    const file = await Filesystem.getUri({ path, directory });
    try { await Share.share({ title: fileName, text: 'RAM Finance report', url: file.uri, dialogTitle: 'Open or share report' }); }
    catch (error) { console.warn('Report saved but Android share sheet was dismissed or unavailable', error); }
    return savedInDocuments ? 'Saved in Documents/RAM Finance/Reports' : 'Report created. Choose an app to save or open it.';
  }
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'Report downloaded';
}
