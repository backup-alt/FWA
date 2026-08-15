import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerCreateRequest, CellNumber, Guarantor } from '../../../core/models/customer.model';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';

export type AddCustomerStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.page.html',
  styleUrls: ['./add-customer.page.scss'],
  standalone: false
})
export class AddCustomerPage implements OnInit, OnDestroy {
  currentStep: AddCustomerStep = 1;
  totalSteps = 4;

  // Forms for each step
  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;

  // Existing customer search
  existingCustomerSearch = '';
  existingCustomerResults: Customer[] = [];
  isSearching = false;
  selectedExistingCustomer: Customer | null = null;
  useExistingCustomer = false;

  // Step validation states
  step1Valid = false;
  step2Valid = false;
  step3Valid = false;

  // Loading state
  isSubmitting = false;

  // Cell numbers array for dynamic add/remove
  cellNumbers: CellNumber[] = [{ number: '' }];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private layoutService: LayoutService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.step1Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      fileId: [''],
      address: [''],
      temporaryAddress: [''],
      monthlySalary: ['', [Validators.min(0)]],
      idProofType: [''],
      idProofNumber: [''],
      idStatus: ['No']
    });

    this.step2Form = this.fb.group({
      guarantorName: [''],
      guarantorAddress: [''],
      guarantorMobile: ['']
    });

    this.step3Form = this.fb.group({
      // Vehicle info will be added per vehicle
      // For now, this step is optional in the wizard
    });
  }

  ngOnInit() {
    this.layoutService.setActiveTab('customers');

    // Watch for form validity changes
    this.step1Form.valueChanges.subscribe(() => {
      this.step1Valid = this.step1Form.valid && this.cellNumbers.some(c => c.number.trim());
    });

    this.step2Form.valueChanges.subscribe(() => {
      // Guarantor is optional
      this.step2Valid = true;
    });

    this.step3Form.valueChanges.subscribe(() => {
      this.step3Valid = true;
    });

    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (editId) this.loadCustomerForEdit(editId);
  }

  private async loadCustomerForEdit(id: string) {
    try {
      const response = await firstValueFrom(this.customerService.get(id));
      this.selectExistingCustomer(response.customer);
    } catch (error) {
      console.error('Failed to load customer for editing:', error);
      await this.showErrorToast('Could not load customer for editing');
      await this.router.navigate(['/customers', id]);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Step 1: Customer Info
  getStep1Progress(): number {
    return this.step1Valid ? 100 : 25;
  }

  onBack(): void {
    void this.router.navigate(['/customers']);
  }

  getOverallProgress(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  getStepShortLabel(step: number): string {
    return ['Customer', 'Guarantor', 'Finance', 'Summary'][step - 1] || '';
  }

  getInitials(name: string): string {
    return (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
  }

  getAvatarColor(id: string): string {
    const colors = ['#0f4c81', '#49647a', '#006874', '#725b00', '#6b5778'];
    const hash = [...(id || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  hasPhoneNumber(): boolean {
    return this.cellNumbers.some(cell => Boolean(cell.number.trim()));
  }

  addCellNumber() {
    if (this.cellNumbers.length < 5) {
      this.cellNumbers.push({ number: '' });
    }
  }

  removeCellNumber(index: number) {
    if (this.cellNumbers.length > 1) {
      this.cellNumbers.splice(index, 1);
      this.step1Form.updateValueAndValidity();
    }
  }

  async searchExistingCustomers() {
    if (!this.existingCustomerSearch.trim() || this.existingCustomerSearch.length < 2) {
      this.existingCustomerResults = [];
      return;
    }

    this.isSearching = true;
    try {
      const response = await this.customerService.list({
        search: this.existingCustomerSearch,
        searchType: 'name',
        page: 1,
        pageSize: 10
      }).toPromise();

      this.existingCustomerResults = response?.data || [];
    } catch (error) {
      console.error('Search failed:', error);
      this.existingCustomerResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectExistingCustomer(customer: Customer) {
    this.selectedExistingCustomer = customer;
    this.useExistingCustomer = true;

    // Pre-fill form with existing customer data
    this.step1Form.patchValue({
      name: customer.name,
      fileId: customer.fileId || '',
      address: customer.address || '',
      temporaryAddress: customer.temporaryAddress || '',
      monthlySalary: customer.monthlySalary || '',
      idProofType: customer.idProofType || '',
      idProofNumber: customer.idProofNumber || '',
      idStatus: customer.idStatus || 'No'
    });

    // Pre-fill cell numbers
    this.cellNumbers = customer.cellNumbers?.map(c => ({ number: c.number })) || [{ number: '' }];

    // Pre-fill guarantor
    if (customer.guarantor) {
      this.step2Form.patchValue({
        guarantorName: customer.guarantor.name,
        guarantorAddress: customer.guarantor.address,
        guarantorMobile: customer.guarantor.mobile
      });
    }

    this.existingCustomerResults = [];
    this.existingCustomerSearch = '';
    this.nextStep();
  }

  useNewCustomer() {
    this.useExistingCustomer = false;
    this.selectedExistingCustomer = null;
    this.nextStep();
  }

  // Navigation
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.step1Form.valid && this.hasPhoneNumber();
      case 2:
        return this.step2Valid;
      case 3:
        return this.step3Valid;
      case 4:
        return true;
      default:
        return false;
    }
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Customer Info';
      case 2: return 'Guarantor';
      case 3: return 'Vehicle & Finance';
      case 4: return 'Summary';
      default: return '';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case 1: return 'Enter customer details and contact information';
      case 2: return 'Add guarantor details (optional)';
      case 3: return 'Add vehicle and financing details (optional)';
      case 4: return 'Review and confirm customer information';
      default: return '';
    }
  }

  // Build customer data for submission
  buildCustomerData(): CustomerCreateRequest {
    const guarantor = this.step2Form.value.guarantorName ? {
      name: this.step2Form.value.guarantorName,
      address: this.step2Form.value.guarantorAddress,
      mobile: this.step2Form.value.guarantorMobile
    } as Guarantor : undefined;

    return {
      name: this.step1Form.value.name,
      fileId: this.step1Form.value.fileId || undefined,
      address: this.step1Form.value.address || undefined,
      temporaryAddress: this.step1Form.value.temporaryAddress || undefined,
      monthlySalary: this.step1Form.value.monthlySalary ? Number(this.step1Form.value.monthlySalary) : undefined,
      cellNumbers: this.cellNumbers.filter(c => c.number.trim()).map(c => ({ number: c.number.trim() })),
      guarantor,
      idProofType: this.step1Form.value.idProofType || undefined,
      idProofNumber: this.step1Form.value.idProofNumber || undefined,
      idStatus: this.step1Form.value.idStatus as 'Yes' | 'No' | ''
    };
  }

  async submit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: this.useExistingCustomer ? 'Updating customer...' : 'Creating customer...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const customerData = this.buildCustomerData();

      if (this.useExistingCustomer && this.selectedExistingCustomer) {
        await this.customerService.update(this.selectedExistingCustomer._id, customerData).toPromise();
        await this.showSuccessToast('Customer updated successfully');
      } else {
        await this.customerService.create(customerData).toPromise();
        await this.showSuccessToast('Customer created successfully');
      }

      this.router.navigate(['/customers']);
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      const message = error?.error?.message || 'Failed to save customer. Please try again.';
      await this.showErrorToast(message);
    } finally {
      this.isSubmitting = false;
      await loading.dismiss();
    }
  }

  // Summary data for step 4
  getSummaryData() {
    const data = this.buildCustomerData();
    return {
      name: data.name,
      fileId: data.fileId,
      address: data.address,
      temporaryAddress: data.temporaryAddress,
      monthlySalary: data.monthlySalary,
      cellNumbers: data.cellNumbers,
      guarantor: data.guarantor,
      idProofType: data.idProofType,
      idProofNumber: data.idProofNumber,
      idStatus: data.idStatus
    };
  }

  getSummarySections(): Array<{ title: string; fields: Array<{ label: string; value: string }> }> {
    const data = this.getSummaryData();
    return [
      {
        title: 'Customer',
        fields: [
          { label: 'File number', value: data.fileId || 'Not assigned' },
          { label: 'Name', value: data.name },
          { label: 'Phone', value: data.cellNumbers.map(cell => cell.number).join(', ') },
          { label: 'Address', value: data.address || 'Not provided' },
          { label: 'Monthly salary', value: this.formatCurrency(data.monthlySalary) }
        ]
      },
      {
        title: 'Guarantor & ID',
        fields: [
          { label: 'Guarantor', value: data.guarantor?.name || 'Not provided' },
          { label: 'ID proof', value: data.idProofType ? `${data.idProofType} ${data.idProofNumber || ''}`.trim() : 'Not provided' },
          { label: 'ID status', value: data.idStatus || 'Not set' }
        ]
      }
    ];
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '—';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}
