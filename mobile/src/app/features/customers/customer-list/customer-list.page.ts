import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerSearchParams } from '../../../core/models/customer.model';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.page.html',
  styleUrls: ['./customer-list.page.scss'],
  standalone: false
})
export class CustomerListPage implements OnInit, OnDestroy {
  customers: Customer[] = [];
  isLoading = true;
  isLoadingMore = false;
  hasMore = true;
  searchTerm = '';
  searchType: CustomerSearchParams['searchType'] = 'name';
  currentPage = 1;
  pageSize = 20;
  totalCustomers = 0;

  private subscriptions = new Subscription();

  constructor(
    private customerService: CustomerService,
    private layoutService: LayoutService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.layoutService.setActiveTab('customers');
    this.loadCustomers(true);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadCustomers(refresh = false) {
    if (refresh) {
      this.currentPage = 1;
      this.customers = [];
      this.hasMore = true;
      this.isLoading = true;
    } else {
      this.isLoadingMore = true;
    }

    try {
      const params: CustomerSearchParams = {
        page: this.currentPage,
        pageSize: this.pageSize,
        search: this.searchTerm || undefined,
        searchType: this.searchTerm ? this.searchType : undefined
      };

      const response = await this.customerService.list(params).toPromise();

      if (!response) return;

      if (refresh) {
        this.customers = response.data;
      } else {
        this.customers = [...this.customers, ...response.data];
      }

      this.hasMore = response.hasMore;
      this.totalCustomers = response.total;
      this.currentPage = response.page;

    } catch (error) {
      console.error('Failed to load customers:', error);
      this.showErrorToast('Failed to load customers');
    } finally {
      this.isLoading = false;
      this.isLoadingMore = false;
    }
  }

  async doRefresh(event: any) {
    await this.loadCustomers(true);
    event.target.complete();
  }

  async loadMore(event: any) {
    if (!this.hasMore || this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.currentPage++;
    await this.loadCustomers(false);
    event.target.complete();
  }

  onSearchInput(event: any) {
    this.searchTerm = event.detail.value || '';
    this.loadCustomers(true);
  }

  onSearchTypeChange(type: unknown) {
    this.searchType = type as CustomerSearchParams['searchType'];
    if (this.searchTerm) {
      this.loadCustomers(true);
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadCustomers(true);
  }

  onCustomerClick(customer: Customer) {
    this.router.navigate(['/customers', customer._id]);
  }

  onAddCustomer() {
    this.router.navigate(['/customers/add']);
  }

  trackByCustomerId(index: number, customer: Customer): string {
    return customer._id;
  }

  getPrimaryPhone(customer: Customer): string {
    return customer.cellNumbers?.[0]?.number || '—';
  }

  getInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'C';
  }

  getAvatarColor(value: string): string {
    const colors = ['#00529B', '#00A99D', '#F7931E', '#6F42C1', '#198754'];
    const hash = Array.from(value || 'customer').reduce((total, char) => total + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}
