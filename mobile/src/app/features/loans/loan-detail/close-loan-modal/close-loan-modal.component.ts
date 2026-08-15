import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, ToastController, IonInput, IonSelect, IonSelectOption, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, IonTextarea } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Loan, ClosureReason } from '../../../../core/models/loan.model';
import { LoanService } from '../../../../core/services/loan.service';

@Component({
  selector: 'app-close-loan-modal',
  templateUrl: './close-loan-modal.component.html',
  styleUrls: ['./close-loan-modal.component.scss'],
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
    IonTextarea
  ]
})
export class CloseLoanModalComponent implements OnInit {
  @Input() loan!: Loan;

  closeForm: FormGroup;
  isSubmitting = false;
  readonly today = new Date().toISOString().split('T')[0];

  closureReasons: { value: ClosureReason; label: string }[] = [
    { value: 'Full Prepayment', label: 'Full Prepayment' },
    { value: 'Foreclosure', label: 'Foreclosure' },
    { value: 'Write-off', label: 'Write-off' },
    { value: 'Settlement', label: 'Settlement' },
    { value: 'Waiver', label: 'Waiver' }
  ];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loanService: LoanService,
    private toastCtrl: ToastController
  ) {
    this.closeForm = this.fb.group({
      closureReason: ['', Validators.required],
      closureRemarks: ['', Validators.required],
      amountReceived: ['', [Validators.required, Validators.min(0)]],
      closureDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit() {
    // Pre-fill with outstanding amount
    this.closeForm.patchValue({
      amountReceived: this.loan?.outstandingPrincipal || 0
    });
  }

  async onSubmit() {
    if (this.closeForm.invalid) {
      this.closeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(this.loanService.closeLoan(this.loan._id, {
        ...this.closeForm.value,
        amountReceived: Number(this.closeForm.value.amountReceived || 0)
      }));
      this.isSubmitting = false;
      this.modalCtrl.dismiss({ success: true });
    } catch (error: any) {
      this.isSubmitting = false;
      const toast = await this.toastCtrl.create({ message: error?.error?.message || 'Failed to close loan.', duration: 3500, color: 'danger' });
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
}
