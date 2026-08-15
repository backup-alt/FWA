import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, ToastController, IonInput, IonSelect, IonSelectOption, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Loan } from '../../../../core/models/loan.model';
import { LoanService } from '../../../../core/services/loan.service';

@Component({
  selector: 'app-restructure-loan-modal',
  templateUrl: './restructure-loan-modal.component.html',
  styleUrls: ['./restructure-loan-modal.component.scss'],
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
    IonSpinner
  ]
})
export class RestructureLoanModalComponent implements OnInit {
  @Input() loan!: Loan;

  restructureForm: FormGroup;
  isSubmitting = false;
  currentEmi = 0;
  currentPeriod = 0;
  newEmi = 0;
  newPeriod = 0;

  restructureModes = [
    { value: 'lower-emi', label: 'Lower EMI', description: 'Reduce the monthly EMI amount, extending the loan period' },
    { value: 'shorten-period', label: 'Shorten Period', description: 'Reduce the loan period, increasing the monthly EMI amount' }
  ];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loanService: LoanService,
    private toastCtrl: ToastController
  ) {
    this.restructureForm = this.fb.group({
      mode: ['lower-emi', Validators.required],
      targetValue: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.currentEmi = this.loan?.emiAmount || 0;
    this.currentPeriod = this.loan?.installmentPeriod || 0;

    this.restructureForm.get('mode')?.valueChanges.subscribe(mode => {
      this.restructureForm.get('targetValue')?.setValue('');
      this.updatePreview();
    });

    this.restructureForm.get('targetValue')?.valueChanges.subscribe(() => {
      this.updatePreview();
    });
  }

  updatePreview() {
    const mode = this.restructureForm.get('mode')?.value;
    const targetValue = parseFloat(this.restructureForm.get('targetValue')?.value);

    if (!targetValue || isNaN(targetValue)) {
      this.newEmi = 0;
      this.newPeriod = 0;
      return;
    }

    if (mode === 'lower-emi') {
      // Target is new EMI
      this.newEmi = targetValue;
      // Calculate new period based on outstanding principal and interest
      const outstanding = this.loan?.outstandingPrincipal || 0;
      const interestRate = this.loan?.interestRate || 0;
      if (this.newEmi > 0 && outstanding > 0) {
        const monthlyRate = interestRate / 100 / 12;
        if (monthlyRate > 0) {
          this.newPeriod = Math.ceil(Math.log(1 + (outstanding * monthlyRate) / this.newEmi) / Math.log(1 + monthlyRate));
        } else {
          this.newPeriod = Math.ceil(outstanding / this.newEmi);
        }
      }
    } else {
      // Target is new period
      this.newPeriod = targetValue;
      // Calculate new EMI
      const outstanding = this.loan?.outstandingPrincipal || 0;
      const interestRate = this.loan?.interestRate || 0;
      if (this.newPeriod > 0 && outstanding > 0) {
        const monthlyRate = interestRate / 100 / 12;
        if (monthlyRate > 0) {
          this.newEmi = Math.round(outstanding * monthlyRate * Math.pow(1 + monthlyRate, this.newPeriod) / (Math.pow(1 + monthlyRate, this.newPeriod) - 1));
        } else {
          this.newEmi = Math.round(outstanding / this.newPeriod);
        }
      }
    }
  }

  async onSubmit() {
    if (this.restructureForm.invalid) {
      this.restructureForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(this.loanService.restructureLoan(this.loan._id, {
        mode: this.restructureForm.value.mode,
        targetValue: Number(this.restructureForm.value.targetValue)
      }));
      this.isSubmitting = false;
      this.modalCtrl.dismiss({ success: true });
    } catch (error: any) {
      this.isSubmitting = false;
      const toast = await this.toastCtrl.create({ message: error?.error?.message || 'Failed to restructure loan.', duration: 3500, color: 'danger' });
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

  getModeLabel(mode: string): string {
    return this.restructureModes.find(m => m.value === mode)?.label || mode;
  }

  getModeDescription(): string {
    const mode = this.restructureForm.get('mode')?.value;
    return this.restructureModes.find(item => item.value === mode)?.description || '';
  }

  absolute(value: number): number {
    return Math.abs(Number(value || 0));
  }
}
