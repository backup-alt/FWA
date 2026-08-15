import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, ToastController, IonInput, IonSelect, IonSelectOption, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, IonToggle } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Loan } from '../../../../core/models/loan.model';
import { LoanService } from '../../../../core/services/loan.service';

@Component({
  selector: 'app-renew-loan-modal',
  templateUrl: './renew-loan-modal.component.html',
  styleUrls: ['./renew-loan-modal.component.scss'],
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
    IonSpinner,
    IonToggle
  ]
})
export class RenewLoanModalComponent implements OnInit {
  @Input() loan!: Loan;

  renewForm: FormGroup;
  isSubmitting = false;
  totalAmount = 0;
  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loanService: LoanService,
    private toastCtrl: ToastController
  ) {
    this.renewForm = this.fb.group({
      extraAmount: [0, [Validators.required, Validators.min(0)]],
      installmentPeriod: ['', [Validators.required, Validators.min(1)]],
      interestRate: ['', [Validators.required, Validators.min(0.1), Validators.max(50)]],
      renewalDate: [new Date().toISOString().split('T')[0], Validators.required],
      closeExistingLoan: [true],
      chargeInterestOnOutstanding: [true],
      chargeInterestOnExtra: [false]
    });
  }

  ngOnInit() {
    // Pre-fill with current loan values
    this.renewForm.patchValue({
      installmentPeriod: this.loan?.installmentPeriod || 12,
      interestRate: this.loan?.interestRate || 12
    });

    this.calculateTotalAmount();

    this.renewForm.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });
  }

  calculateTotalAmount() {
    const outstanding = this.loan?.outstandingPrincipal || 0;
    const extraAmount = this.renewForm.get('extraAmount')?.value || 0;
    const chargeOnOutstanding = this.renewForm.get('chargeInterestOnOutstanding')?.value;
    const chargeOnExtra = this.renewForm.get('chargeInterestOnExtra')?.value;
    const interestRate = this.renewForm.get('interestRate')?.value || 0;
    const period = this.renewForm.get('installmentPeriod')?.value || 0;

    let principal = outstanding + extraAmount;

    // If charging interest on outstanding, add interest to principal
    if (chargeOnOutstanding && interestRate > 0 && period > 0) {
      const monthlyRate = interestRate / 100 / 12;
      if (monthlyRate > 0) {
        const interestOnOutstanding = outstanding * monthlyRate * period;
        principal += interestOnOutstanding;
      }
    }

    // If charging interest on extra, add interest to principal
    if (chargeOnExtra && interestRate > 0 && period > 0 && extraAmount > 0) {
      const monthlyRate = interestRate / 100 / 12;
      if (monthlyRate > 0) {
        const interestOnExtra = extraAmount * monthlyRate * period;
        principal += interestOnExtra;
      }
    }

    this.totalAmount = principal;
  }

  async onSubmit() {
    if (this.renewForm.invalid) {
      this.renewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(this.loanService.renewLoan(this.loan._id, {
        ...this.renewForm.value,
        extraAmount: Number(this.renewForm.value.extraAmount || 0),
        installmentPeriod: Number(this.renewForm.value.installmentPeriod),
        interestRate: Number(this.renewForm.value.interestRate),
        totalAmount: this.totalAmount
      }));
      this.isSubmitting = false;
      this.modalCtrl.dismiss({ success: true });
    } catch (error: any) {
      this.isSubmitting = false;
      const toast = await this.toastCtrl.create({ message: error?.error?.message || 'Failed to renew loan.', duration: 3500, color: 'danger' });
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

  calculateInterest(amount: number): number {
    const rate = Number(this.renewForm.get('interestRate')?.value || 0);
    const period = Number(this.renewForm.get('installmentPeriod')?.value || 0);
    return Number(amount || 0) * (rate / 100) * period;
  }
}
