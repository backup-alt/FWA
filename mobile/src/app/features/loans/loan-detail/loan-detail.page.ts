import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonSegment, ModalController, ActionSheetController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { firstValueFrom, Subscription } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { Loan, Installment, Document, Vehicle, VehicleType, InstallmentStatus, PaymentType } from '../../../core/models/loan.model';
import { LayoutService } from '../../../core/services/layout.service';
import { RecordPaymentModalComponent } from './record-payment-modal/record-payment-modal.component';
import { CloseLoanModalComponent } from './close-loan-modal/close-loan-modal.component';
import { RestructureLoanModalComponent } from './restructure-loan-modal/restructure-loan-modal.component';
import { RenewLoanModalComponent } from './renew-loan-modal/renew-loan-modal.component';
import { EditLoanModalComponent } from './edit-loan-modal/edit-loan-modal.component';

@Component({
  selector: 'app-loan-detail',
  templateUrl: './loan-detail.page.html',
  styleUrls: ['./loan-detail.page.scss'],
  standalone: false
})
export class LoanDetailPage implements OnInit, OnDestroy {
  @ViewChild(IonSegment) segment!: IonSegment;

  loanId = '';
  loan: Loan | null = null;
  isLoading = true;

  // Tabs data
  activeTab = 'schedule';
  installments: Installment[] = [];
  installmentsPage = 1;
  installmentsPageSize = 50;
  installmentsHasMore = true;
  payments: any[] = [];
  paymentsPage = 1;
  paymentsPageSize = 20;
  paymentsHasMore = true;
  documents: Document[] = [];
  history: any[] = [];
  documentPreviewUrl = '';
  documentPreviewName = '';

  private subscriptions = new Subscription();
  private handledInitialAction = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private layoutService: LayoutService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.layoutService.setActiveTab('customers');
    this.loanId = this.route.snapshot.paramMap.get('id') || '';
    if (this.loanId) {
      this.loadLoan();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadLoan() {
    try {
      this.loan = await firstValueFrom(this.loanService.get(this.loanId));
      this.loadInstallments(true);
      this.loadDocuments();
      this.loadHistory();
      if (!this.handledInitialAction && this.route.snapshot.queryParamMap.get('action') === 'payment') {
        this.handledInitialAction = true;
        const installmentNo = Number(this.route.snapshot.queryParamMap.get('installment'));
        const installment = this.loan.installments.find(item => item.sNo === installmentNo);
        if (installment) await this.onRecordPaymentFor(installment);
      }
    } catch (error) {
      console.error('Failed to load loan:', error);
      this.showErrorToast('Failed to load loan details');
      this.router.navigate(['/loans']);
    } finally {
      this.isLoading = false;
    }
  }

  async loadInstallments(refresh = false) {
    if (refresh) {
      this.installmentsPage = 1;
      this.installments = [];
      this.installmentsHasMore = true;
    }

    // Installments are part of the loan object, no separate API call needed
    if (this.loan?.installments) {
      this.installments = [...this.loan.installments].sort((a, b) => a.sNo - b.sNo);
      this.installmentsHasMore = false;
    }
  }

  async loadDocuments() {
    if (this.loan?.documents) {
      this.documents = [...this.loan.documents].sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    }
  }

  async loadHistory() {
    // Build history from installments and restructure log
    if (this.loan) {
      const historyItems: any[] = [];

      // Add installment payments
      this.loan.installments?.forEach(inst => {
        if (inst.status === 'Paid' || inst.status === 'Partial') {
          inst.paymentHistory?.forEach(ph => {
            historyItems.push({
              type: 'payment',
              date: ph.date,
              description: `Installment #${inst.sNo} - ${ph.paymentType || 'Cash'} payment`,
              amount: ph.amount,
              collector: ph.collector
            });
          });
        }
      });

      // Add restructure logs
      this.loan.restructureLog?.forEach(log => {
        historyItems.push({
          type: 'restructure',
          date: log.date,
          description: `Restructured (${log.mode === 'lower-emi' ? 'Lower EMI' : 'Shorten Period'})`,
          oldEmi: log.oldEmi,
          newEmi: log.newEmi,
          oldPeriod: log.oldPeriod,
          newPeriod: log.newPeriod,
          lumpSumApplied: log.lumpSumApplied
        });
      });

      // Add closure
      if (this.loan.closureInfo?.closureDate) {
        historyItems.push({
          type: 'closure',
          date: this.loan.closureInfo.closureDate,
          description: `Loan closed - ${this.loan.closureInfo.reason}`,
          amount: this.loan.closureInfo.amountReceived,
          remarks: this.loan.closureInfo.remarks
        });
      }

      // Add renewal
      if (this.loan.isRenewal && this.loan.renewedFromLoanId) {
        historyItems.push({
          type: 'renewal',
          date: this.loan.createdAt,
          description: `Renewed from loan ${this.loan.renewedFromLoanId}`,
          extraAmount: this.loan.loanAmount - (this.loan.outstandingPrincipal || 0)
        });
      }

      this.history = historyItems.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  }

  async doRefresh(event: any) {
    await this.loadLoan();
    event.target.complete();
  }

  onTabChange(event: any) {
    this.activeTab = event.detail.value;
  }

  // Navigation
  onBack() {
    this.router.navigate(this.loan?.customerId ? ['/customers', this.loan.customerId] : ['/loans']);
  }

  // Actions
  async onRecordPayment() {
    if (!this.loan) return;

    const pendingInstallments = this.loan.installments?.filter(i =>
      i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial'
    ) || [];

    if (pendingInstallments.length === 0) {
      this.showInfoToast('No pending installments to pay');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: RecordPaymentModalComponent,
      componentProps: {
        loan: this.loan,
        installments: pendingInstallments
      },
      cssClass: 'ram-modal-fullscreen',
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadLoan();
        this.showSuccessToast('Payment recorded successfully');
      }
    });

    await modal.present();
  }

  async onRecordPaymentFor(installment: Installment) {
    if (!this.loan) return;
    const modal = await this.modalCtrl.create({
      component: RecordPaymentModalComponent,
      componentProps: { loan: this.loan, installments: [installment] },
      cssClass: 'ram-modal-fullscreen',
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9
    });
    modal.onDidDismiss().then(result => {
      if (result.data?.success) this.loadLoan();
    });
    await modal.present();
  }

  async onEditLoan() {
    if (!this.loan) return;
    const modal = await this.modalCtrl.create({
      component: EditLoanModalComponent,
      componentProps: { loan: this.loan },
      cssClass: 'ram-modal-fullscreen'
    });
    modal.onDidDismiss().then(result => {
      if (result.data?.success) {
        this.loadLoan();
        this.showSuccessToast('Loan updated successfully');
      }
    });
    await modal.present();
  }

  async onCloseLoan() {
    if (!this.loan) return;

    const modal = await this.modalCtrl.create({
      component: CloseLoanModalComponent,
      componentProps: { loan: this.loan },
      cssClass: 'ram-modal-fullscreen',
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadLoan();
        this.showSuccessToast('Loan closed successfully');
      }
    });

    await modal.present();
  }

  async onRestructureLoan() {
    if (!this.loan) return;

    const modal = await this.modalCtrl.create({
      component: RestructureLoanModalComponent,
      componentProps: { loan: this.loan },
      cssClass: 'ram-modal-fullscreen',
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadLoan();
        this.showSuccessToast('Loan restructured successfully');
      }
    });

    await modal.present();
  }

  async onRenewLoan() {
    if (!this.loan) return;

    const modal = await this.modalCtrl.create({
      component: RenewLoanModalComponent,
      componentProps: { loan: this.loan },
      cssClass: 'ram-modal-fullscreen',
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.loadLoan();
        this.showSuccessToast('Loan renewed successfully');
      }
    });

    await modal.present();
  }

  async onMoreActions() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Loan Actions',
      buttons: [
        {
          text: 'Edit Loan',
          icon: 'create-outline',
          handler: () => this.onEditLoan()
        },
        {
          text: 'Record Payment',
          icon: 'cash-outline',
          handler: () => this.onRecordPayment()
        },
        {
          text: 'Restructure',
          icon: 'settings-outline',
          handler: () => this.onRestructureLoan()
        },
        {
          text: 'Renew Loan',
          icon: 'refresh-outline',
          handler: () => this.onRenewLoan()
        },
        {
          text: 'Close Loan',
          icon: 'lock-closed-outline',
          role: 'destructive',
          handler: () => this.onCloseLoan()
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // Helpers
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

  getVehicles(): Vehicle[] {
    if (this.loan?.vehicles?.length) return this.loan.vehicles;
    if (!this.loan) return [];
    return [{
      vehicleType: this.loan.vehicleType, make: this.loan.make, model: this.loan.model, regNo: this.loan.regNo,
      rcStatus: this.loan.rcDetails?.status || '', noc: this.loan.noc, insurance: this.loan.insurance, keyStatus: this.loan.keyStatus
    }];
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

  getInstallmentStatusClass(status: InstallmentStatus): string {
    switch (status) {
      case 'Paid': return 'ram-installment-paid';
      case 'Partial': return 'ram-installment-partial';
      case 'Overdue': return 'ram-installment-overdue';
      case 'Cancelled': return 'ram-installment-cancelled';
      default: return 'ram-installment-pending';
    }
  }

  getInstallmentStatusIcon(status: InstallmentStatus): string {
    switch (status) {
      case 'Paid': return 'checkmark-circle-outline';
      case 'Partial': return 'remove-circle-outline';
      case 'Overdue': return 'alert-circle-outline';
      case 'Cancelled': return 'close-circle-outline';
      default: return 'time-outline';
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  getTotalPaid(): number {
    return this.loan?.installments?.reduce((sum, i) => sum + (i.amountReceived || 0), 0) || 0;
  }

  getTotalPending(): number {
    return Number(this.loan?.outstandingPrincipal || 0);
  }

  getOverdueCount(): number {
    return this.loan?.installments?.filter(i => i.status === 'Overdue').length || 0;
  }

  getPaidCount(): number {
    return this.loan?.installments?.filter(i => i.status === 'Paid').length || 0;
  }

  getTotalInstallments(): number {
    return this.loan?.installments?.length || 0;
  }

  getProgress(): number {
    const total = this.getTotalInstallments();
    if (total === 0) return 0;
    return Math.round((this.getPaidCount() / total) * 100);
  }

  getInstallmentProgress(installment: Installment): number {
    if (installment.dueAmount === 0) return 0;
    return Math.min(100, Math.round((installment.amountReceived / installment.dueAmount) * 100));
  }

  getPaymentTypeLabel(type: PaymentType): string {
    return type || 'Cash';
  }

  getPaymentTypeIcon(type: PaymentType): string {
    switch (type) {
      case 'UPI': return 'qr-code-outline';
      case 'Bank Transfer': return 'card-outline';
      case 'Cheque': return 'document-text-outline';
      case 'Cash':
      default: return 'cash-outline';
    }
  }

  getPaymentHistory(): Installment[] {
    return this.installments
      .filter(installment => (installment.amountReceived || 0) > 0 && !!installment.dateReceived)
      .sort((a, b) => new Date(b.dateReceived || 0).getTime() - new Date(a.dateReceived || 0).getTime());
  }

  async onUploadDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        await this.showErrorToast('Document must be smaller than 8 MB');
        return;
      }
      const loading = await this.loadingCtrl.create({ message: 'Uploading document…' });
      await loading.present();
      try {
        const data = await this.readFileAsDataUrl(file);
        await firstValueFrom(this.loanService.uploadDocument(this.loanId, {
          name: file.name,
          type: file.type || 'application/octet-stream',
          data
        }));
        await this.loadLoan();
        await this.showSuccessToast('Document uploaded');
      } catch (error) {
        console.error('Document upload failed:', error);
        await this.showErrorToast('Could not upload document');
      } finally {
        await loading.dismiss();
      }
    };
    input.click();
  }

  async openDocument(doc: Document) {
    try {
      const file = await firstValueFrom(this.loanService.getDocumentFile(this.loanId, doc._id));
      const url = URL.createObjectURL(file);
      if ((doc.type || file.type).startsWith('image/')) {
        this.closeDocumentPreview();
        this.documentPreviewUrl = url;
        this.documentPreviewName = doc.name;
        return;
      }
      window.open(url, '_blank', 'noopener');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error('Document open failed:', error);
      await this.showErrorToast('Could not open document');
    }
  }

  closeDocumentPreview(): void {
    if (this.documentPreviewUrl) URL.revokeObjectURL(this.documentPreviewUrl);
    this.documentPreviewUrl = '';
    this.documentPreviewName = '';
  }

  async deleteDocument(doc: Document) {
    const alert = await this.alertCtrl.create({
      header: 'Delete document?',
      message: doc.name,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.loanService.deleteDocument(this.loanId, doc._id));
              this.documents = this.documents.filter(item => item._id !== doc._id);
              await this.showSuccessToast('Document deleted');
            } catch (error) {
              console.error('Document delete failed:', error);
              await this.showErrorToast('Could not delete document');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getHistoryIcon(type: string): string {
    return ({ payment: 'cash-outline', restructure: 'settings-outline', closure: 'lock-closed-outline', renewal: 'refresh-outline' } as Record<string, string>)[type] || 'time-outline';
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'success', position: 'bottom' });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 4000, color: 'danger', position: 'bottom' });
    await toast.present();
  }

  private async showInfoToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'warning', position: 'bottom' });
    await toast.present();
  }
}
