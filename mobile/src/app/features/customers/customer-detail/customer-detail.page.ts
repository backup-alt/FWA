import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonSegment } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CustomerService } from '../../../core/services/customer.service';
import { LoanService } from '../../../core/services/loan.service';
import { Customer } from '../../../core/models/customer.model';
import { Loan, VehicleType } from '../../../core/models/loan.model';
import { LayoutService } from '../../../core/services/layout.service';
import { EditLoanModalComponent } from '../../loans/loan-detail/edit-loan-modal/edit-loan-modal.component';
import { ToastController, AlertController, LoadingController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.page.html',
  styleUrls: ['./customer-detail.page.scss'],
  standalone: false
})
export class CustomerDetailPage implements OnInit, OnDestroy {
  @ViewChild(IonSegment) segment!: IonSegment;

  customerId = '';
  customer: Customer | null = null;
  isLoading = true;
  isLoadingLoans = false;

  // Loans tab data
  loans: Loan[] = [];
  loansPage = 1;
  loansPageSize = 10;
  loansHasMore = true;
  loansTotal = 0;

  activeTab = 'overview';
  photoPreviewOpen = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private loanService: LoanService,
    private layoutService: LayoutService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.layoutService.setActiveTab('customers');
    this.customerId = this.route.snapshot.paramMap.get('id') || '';
    if (this.customerId) {
      this.loadCustomer();
      this.loadLoans(true);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadCustomer() {
    try {
      const response = await this.customerService.get(this.customerId).toPromise();
      this.customer = response?.customer || null;
      this.loans = response?.loans || [];
      this.loansTotal = this.loans.length;
      this.loansHasMore = false;
    } catch (error) {
      console.error('Failed to load customer:', error);
      this.showErrorToast('Failed to load customer details');
      this.router.navigate(['/customers']);
    } finally {
      this.isLoading = false;
    }
  }

  async loadLoans(refresh = false) {
    if (refresh) {
      this.loansPage = 1;
      this.loans = [];
      this.loansHasMore = true;
    } else {
      this.isLoadingLoans = true;
    }

    try {
      const response = await this.loanService.list({
        customerId: this.customerId,
        page: this.loansPage,
        pageSize: this.loansPageSize
      }).toPromise();

      if (!response) return;

      if (refresh) {
        this.loans = response.data;
      } else {
        this.loans = [...this.loans, ...response.data];
      }

      this.loansHasMore = response.hasMore;
      this.loansTotal = response.total;
      this.loansPage = response.page;

    } catch (error) {
      console.error('Failed to load loans:', error);
      this.showErrorToast('Failed to load loans');
    } finally {
      this.isLoadingLoans = false;
    }
  }

  async doRefresh(event: any) {
    await Promise.all([
      this.loadCustomer(),
      this.loadLoans(true)
    ]);
    event.target.complete();
  }

  async loadMoreLoans(event: any) {
    if (!this.loansHasMore || this.isLoadingLoans) {
      event.target.complete();
      return;
    }

    this.loansPage++;
    await this.loadLoans(false);
    event.target.complete();
  }

  onTabChange(event: any) {
    this.activeTab = event.detail.value;
  }

  // Navigation
  onEditCustomer() {
    this.router.navigate(['/customers/add'], { queryParams: { edit: this.customerId } });
  }

  onAddLoan() {
    this.router.navigate(['/customers/add'], { queryParams: { customerId: this.customerId } });
  }

  onLoanClick(loan: Loan) {
    this.router.navigate(['/loans', loan._id]);
  }

  async onEditLoan(event: Event, loan: Loan) {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({ component: EditLoanModalComponent, componentProps: { loan }, cssClass: 'ram-modal-fullscreen' });
    modal.onDidDismiss().then(result => { if (result.data?.success) this.loadLoans(true); });
    await modal.present();
  }

  onBack() {
    this.router.navigate(['/customers']);
  }

  // Actions
  async onDeleteCustomer() {
    const alert = await this.alertCtrl.create({
      header: 'Delete Customer',
      message: `Are you sure you want to delete "${this.customer?.name}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteCustomer()
        }
      ]
    });
    await alert.present();
  }

  async deleteCustomer() {
    const loading = await this.loadingCtrl.create({ message: 'Deleting customer...' });
    await loading.present();

    try {
      await this.customerService.delete(this.customerId).toPromise();
      await this.showSuccessToast('Customer deleted successfully');
      this.router.navigate(['/customers']);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      this.showErrorToast('Failed to delete customer');
    } finally {
      await loading.dismiss();
    }
  }

  // Helpers
  getPrimaryPhone(): string {
    return this.customer?.cellNumbers?.[0]?.number || '—';
  }

  getAllPhones(): string {
    return this.customer?.cellNumbers?.map(c => c.number).join(', ') || '—';
  }

  getGuarantorName(): string {
    return this.customer?.guarantor?.name || '—';
  }

  getGuarantorPhone(): string {
    return this.customer?.guarantor?.mobile || '—';
  }

  getVehicleCount(): number {
    return (this.customer?.bikeCount || 0) + (this.customer?.carCount || 0) + (this.customer?.autoCount || 0);
  }

  getVehicleSummary(): string {
    const parts: string[] = [];
    if (this.customer?.bikeCount) parts.push(`${this.customer.bikeCount} Bike${this.customer.bikeCount > 1 ? 's' : ''}`);
    if (this.customer?.carCount) parts.push(`${this.customer.carCount} Car${this.customer.carCount > 1 ? 's' : ''}`);
    if (this.customer?.autoCount) parts.push(`${this.customer.autoCount} Auto${this.customer.autoCount > 1 ? 's' : ''}`);
    return parts.join(', ') || 'No vehicles';
  }

  getInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'C';
  }

  getAvatarColor(value: string): string {
    const colors = ['#00529B', '#00A99D', '#F7931E', '#6F42C1', '#198754'];
    const hash = Array.from(value || 'customer').reduce((total, char) => total + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  async copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      await this.showSuccessToast('Copied to clipboard');
    } catch {
      await this.showErrorToast('Could not copy to clipboard');
    }
  }

  getVehicleIcon(type: VehicleType): string {
    return type === 'Bike' ? 'bicycle-outline' : type === 'Auto' ? 'car-sport-outline' : 'car-outline';
  }

  getVehicleColor(type: VehicleType): string {
    return type === 'Bike' ? '#00529B' : type === 'Auto' ? '#F7931E' : '#00A99D';
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

  formatOptionalCurrency(amount: number | undefined): string {
    return amount ? this.formatCurrency(amount) : '—';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getLoanStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'ram-status-active';
      case 'Completed': return 'ram-status-completed';
      case 'Closed': return 'ram-status-closed';
      case 'Overdue': return 'ram-status-overdue';
      default: return 'ram-status-default';
    }
  }

  trackByLoanId(index: number, loan: Loan): string {
    return loan._id;
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'success', position: 'bottom' });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 4000, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
