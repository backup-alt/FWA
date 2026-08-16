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

  collectionPolyline(): string {
    const values = this.visibleCollections().map(item => Number(item.collected || 0));
    if (!values.length) return '';
    const left = 54;
    const right = 350;
    const top = 16;
    const bottom = 126;
    const max = this.collectionChartMax();
    const step = values.length > 1 ? (right - left) / (values.length - 1) : 0;
    return values.map((value, index) => {
      const x = values.length > 1 ? left + index * step : (left + right) / 2;
      const y = bottom - (value / max) * (bottom - top);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  collectionArea(): string {
    const line = this.collectionPolyline();
    return line ? `54,126 ${line} 350,126` : '';
  }

  collectionDots(): Array<{ x: number; y: number; label: string; value: number; showLabel: boolean }> {
    const rows = this.visibleCollections();
    const max = this.collectionChartMax();
    const step = rows.length > 1 ? 296 / (rows.length - 1) : 0;
    const labelInterval = Math.max(1, Math.ceil(rows.length / 6));
    return rows.map((item, index) => ({
      x: rows.length > 1 ? 54 + index * step : 202,
      y: 126 - (Number(item.collected || 0) / max) * 110,
      label: this.formatGraphMonth(item.month),
      value: Number(item.collected || 0),
      showLabel: index === 0 || index === rows.length - 1 || index % labelInterval === 0
    }));
  }

  collectionYAxisTicks(): Array<{ y: number; label: string }> {
    const max = this.collectionChartMax();
    return [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
      y: 126 - ratio * 110,
      label: this.compactCurrency(max * ratio)
    }));
  }

  private collectionChartMax(): number {
    const rawMax = Math.max(...this.visibleCollections().map(item => Number(item.collected || 0)), 1);
    const magnitude = 10 ** Math.floor(Math.log10(rawMax));
    return Math.ceil(rawMax / magnitude) * magnitude;
  }

  private compactCurrency(value: number): string {
    if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(value % 10_000_000 ? 1 : 0)}Cr`;
    if (value >= 100_000) return `₹${(value / 100_000).toFixed(value % 100_000 ? 1 : 0)}L`;
    if (value >= 1_000) return `₹${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K`;
    return `₹${Math.round(value)}`;
  }

  private formatGraphMonth(value: string): string {
    const match = String(value || '').match(/^(\d{4})-(\d{1,2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, 1)
        .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    return String(value || '').replace(/\s+/g, ' ').slice(0, 8);
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
