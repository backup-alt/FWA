import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DueRow, InstallmentStatus, PaymentRow, ReportParams, VehicleType } from '../../core/models/loan.model';
import { LayoutService } from '../../core/services/layout.service';
import { LoanService } from '../../core/services/loan.service';

@Component({ selector: 'app-reports', templateUrl: './reports.page.html', styleUrls: ['./reports.page.scss'], standalone: false })
export class ReportsPage implements OnInit {
  activeTab: 'paid' | 'due' = 'due';
  showFilters = false;
  dateMode: 'single' | 'range' = 'single';
  selectedDate = this.inputDate(new Date());
  fromDate = this.selectedDate;
  toDate = this.selectedDate;
  status: InstallmentStatus | '' = '';
  vehicleType: VehicleType | '' = '';
  customerSearch = '';
  regNo = '';
  fileId = '';
  paidRows: PaymentRow[] = [];
  dueRows: DueRow[] = [];
  paidTotal = 0;
  dueTotal = 0;
  paidCount = 0;
  dueCount = 0;
  page = 1;
  hasMorePaid = false;
  hasMoreDue = false;
  isLoadingMore = false;
  isLoading = true;
  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(private loanService: LoanService, private layoutService: LayoutService, private router: Router, private toastCtrl: ToastController) {}

  ngOnInit(): void { this.layoutService.setActiveTab('reports'); void this.loadReport(); }

  setDateMode(mode: 'single' | 'range'): void {
    this.dateMode = mode;
    if (mode === 'range') { this.fromDate = this.selectedDate; this.toDate = this.selectedDate; }
    void this.loadReport();
  }

  async loadReport(event?: any, append = false): Promise<void> {
    if (!append) { this.page = 1; this.isLoading = true; }
    try {
      const response = await firstValueFrom(this.loanService.getReport(this.params()));
      this.paidRows = append ? [...this.paidRows, ...response.paid.data] : response.paid.data;
      this.dueRows = append ? [...this.dueRows, ...response.due.data] : response.due.data;
      this.paidTotal = response.paid.total;
      this.dueTotal = response.due.total;
      this.paidCount = response.paid.count;
      this.dueCount = response.due.count;
      this.hasMorePaid = response.paid.hasMore;
      this.hasMoreDue = response.due.hasMore;
    } catch (error) {
      console.error('Failed to load report', error);
      await this.showError('Unable to load the report. Check the filters and connection.');
    } finally {
      if (!append) this.isLoading = false;
      event?.target?.complete();
    }
  }

  scheduleFilter(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.loadReport(), 350);
  }

  clearFilters(): void {
    this.dateMode = 'single';
    this.selectedDate = this.inputDate(new Date());
    this.fromDate = this.selectedDate;
    this.toDate = this.selectedDate;
    this.status = '';
    this.vehicleType = '';
    this.customerSearch = '';
    this.regNo = '';
    this.fileId = '';
    void this.loadReport();
  }

  setTab(tab: 'paid' | 'due'): void { this.activeTab = tab; }

  async loadMore(event: any): Promise<void> {
    const hasMore = this.activeTab === 'paid' ? this.hasMorePaid : this.hasMoreDue;
    if (!hasMore || this.isLoadingMore) { event.target.complete(); return; }
    this.isLoadingMore = true;
    this.page += 1;
    await this.loadReport(undefined, true);
    this.isLoadingMore = false;
    event.target.complete();
  }

  openDownloads(): void {
    void this.router.navigate(['/reports/download'], { queryParams: {
      dateMode: this.dateMode,
      selectedDate: this.selectedDate,
      fromDate: this.fromDate,
      toDate: this.toDate,
      status: this.status || null,
      vehicleType: this.vehicleType || null,
      customerSearch: this.customerSearch.trim() || null,
      regNo: this.regNo.trim() || null,
      fileId: this.fileId.trim() || null
    }});
  }

  openLoan(id: string): void { void this.router.navigate(['/loans', id]); }
  formatCurrency(value: number): string { return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`; }
  formatDate(value: string): string { return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
  get periodLabel(): string { return this.dateMode === 'single' && this.selectedDate === this.inputDate(new Date()) ? 'Today' : this.dateMode === 'single' ? 'Selected Day' : 'Date Range'; }
  get reportHeading(): string { return this.periodLabel === 'Today' ? "Today's report" : 'Payment reports'; }
  get reportKicker(): string { return this.periodLabel === 'Today' ? "TODAY'S COLLECTIONS" : 'REPORT PERIOD'; }
  get reportDescription(): string {
    if (this.periodLabel === 'Today') return `Due and received payments for today · ${this.formatDate(this.selectedDate)}`;
    if (this.dateMode === 'single') return `Due and received payments for ${this.formatDate(this.selectedDate)}`;
    return `Due and received payments from ${this.formatDate(this.fromDate)} to ${this.formatDate(this.toDate)}`;
  }

  private params(): ReportParams {
    const startDate = this.dateMode === 'single' ? this.selectedDate : this.fromDate;
    const endDate = this.dateMode === 'single' ? this.selectedDate : this.toDate;
    return {
      startDate, endDate, tab: 'all', status: this.status || undefined, vehicleType: this.vehicleType || undefined,
      customerSearch: this.customerSearch.trim() || undefined, regNo: this.regNo.trim() || undefined,
      fileId: this.fileId.trim() || undefined, page: this.page, pageSize: 50
    };
  }

  private inputDate(date: Date): string { return date.toISOString().slice(0, 10); }
  private async showError(message: string): Promise<void> { const toast = await this.toastCtrl.create({ message, duration: 3500, color: 'danger' }); await toast.present(); }
}
