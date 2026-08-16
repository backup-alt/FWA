import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PendingDue, PendingDuesParams, VehicleType } from '../../core/models/loan.model';
import { LayoutService } from '../../core/services/layout.service';
import { LoanService } from '../../core/services/loan.service';

@Component({ selector: 'app-pending-dues', templateUrl: './pending-dues.page.html', styleUrls: ['./pending-dues.page.scss'], standalone: false })
export class PendingDuesPage implements OnInit {
  dues: PendingDue[] = [];
  showFilters = false;
  vehicleType: VehicleType | '' = '';
  minOverdueDays = 0;
  minAmount = 0;
  fileId = '';
  isLoading = true;
  isLoadingMore = false;
  hasMore = false;
  page = 1;
  readonly pageSize = 25;
  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(private loanService: LoanService, private layoutService: LayoutService, private router: Router, private toastCtrl: ToastController) {}

  ngOnInit(): void { this.layoutService.setActiveTab('pending-dues'); void this.refresh(); }

  async refresh(event?: any): Promise<void> {
    this.page = 1;
    this.dues = [];
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.loanService.getPendingDues(this.params()));
      this.dues = response.data;
      this.hasMore = response.hasMore;
    } catch (error) {
      console.error('Failed to load pending dues', error);
      await this.showError('Unable to load pending dues. Check your filters and connection.');
    } finally {
      this.isLoading = false;
      event?.target?.complete();
    }
  }

  async loadMore(event: any): Promise<void> {
    if (!this.hasMore || this.isLoadingMore) { event.target.complete(); return; }
    this.isLoadingMore = true;
    this.page += 1;
    try {
      const response = await firstValueFrom(this.loanService.getPendingDues(this.params()));
      this.dues = [...this.dues, ...response.data];
      this.hasMore = response.hasMore;
    } catch {
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
    this.minOverdueDays = 0;
    this.minAmount = 0;
    this.fileId = '';
    void this.refresh();
  }

  openDue(due: PendingDue): void {
    void this.router.navigate(['/loans', due.loanId], { queryParams: { action: 'payment', installment: due.sNo } });
  }

  formatCurrency(value: number): string { return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`; }

  private params(): PendingDuesParams {
    return {
      vehicleType: this.vehicleType || undefined,
      minOverdueDays: Math.max(0, Number(this.minOverdueDays) || 0),
      minAmount: Math.max(0, Number(this.minAmount) || 0),
      fileId: this.fileId.trim() || undefined,
      page: this.page,
      pageSize: this.pageSize
    };
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
