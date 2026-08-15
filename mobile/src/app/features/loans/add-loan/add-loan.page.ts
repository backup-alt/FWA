import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonInput, IonSelect, IonSelectOption, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonSpinner, IonToast, IonTextarea, IonToggle } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/models/customer.model';
import { LoanCreateRequest, Vehicle, VehicleType, InstallmentPeriodUnit } from '../../../core/models/loan.model';
import { LayoutService } from '../../../core/services/layout.service';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-add-loan',
  templateUrl: './add-loan.page.html',
  styleUrls: ['./add-loan.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonSpinner,
    IonToast,
    IonTextarea,
    IonToggle
  ]
})
export class AddLoanPage implements OnInit, OnDestroy {
  readonly today = new Date().toISOString().split('T')[0];
  loanForm: FormGroup;
  isSubmitting = false;
  isLoadingCustomer = false;
  customerId = '';
  customer: Customer | null = null;
  customers: Customer[] = [];
  isLoadingCustomers = false;

  vehicleTypes: { value: VehicleType; label: string }[] = [
    { value: 'Bike', label: 'Bike' },
    { value: 'Car', label: 'Car' },
    { value: 'Auto', label: 'Auto' }
  ];

  periodUnits: { value: InstallmentPeriodUnit; label: string }[] = [
    { value: 'Months', label: 'Months' },
    { value: 'Weeks', label: 'Weeks' },
    { value: 'Days', label: 'Days' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private loanService: LoanService,
    private customerService: CustomerService,
    private layoutService: LayoutService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.loanForm = this.fb.group({
      customerId: ['', Validators.required],
      vehicleType: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      regNo: ['', Validators.required],
      loanAccountNumber: [''],
      loanAmount: ['', [Validators.required, Validators.min(1)]],
      financeAmount: ['', [Validators.required, Validators.min(1)]],
      rcDetails: this.fb.group({
        status: [''],
        paidThrough: [''],
        chequeNumber: [''],
        amount: [0]
      }),
      noc: [''],
      insurance: [''],
      idProofType: [''],
      idProofNumber: [''],
      keyStatus: [''],
      additionalVehicles: this.fb.array([]),
      salesDoneBy: [''],
      chequesReceived: this.fb.array([]),
      loanStartDate: [new Date().toISOString().split('T')[0], Validators.required],
      installmentPeriod: ['', [Validators.required, Validators.min(1)]],
      installmentPeriodUnit: ['Months', Validators.required],
      interestRate: ['', [Validators.required, Validators.min(0.1), Validators.max(50)]]
    });
  }

  ngOnInit() {
    this.layoutService.setActiveTab('loans');

    // Check for customerId in query params
    this.route.queryParams.subscribe(params => {
      if (params['customerId']) {
        this.customerId = params['customerId'];
        this.loanForm.patchValue({ customerId: this.customerId });
        this.loadCustomer(this.customerId);
      } else {
        // Load customers list for selection
        this.loadCustomers();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadCustomers() {
    this.isLoadingCustomers = true;
    try {
      const response = await this.customerService.list({ page: 1, pageSize: 100 }).toPromise();
      this.customers = response?.data || [];
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      this.isLoadingCustomers = false;
    }
  }

  async loadCustomer(id: string) {
    this.isLoadingCustomer = true;
    try {
      const response = await this.customerService.get(id).toPromise();
      this.customer = response?.customer || null;
      if (this.customer) {
        this.loanForm.patchValue({
          customerId: this.customer._id,
          // Pre-fill from customer if needed
        });
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      this.isLoadingCustomer = false;
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get additionalVehicles(): FormArray {
    return this.loanForm.controls['additionalVehicles'] as FormArray;
  }

  addVehicle() {
    this.additionalVehicles.push(this.fb.group({
      vehicleType: ['Bike', Validators.required], regNo: ['', Validators.required],
      make: ['', Validators.required], model: ['', Validators.required], rcStatus: [''],
      noc: ['NA'], insurance: ['NA'], keyStatus: ['Not Given']
    }));
  }

  removeVehicle(index: number) {
    this.additionalVehicles.removeAt(index);
  }

  getAvatarColor(str: string): string {
    const colors = [
      '#00529B', '#00A99D', '#F7931E', '#E83E8C', '#6F42C1',
      '#20C997', '#FD7E14', '#DC3545', '#0DCAF0', '#198754'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  async onSubmit() {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const loading = await this.loadingCtrl.create({ message: 'Creating loan...' });
    await loading.present();

    try {
      const raw = this.loanForm.getRawValue();
      const primaryVehicle: Vehicle = {
        vehicleType: raw.vehicleType, make: raw.make, model: raw.model, regNo: raw.regNo,
        rcStatus: raw.rcDetails?.status || '', noc: raw.noc || '', insurance: raw.insurance || '', keyStatus: raw.keyStatus || ''
      };
      const { additionalVehicles, ...baseLoan } = raw;
      const loanData: LoanCreateRequest = { ...baseLoan, vehicles: [primaryVehicle, ...(additionalVehicles as Vehicle[])] };
      await this.loanService.create(loanData).toPromise();
      await this.showSuccessToast('Loan created successfully');
      this.router.navigate(['/loans']);
    } catch (error: any) {
      console.error('Failed to create loan:', error);
      const message = error?.error?.message || 'Failed to create loan';
      await this.showErrorToast(message);
    } finally {
      this.isSubmitting = false;
      await loading.dismiss();
    }
  }

  onCancel() {
    this.router.navigate(['/loans']);
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
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
