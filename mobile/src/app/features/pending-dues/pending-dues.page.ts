import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PendingDue, PendingDuesParams, PendingDuesSummary, VehicleType } from '../../core/models/loan.model';
import { LayoutService } from '../../core/services/layout.service';
import { LoanService } from '../../core/services/loan.service';

@Component({
  selector: 'app-pending-dues',
  templateUrl: './pending-dues.page.html',
  styleUrls: ['./pending-dues.page.scss'],
  standalone: false
})
export class PendingDuesPage implements OnInit {
  dues: PendingDue[] = [];
  summary: PendingDuesSummary | null = null;
  isLoading = true;
  isLoadingMore = false;
  hasMore = false;
  page = 1;
  pageSize = 25;
  vehicleType: VehicleType | '' = '';
  fileId = '';
  minOverdueDays: number | null = null;
  minAmount: number | null = null;
  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private loanService: LoanService,
    private layoutService: LayoutService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.layoutService.setActiveTab('pending-dues');
    void this.refresh();
  }

  async refresh(event?: any): Promise<void> {
    this.page = 1;
    this.dues = [];
    this.isLoading = true;
    try {
      const [response, summary] = await Promise.all([
        firstValueFrom(this.loanService.getPendingDues(this.params())),
        firstValueFrom(this.loanService.getPendingDuesSummary())
      ]);
      this.dues = response.data;
      this.hasMore = response.hasMore;
      this.summary = summary;
    } catch (error) {
      console.error('Failed to load pending dues', error);
      await this.showError('Unable to load pending dues. Check your connection.');
    } finally {
      this.isLoading = false;
      event?.target?.complete();
    }
  }

  async loadMore(event: any): Promise<void> {
    if (!this.hasMore || this.isLoadingMore) {
      event.target.complete();
      return;
    }
    this.isLoadingMore = true;
    this.page += 1;
    try {
      const response = await firstValueFrom(this.loanService.getPendingDues(this.params()));
      this.dues = [...this.dues, ...response.data];
      this.hasMore = response.hasMore;
    } catch (error) {
      this.page -= 1;
      await this.showError('Unable to load more pending dues.');
    } finally {
      this.isLoadingMore = false;
      event.target.complete();
    }
  }

  scheduleFilter(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.refresh(), 350);
  }

  clearFilters(): void {
    this.vehicleType = '';
    this.fileId = '';
    this.minOverdueDays = null;
    this.minAmount = null;
    void this.refresh();
  }

  openDue(due: PendingDue): void {
    void this.router.navigate(['/loans', due.loanId], { queryParams: { action: 'payment', installment: due.sNo } });
  }

  formatCurrency(value: number): string {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
  }

  formatDate(value: string): string {
    return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }

  private params(): PendingDuesParams {
    return {
      page: this.page,
      pageSize: this.pageSize,
      vehicleType: this.vehicleType || undefined,
      fileId: this.fileId.trim() || undefined,
      minOverdueDays: this.minOverdueDays ?? undefined,
      minAmount: this.minAmount ?? undefined
    };
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
