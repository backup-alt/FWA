import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular';
import { CustomerService } from '../../../core/services/customer.service';
import { LoanService } from '../../../core/services/loan.service';
import { CellNumber, Customer, CustomerCreateRequest, Guarantor } from '../../../core/models/customer.model';
import { Cheque, InstallmentPeriodUnit, LoanCreateRequest, Vehicle, VehicleType } from '../../../core/models/loan.model';
import { LayoutService } from '../../../core/services/layout.service';

export type AddCustomerStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.page.html',
  styleUrls: ['./add-customer.page.scss'],
  standalone: false
})
export class AddCustomerPage implements OnInit {
  readonly today = new Date().toISOString().split('T')[0];
  readonly steps = [1, 2, 3, 4];
  currentStep: AddCustomerStep = 1;
  isSubmitting = false;
  isEditMode = false;

  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;
  step4Form: FormGroup;

  cellNumbers: CellNumber[] = [{ number: '' }];
  existingCustomerSearch = '';
  existingCustomerResults: Customer[] = [];
  isSearching = false;
  selectedExistingCustomer: Customer | null = null;
  useExistingCustomer = false;
  profileImagePreview = '';
  profileImageData = '';
  profileImageChanged = false;
  private createdCustomerId = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private loanService: LoanService,
    private layoutService: LayoutService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.step1Form = this.fb.group({
      fileId: [''], name: ['', [Validators.required, Validators.minLength(2)]],
      address: [''], temporaryAddress: [''], monthlySalary: ['', Validators.min(0)],
      idProofType: [''], idProofNumber: [''], idStatus: ['No']
    });
    this.step2Form = this.fb.group({
      guarantorName: [''], guarantorMobile: [''], guarantorAddress: ['']
    });
    this.step3Form = this.fb.group({
      vehicles: this.fb.array([this.createVehicleForm()]), loanAccountNumber: [''],
      loanAmount: ['', [Validators.required, Validators.min(1)]],
      financeAmount: ['', [Validators.required, Validators.min(1)]],
      interestRate: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      installmentPeriod: ['', [Validators.required, Validators.min(1)]],
      installmentPeriodUnit: ['Months', Validators.required],
      loanStartDate: [this.today, Validators.required], salesDoneBy: ['']
    });
    this.step4Form = this.fb.group({ cheques: this.fb.array([]) });
  }

  ngOnInit(): void {
    this.layoutService.setActiveTab('customers');
    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (editId) {
      this.isEditMode = true;
      void this.loadCustomerForEdit(editId);
      return;
    }
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    if (customerId) void this.loadCustomerForLoan(customerId);
  }

  get vehicles(): FormArray { return this.step3Form.get('vehicles') as FormArray; }
  get cheques(): FormArray { return this.step4Form.get('cheques') as FormArray; }
  get visibleSteps(): number[] { return this.isEditMode ? [1, 2, 4] : this.steps; }

  setCustomerMode(existing: boolean): void {
    this.useExistingCustomer = existing;
    if (!existing) {
      this.selectedExistingCustomer = null;
      this.existingCustomerResults = [];
      this.existingCustomerSearch = '';
      this.resetCustomerForms();
    }
  }

  async searchExistingCustomers(): Promise<void> {
    const search = this.existingCustomerSearch.trim();
    if (search.length < 2) { this.existingCustomerResults = []; return; }
    this.isSearching = true;
    try {
      const response = await firstValueFrom(this.customerService.list({ search, page: 1, pageSize: 10 }));
      this.existingCustomerResults = response.data;
    } catch (error) {
      console.error('Customer search failed:', error);
      this.existingCustomerResults = [];
    } finally { this.isSearching = false; }
  }

  selectExistingCustomer(customer: Customer): void {
    this.selectedExistingCustomer = customer;
    this.useExistingCustomer = true;
    this.patchCustomer(customer);
    this.existingCustomerResults = [];
    this.existingCustomerSearch = '';
  }

  addCellNumber(): void { if (this.cellNumbers.length < 5) this.cellNumbers.push({ number: '' }); }
  removeCellNumber(index: number): void { if (this.cellNumbers.length > 1) this.cellNumbers.splice(index, 1); }
  addVehicle(): void { this.vehicles.push(this.createVehicleForm()); }
  removeVehicle(index: number): void { if (this.vehicles.length > 1) this.vehicles.removeAt(index); }
  addCheque(): void {
    this.cheques.push(this.fb.group({ chequeNumber: ['', Validators.required], bank: [''], amount: ['', Validators.min(0)] }));
  }
  removeCheque(index: number): void { this.cheques.removeAt(index); }
  hasPhoneNumber(): boolean { return this.cellNumbers.some(cell => Boolean(cell.number.trim())); }

  getInitials(name: string): string {
    return String(name || 'Customer').split(/\s+/).filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 2);
  }

  chooseProfileImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        await this.showErrorToast('Profile image must be smaller than 5 MB');
        return;
      }
      try {
        this.profileImageData = await this.readFileAsDataUrl(file);
        this.profileImagePreview = this.profileImageData;
        this.profileImageChanged = true;
      } catch {
        await this.showErrorToast('Could not read the selected image');
      }
    };
    input.click();
  }

  removeProfileImage(): void {
    this.profileImagePreview = '';
    this.profileImageData = '';
    this.profileImageChanged = true;
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return this.step1Form.valid && this.hasPhoneNumber() && (!this.useExistingCustomer || Boolean(this.selectedExistingCustomer));
    }
    if (this.currentStep === 2) return true;
    if (this.currentStep === 3) return this.step3Form.valid;
    return false;
  }

  nextStep(): void {
    if (!this.canProceed()) { this.currentForm()?.markAllAsTouched(); return; }
    if (this.isEditMode && this.currentStep === 2) this.currentStep = 4;
    else if (this.currentStep < 4) this.currentStep = (this.currentStep + 1) as AddCustomerStep;
  }
  previousStep(): void {
    if (this.isEditMode && this.currentStep === 4) this.currentStep = 2;
    else if (this.currentStep > 1) this.currentStep = (this.currentStep - 1) as AddCustomerStep;
  }
  onBack(): void {
    if (this.currentStep > 1) this.previousStep();
    else void this.router.navigate(['/customers']);
  }
  getStepShortLabel(step: number): string { return ['Customer', 'Guarantor', 'Finance', 'Summary'][step - 1] || ''; }

  get loanAmount(): number { return Number(this.step3Form.value.loanAmount || 0); }
  get period(): number { return Number(this.step3Form.value.installmentPeriod || 0); }
  get totalInterest(): number {
    return this.roundMoney(this.loanAmount * (Number(this.step3Form.value.interestRate || 0) / 100) * this.period);
  }
  get emiAmount(): number {
    if (!this.period) return 0;
    return this.roundMoney((this.loanAmount / this.period) + (this.loanAmount * Number(this.step3Form.value.interestRate || 0) / 100));
  }
  get primaryVehicle(): Vehicle | null {
    const raw = this.vehicles.at(0)?.getRawValue();
    return raw ? this.normalizeVehicle(raw) : null;
  }
  formatCurrency(amount: number | undefined): string {
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(amount || 0));
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) return;
    if (!this.isEditMode && this.step3Form.invalid) {
      this.currentStep = 3;
      this.step3Form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: this.isEditMode ? 'Saving customer...' : 'Creating customer and loan...', spinner: 'crescent'
    });
    await loading.present();
    try {
      const customerData = this.buildCustomerData();
      let customerId = this.createdCustomerId;
      if (this.selectedExistingCustomer) {
        const updated = await firstValueFrom(this.customerService.update(this.selectedExistingCustomer._id, customerData));
        customerId = updated._id;
      } else if (!customerId) {
        const created = await firstValueFrom(this.customerService.create(customerData));
        customerId = created._id;
        this.createdCustomerId = customerId;
      }
      if (this.isEditMode) {
        await this.showSuccessToast('Customer updated successfully');
        await this.router.navigate(['/customers', customerId]);
        return;
      }
      const loan = await firstValueFrom(this.loanService.create(this.buildLoanData(customerId)));
      await this.showSuccessToast('Customer and loan created successfully');
      await this.router.navigate(['/loans', loan._id]);
    } catch (error: any) {
      console.error('Failed to save customer and loan:', error);
      const fallback = this.createdCustomerId
        ? 'Customer was saved, but the loan could not be created. Correct the loan details and try again.'
        : 'Could not create the customer and loan. Please try again.';
      await this.showErrorToast(error?.error?.message || fallback);
    } finally {
      this.isSubmitting = false;
      await loading.dismiss();
    }
  }

  buildCustomerData(): CustomerCreateRequest {
    const guarantor: Guarantor | undefined = this.step2Form.value.guarantorName ? {
      name: this.step2Form.value.guarantorName.trim(), mobile: (this.step2Form.value.guarantorMobile || '').trim(),
      address: (this.step2Form.value.guarantorAddress || '').trim()
    } : undefined;
    const data: CustomerCreateRequest = {
      fileId: this.step1Form.value.fileId?.trim() || undefined,
      name: this.step1Form.value.name.trim(), address: this.step1Form.value.address?.trim() || undefined,
      temporaryAddress: this.step1Form.value.temporaryAddress?.trim() || undefined,
      monthlySalary: this.step1Form.value.monthlySalary === '' ? undefined : Number(this.step1Form.value.monthlySalary),
      cellNumbers: this.cellNumbers.filter(cell => cell.number.trim()).map(cell => ({ number: cell.number.trim() })),
      guarantor, idProofType: this.step1Form.value.idProofType || undefined,
      idProofNumber: this.step1Form.value.idProofNumber?.trim() || undefined, idStatus: this.step1Form.value.idStatus
    };
    if (this.profileImageChanged) data.profileImage = this.profileImageData;
    return data;
  }

  buildLoanData(customerId: string): LoanCreateRequest {
    const raw = this.step3Form.getRawValue();
    const vehicles = (raw.vehicles as Vehicle[]).map(vehicle => this.normalizeVehicle(vehicle));
    const first = vehicles[0];
    const cheques: Cheque[] = this.cheques.getRawValue()
      .filter((cheque: Cheque) => cheque.chequeNumber?.trim())
      .map((cheque: Cheque) => ({
        chequeNumber: cheque.chequeNumber.trim(), bank: cheque.bank?.trim() || '', amount: Number(cheque.amount || 0)
      }));
    return {
      customerId, vehicleType: first.vehicleType, make: first.make, model: first.model, regNo: first.regNo,
      loanAccountNumber: raw.loanAccountNumber?.trim() || undefined,
      loanAmount: Number(raw.loanAmount), financeAmount: Number(raw.financeAmount),
      rcDetails: { status: first.rcStatus || '' }, noc: first.noc || '', insurance: first.insurance || '',
      idProofType: first.idProofType || '', idProofNumber: first.idProofNumber || '', keyStatus: first.keyStatus || '',
      salesDoneBy: raw.salesDoneBy?.trim() || undefined, chequesReceived: cheques,
      loanStartDate: raw.loanStartDate, installmentPeriod: Number(raw.installmentPeriod),
      installmentPeriodUnit: raw.installmentPeriodUnit as InstallmentPeriodUnit,
      interestRate: Number(raw.interestRate), vehicles
    };
  }

  private createVehicleForm(): FormGroup {
    return this.fb.group({
      vehicleType: ['Bike', Validators.required], make: ['', Validators.required], model: ['', Validators.required],
      regNo: ['', Validators.required], rcStatus: [''], noc: ['NA'], insurance: ['NA'], idProofType: [''],
      idProofNumber: [''], keyStatus: ['Not Given']
    });
  }
  private normalizeVehicle(vehicle: Vehicle): Vehicle {
    return {
      vehicleType: vehicle.vehicleType as VehicleType, make: (vehicle.make || '').trim(), model: (vehicle.model || '').trim(),
      regNo: (vehicle.regNo || '').trim().toUpperCase(), rcStatus: vehicle.rcStatus || '', noc: vehicle.noc || '',
      insurance: vehicle.insurance || '', idProofType: vehicle.idProofType || '',
      idProofNumber: vehicle.idProofNumber || '', keyStatus: vehicle.keyStatus || ''
    };
  }
  private currentForm(): FormGroup | null {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    if (this.currentStep === 3) return this.step3Form;
    return this.step4Form;
  }
  private async loadCustomerForEdit(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.customerService.get(id));
      this.selectExistingCustomer(response.customer);
    } catch (error) {
      console.error('Failed to load customer for editing:', error);
      await this.showErrorToast('Could not load customer for editing');
      await this.router.navigate(['/customers', id]);
    }
  }
  private async loadCustomerForLoan(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.customerService.get(id));
      this.selectExistingCustomer(response.customer);
    } catch (error) {
      console.error('Failed to load existing customer:', error);
      await this.showErrorToast('Could not load the selected customer');
      await this.router.navigate(['/customers', id]);
    }
  }
  private patchCustomer(customer: Customer): void {
    this.step1Form.patchValue({
      fileId: customer.fileId || '', name: customer.name, address: customer.address || '',
      temporaryAddress: customer.temporaryAddress || '', monthlySalary: customer.monthlySalary ?? '',
      idProofType: customer.idProofType || '', idProofNumber: customer.idProofNumber || '', idStatus: customer.idStatus || 'No'
    });
    this.cellNumbers = customer.cellNumbers?.length
      ? customer.cellNumbers.map(cell => ({ number: cell.number })) : [{ number: '' }];
    this.step2Form.patchValue({
      guarantorName: customer.guarantor?.name || '', guarantorMobile: customer.guarantor?.mobile || '',
      guarantorAddress: customer.guarantor?.address || ''
    });
    this.profileImagePreview = customer.profileImageUrl || '';
    this.profileImageData = '';
    this.profileImageChanged = false;
  }
  private resetCustomerForms(): void {
    this.step1Form.reset({ idStatus: 'No' });
    this.step2Form.reset();
    this.cellNumbers = [{ number: '' }];
    this.profileImagePreview = '';
    this.profileImageData = '';
    this.profileImageChanged = false;
  }
  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  private roundMoney(value: number): number { return Number(value.toFixed(2)); }
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'success', position: 'bottom' });
    await toast.present();
  }
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 4500, color: 'danger', position: 'bottom' });
    await toast.present();
  }
}
