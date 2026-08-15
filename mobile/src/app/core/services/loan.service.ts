import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Loan,
  LoanCreateRequest,
  LoanUpdateRequest,
  RecordPaymentRequest,
  CloseLoanRequest,
  RestructureLoanRequest,
  RenewLoanRequest,
  DocumentUploadRequest,
  PendingDue,
  PendingDuesSummary,
  LoanSummary,
  ReportResponse,
  LoanListParams,
  PendingDuesParams,
  ReportParams,
  PaginatedResponse
} from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private baseUrl = `${environment.apiBaseUrl}/loans`;

  constructor(private http: HttpClient) {}

  list(params: LoanListParams = {}): Observable<PaginatedResponse<Loan>> {
    return this.http.get<PaginatedResponse<Loan>>(this.baseUrl, { params: this.cleanParams(params) });
  }

  get(id: string): Observable<Loan> {
    return this.http.get<Loan>(`${this.baseUrl}/${id}`);
  }

  create(data: LoanCreateRequest): Observable<Loan> {
    return this.http.post<Loan>(this.baseUrl, data);
  }

  update(id: string, data: LoanUpdateRequest): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  recordPayment(loanId: string, installmentNo: number, data: RecordPaymentRequest): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}/${loanId}/installments/${installmentNo}`, data);
  }

  closeLoan(loanId: string, data: CloseLoanRequest): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}/${loanId}/close`, data);
  }

  restructureLoan(loanId: string, data: RestructureLoanRequest): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}/${loanId}/restructure`, data);
  }

  renewLoan(loanId: string, data: RenewLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.baseUrl}/${loanId}/renew`, data);
  }

  uploadDocument(loanId: string, data: DocumentUploadRequest): Observable<{ _id: string; name: string; type: string; fileId: string; url: string; uploadedAt: string }> {
    return this.http.post<any>(`${this.baseUrl}/${loanId}/documents`, data);
  }

  deleteDocument(loanId: string, docId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${loanId}/documents/${docId}`);
  }

  getDocumentFile(loanId: string, docId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${loanId}/documents/${docId}/file`, { responseType: 'blob' });
  }

  getPendingDues(params: PendingDuesParams = {}): Observable<PaginatedResponse<PendingDue>> {
    return this.http.get<PaginatedResponse<PendingDue>>(`${this.baseUrl}/pending-dues`, { params: this.cleanParams(params) });
  }

  getPendingDuesSummary(): Observable<PendingDuesSummary> {
    return this.http.get<PendingDuesSummary>(`${this.baseUrl}/pending-dues/summary`);
  }

  getSummary(vehicleType?: string): Observable<LoanSummary> {
    const params: Record<string, string> = {};
    if (vehicleType) params['vehicleType'] = vehicleType;
    return this.http.get<LoanSummary>(`${this.baseUrl}/summary`, { params });
  }

  getReport(params: ReportParams): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.baseUrl}/report`, { params: this.cleanParams(params) });
  }

  getVehicleTypeCounts(): Observable<{ counts: { Bike: number; Car: number; Auto: number } }> {
    return this.http.get<{ counts: { Bike: number; Car: number; Auto: number } }>(`${this.baseUrl}/vehicle-type-counts`);
  }

  private cleanParams(params: object): Record<string, string> {
    const clean: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        clean[key] = String(value);
      }
    });
    return clean;
  }
}
