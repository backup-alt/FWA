import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, ToastController, IonInput, IonSelect, IonSelectOption, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Loan, Installment, PaymentType } from '../../../../core/models/loan.model';
import { LoanService } from '../../../../core/services/loan.service';

@Component({
  selector: 'app-record-payment-modal',
  templateUrl: './record-payment-modal.component.html',
  styleUrls: ['./record-payment-modal.component.scss'],
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
    IonSpinner
  ]
})
export class RecordPaymentModalComponent implements OnInit {
  @Input() loan!: Loan;
  @Input() installments!: Installment[];
  @Output() dismiss = new EventEmitter<any>();

  paymentForm: FormGroup;
  isSubmitting = false;
  selectedInstallment: Installment | null = null;
  readonly today = new Date().toISOString().split('T')[0];

  paymentTypes: { value: PaymentType; label: string }[] = [
    { value: 'Cash', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cheque', label: 'Cheque' },
    { value: 'Other', label: 'Other' },
    { value: '', label: 'Cash' }
  ];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loanService: LoanService,
    private toastCtrl: ToastController
  ) {
    this.paymentForm = this.fb.group({
      installmentId: ['', Validators.required],
      amountReceived: ['', [Validators.required, Validators.min(1)]],
      dateReceived: [new Date().toISOString().split('T')[0], Validators.required],
      paymentType: ['Cash'],
      sign: [''],
      completed: [false]
    });
  }

  ngOnInit() {
    if (this.installments.length > 0) {
      this.selectedInstallment = this.installments[0];
      this.paymentForm.patchValue({ installmentId: this.selectedInstallment.sNo });
      this.updateAmountValidators();
    }

    this.paymentForm.get('installmentId')?.valueChanges.subscribe(sNo => {
      this.selectedInstallment = this.installments.find(i => i.sNo === sNo) || null;
      this.updateAmountValidators();
    });
  }

  updateAmountValidators() {
    const amountControl = this.paymentForm.get('amountReceived');
    if (this.selectedInstallment) {
      amountControl?.setValidators([
        Validators.required,
        Validators.min(0)
      ]);
      amountControl?.updateValueAndValidity();
    }
  }

  getMaxAmount(): number {
    if (!this.selectedInstallment) return 0;
    return this.selectedInstallment.pendingAmount || this.selectedInstallment.dueAmount;
  }

  onAmountInput(event: any) {
    const value = parseFloat(event.detail.value);
    if (!isNaN(value) && this.selectedInstallment) {
      const max = this.getMaxAmount();
      // Auto-check completed if paying full pending amount
      this.paymentForm.patchValue({ completed: value >= max });
    }
  }

  setQuickAmount(amount: number): void {
    this.paymentForm.patchValue({ amountReceived: Math.max(0, Number(amount || 0)) });
    this.onAmountInput({ detail: { value: amount } });
  }

  async onSubmit() {
    if (this.paymentForm.invalid || !this.selectedInstallment) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const value = this.paymentForm.value;
    try {
      await firstValueFrom(this.loanService.recordPayment(this.loan._id, this.selectedInstallment.sNo, {
        sNo: this.selectedInstallment.sNo,
        dueAmount: this.selectedInstallment.dueAmount,
        dueDate: this.selectedInstallment.dueDate,
        amountReceived: Number(value.amountReceived || 0),
        dateReceived: value.dateReceived || null,
        sign: value.sign || '',
        paymentType: value.paymentType || '',
        completed: Boolean(value.completed)
      }));
      this.isSubmitting = false;
      this.modalCtrl.dismiss({ success: true });
    } catch (error: any) {
      this.isSubmitting = false;
      const toast = await this.toastCtrl.create({ message: error?.error?.message || 'Failed to record payment.', duration: 3500, color: 'danger' });
      await toast.present();
    }
  }

  onCancel() {
    this.modalCtrl.dismiss({ success: false });
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

  getInstallmentStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'ram-installment-paid';
      case 'Partial': return 'ram-installment-partial';
      case 'Overdue': return 'ram-installment-overdue';
      case 'Cancelled': return 'ram-installment-cancelled';
      default: return 'ram-installment-pending';
    }
  }
}
