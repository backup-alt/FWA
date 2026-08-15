import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { LoanSummary, PendingDuesSummary } from '../../core/models/loan.model';
import { LayoutService } from '../../core/services/layout.service';
import { LoanService } from '../../core/services/loan.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  summary: LoanSummary | null = null;
  pendingSummary: PendingDuesSummary | null = null;
  isLoading = true;
  isRefreshing = false;
  selectedVehicleFilter: 'all' | 'bike' | 'car' | 'auto' = 'all';
  selectedTrendFilter: '6m' | '1y' | 'max' = '6m';

  constructor(
    private loanService: LoanService,
    private layoutService: LayoutService,
    private router: Router,
    private toastCtrl: ToastController,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.layoutService.setActiveTab('dashboard');
    void this.loadData();
  }

  async loadData(showLoader = true): Promise<void> {
    this.isLoading = showLoader;
    this.isRefreshing = !showLoader;
    try {
      const [summary, pending] = await Promise.all([
        firstValueFrom(this.loanService.getSummary()),
        firstValueFrom(this.loanService.getPendingDuesSummary())
      ]);
      this.summary = summary;
      this.pendingSummary = pending;
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      this.summary = null;
      await this.showErrorToast('Unable to load dashboard. Check your connection and retry.');
    } finally {
      this.isLoading = false;
      this.isRefreshing = false;
    }
  }

  async doRefresh(event: any): Promise<void> {
    await this.loadData(false);
    event.target.complete();
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  formatCurrency(value: number): string {
    return `₹${this.formatNumber(value)}`;
  }

  getVehicleTotal(): number {
    const counts = this.summary?.vehicleTypeCounts;
    return (counts?.Bike || 0) + (counts?.Car || 0) + (counts?.Auto || 0);
  }

  vehicleDonut(): string {
    const total = this.getVehicleTotal() || 1;
    const bike = ((this.summary?.vehicleTypeCounts.Bike || 0) / total) * 100;
    const car = bike + ((this.summary?.vehicleTypeCounts.Car || 0) / total) * 100;
    return `conic-gradient(#00529B 0 ${bike}%, #00A99D ${bike}% ${car}%, #F7931E ${car}% 100%)`;
  }

  visibleCollections(): Array<{ month: string; collected: number }> {
    const rows = this.summary?.monthlyCollections || [];
    const count = this.selectedTrendFilter === '6m' ? 6 : this.selectedTrendFilter === '1y' ? 12 : rows.length;
    return rows.slice(-count);
  }

  collectionBarWidth(value: number): number {
    const max = Math.max(...this.visibleCollections().map(item => item.collected), 1);
    return Math.max(3, (value / max) * 100);
  }

  onPaymentsReport(): void {
    void this.router.navigate(['/reports']);
  }

  onFabClick(): void {
    void this.router.navigate(['/customers/add']);
  }

  async onLogout(): Promise<void> {
    try {
      await firstValueFrom(this.authService.logout());
    } catch (error) {
      console.warn('Server logout failed; clearing local session', error);
      this.authService.clearAuthState();
    } finally {
      await this.router.navigate(['/login']);
    }
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
