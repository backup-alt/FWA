import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DueRow, PaymentRow, ReportParams, VehicleType } from '../../core/models/loan.model';
import { LayoutService } from '../../core/services/layout.service';
import { LoanService } from '../../core/services/loan.service';

@Component({ selector: 'app-reports', templateUrl: './reports.page.html', styleUrls: ['./reports.page.scss'], standalone: false })
export class ReportsPage implements OnInit {
  activeTab: 'paid' | 'due' = 'paid';
  startDate = '';
  endDate = '';
  vehicleType: VehicleType | '' = '';
  customerSearch = '';
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

  constructor(private loanService: LoanService, private layoutService: LayoutService, private router: Router, private toastCtrl: ToastController) {
    const now = new Date();
    this.endDate = this.inputDate(now);
    this.startDate = this.inputDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  ngOnInit(): void { this.layoutService.setActiveTab('reports'); void this.loadReport(); }

  async loadReport(event?: any, append = false): Promise<void> {
    if (!append) this.page = 1;
    this.isLoading = true;
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
      await this.showError('Unable to load the report. Check the date range and connection.');
    } finally {
      this.isLoading = false;
      event?.target?.complete();
    }
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
  openLoan(id: string): void { void this.router.navigate(['/loans', id]); }
  formatCurrency(value: number): string { return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`; }
  formatDate(value: string): string { return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

  private params(): ReportParams {
    return { startDate: this.startDate, endDate: this.endDate, tab: 'all', vehicleType: this.vehicleType || undefined, customerSearch: this.customerSearch.trim() || undefined, page: this.page, pageSize: 50 };
  }
  private inputDate(date: Date): string { return date.toISOString().slice(0, 10); }
  private async showError(message: string): Promise<void> { const toast = await this.toastCtrl.create({ message, duration: 3500, color: 'danger' }); await toast.present(); }
}
