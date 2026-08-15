import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonSegment } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { Loan, LoanListParams, VehicleType, LoanStatus } from '../../../core/models/loan.model';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-loan-list',
  templateUrl: './loan-list.page.html',
  styleUrls: ['./loan-list.page.scss'],
  standalone: false
})
export class LoanListPage implements OnInit, OnDestroy {
  @ViewChild(IonSegment) statusSegment!: IonSegment;

  loans: Loan[] = [];
  page = 1;
  pageSize = 20;
  hasMore = true;
  total = 0;
  isLoading = false;
  isLoadingMore = false;

  searchQuery = '';
  searchType = 'all';
  selectedVehicleType: VehicleType | '' = '';
  selectedStatus: LoanStatus | '' = '';
  searchTimeout: any;

  vehicleTypes: { value: VehicleType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'Bike', label: 'Bike' },
    { value: 'Car', label: 'Car' },
    { value: 'Auto', label: 'Auto' }
  ];

  statuses: { value: LoanStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Renewed', label: 'Renewed' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private loanService: LoanService,
    private layoutService: LayoutService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.layoutService.setActiveTab('loans');
    this.loadLoans(true);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadLoans(refresh = false) {
    if (refresh) {
      this.page = 1;
      this.loans = [];
      this.hasMore = true;
      this.isLoading = true;
    } else {
      this.isLoadingMore = true;
    }

    const params: LoanListParams = {
      page: this.page,
      pageSize: this.pageSize,
      vehicleType: this.selectedVehicleType || undefined,
      status: this.selectedStatus || undefined,
      search: this.searchQuery.trim() || undefined
    };

    this.subscriptions.add(
      this.loanService.list(params).subscribe({
        next: (response) => {
          if (refresh) {
            this.loans = response.data;
          } else {
            this.loans = [...this.loans, ...response.data];
          }
          this.hasMore = response.hasMore;
          this.total = response.total;
          this.page = response.page;
        },
        error: (error) => {
          console.error('Failed to load loans:', error);
          this.showErrorToast('Failed to load loans');
        },
        complete: () => {
          this.isLoading = false;
          this.isLoadingMore = false;
        }
      })
    );
  }

  doRefresh(event: any) {
    this.loadLoans(true);
    // Give it a moment to show the refresher
    setTimeout(() => event.target.complete(), 500);
  }

  loadMoreLoans(event: any) {
    if (!this.hasMore || this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.page++;
    this.loadLoans(false);
    // Complete after a short delay to allow loading
    setTimeout(() => event.target.complete(), 300);
  }

  onSearchInput(event: any) {
    const query = event.detail.value || '';
    this.searchQuery = query;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadLoans(true);
    }, 300);
  }

  onSearchTypeChange(event: any) {
    this.searchType = event.detail.value;
    this.loadLoans(true);
  }

  onVehicleTypeChange(event: any) {
    this.selectedVehicleType = event.detail.value;
    this.loadLoans(true);
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.loadLoans(true);
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedVehicleType = '';
    this.selectedStatus = '';
    this.loadLoans(true);
  }

  hasActiveFilters(): boolean {
    return !!this.searchQuery || !!this.selectedVehicleType || !!this.selectedStatus;
  }

  onAddLoan() {
    this.router.navigate(['/loans/add']);
  }

  onLoanClick(loan: Loan) {
    this.router.navigate(['/loans', loan._id]);
  }

  trackByLoanId(index: number, loan: Loan): string {
    return loan._id;
  }

  getVehicleIcon(type: VehicleType): string {
    switch (type) {
      case 'Bike': return 'bicycle-outline';
      case 'Car': return 'car-outline';
      case 'Auto': return 'car-sport-outline';
      default: return 'car-outline';
    }
  }

  getVehicleColor(type: VehicleType): string {
    switch (type) {
      case 'Bike': return '#00529B';
      case 'Car': return '#00A99D';
      case 'Auto': return '#F7931E';
      default: return '#00A99D';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'ram-status-active';
      case 'Completed': return 'ram-status-completed';
      case 'Closed': return 'ram-status-closed';
      case 'Renewed': return 'ram-status-renewed';
      default: return 'ram-status-default';
    }
  }

  getInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'C';
  }

  getAvatarColor(value: string): string {
    const colors = ['#00529B', '#00A99D', '#F7931E', '#6F42C1', '#198754'];
    const hash = Array.from(value || 'customer').reduce((total, char) => total + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  getPaidInstallmentCount(loan: Loan): number {
    return loan.installments?.filter(installment => installment.status === 'Paid').length || 0;
  }

  getInstallmentProgress(loan: Loan): number {
    const total = loan.installments?.length || 0;
    return total ? Math.round((this.getPaidInstallmentCount(loan) / total) * 100) : 0;
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
