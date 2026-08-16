import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DueRow, InstallmentStatus, PaymentRow, ReportParams, ReportResponse, VehicleType } from '../../../core/models/loan.model';
import { LoanService } from '../../../core/services/loan.service';
import { exportReportFile, ReportExportFormat, ReportExportScope } from '../../../core/utils/report-export';

@Component({ selector: 'app-report-download', templateUrl: './report-download.page.html', styleUrls: ['./report-download.page.scss'], standalone: false })
export class ReportDownloadPage implements OnInit {
  activeTab: ReportExportScope = 'all';
  report: ReportResponse | null = null;
  isLoading = true;
  exporting = '';
  private paramsValue!: ReportParams;

  constructor(private route: ActivatedRoute, private router: Router, private loanService: LoanService, private toastCtrl: ToastController) {}

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const dateMode = query.get('dateMode') === 'range' ? 'range' : 'single';
    const today = new Date().toISOString().slice(0, 10);
    const selected = query.get('selectedDate') || today;
    this.paramsValue = {
      startDate: dateMode === 'single' ? selected : (query.get('fromDate') || selected),
      endDate: dateMode === 'single' ? selected : (query.get('toDate') || selected),
      tab: 'all',
      status: (query.get('status') || undefined) as InstallmentStatus | undefined,
      vehicleType: (query.get('vehicleType') || undefined) as VehicleType | undefined,
      customerSearch: query.get('customerSearch') || undefined,
      regNo: query.get('regNo') || undefined,
      fileId: query.get('fileId') || undefined
    };
    void this.loadReport();
  }

  async loadReport(): Promise<void> {
    this.isLoading = true;
    try {
      let page = 1;
      const paid: PaymentRow[] = [];
      const due: DueRow[] = [];
      let latest: ReportResponse | null = null;
      do {
        latest = await firstValueFrom(this.loanService.getReport({ ...this.paramsValue, page, pageSize: 200, download: true }));
        paid.push(...latest.paid.data);
        due.push(...latest.due.data);
        page += 1;
      } while (latest && (latest.paid.hasMore || latest.due.hasMore) && page <= 100);
      if (!latest) throw new Error('No report response');
      this.report = { filters: latest.filters, paid: { ...latest.paid, data: paid, hasMore: false }, due: { ...latest.due, data: due, hasMore: false } };
    } catch (error) {
      console.error('Could not prepare report', error);
      await this.showError('Could not prepare the downloadable report.');
    } finally { this.isLoading = false; }
  }

  async download(scope: ReportExportScope, format: ReportExportFormat): Promise<void> {
    if (!this.report || this.exporting) return;
    this.exporting = `${scope}-${format}`;
    try {
      const message = await exportReportFile(this.report, this.title, scope, format);
      await this.showSuccess(message);
    }
    catch (error) { console.error('Report export failed', error); await this.showError(`Could not create the ${format.toUpperCase()} report.`); }
    finally { this.exporting = ''; }
  }

  onBack(): void { void this.router.navigate(['/reports']); }
  setTab(tab: ReportExportScope): void { this.activeTab = tab; }
  formatCurrency(value: number): string { return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`; }
  get title(): string { return `Complete Payment Report - ${this.displayDate(this.paramsValue.startDate)}${this.paramsValue.startDate === this.paramsValue.endDate ? '' : ` to ${this.displayDate(this.paramsValue.endDate)}`}`; }
  get previewRows(): Array<PaymentRow | DueRow> { if (!this.report) return []; return this.activeTab === 'due' ? this.report.due.data.slice(0, 30) : this.activeTab === 'paid' ? this.report.paid.data.slice(0, 30) : [...this.report.due.data, ...this.report.paid.data].slice(0, 30); }
  get selectedCount(): number { if (!this.report) return 0; return this.activeTab === 'due' ? this.report.due.count : this.activeTab === 'paid' ? this.report.paid.count : this.report.due.count + this.report.paid.count; }
  private displayDate(value: string): string { return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  private async showError(message: string): Promise<void> { const toast = await this.toastCtrl.create({ message, duration: 3500, color: 'danger' }); await toast.present(); }
  private async showSuccess(message: string): Promise<void> { const toast = await this.toastCtrl.create({ message, duration: 3000, color: 'success' }); await toast.present(); }
}
