export type VehicleType = 'Bike' | 'Car' | 'Auto';
export type LoanStatus = 'Active' | 'Completed' | 'Closed' | 'Renewed';
export type InstallmentStatus = 'Pending' | 'Paid' | 'Partial' | 'Overdue' | 'Cancelled';
export type PaymentType = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other' | '';
export type InstallmentPeriodUnit = 'Months' | 'Weeks' | 'Days';
export type ClosureReason = 'Full Prepayment' | 'Foreclosure' | 'Write-off' | 'Settlement' | 'Waiver';
export type NocStatus = 'Received' | 'Not Received' | 'NA';
export type InsuranceStatus = 'Active' | 'Expired' | 'NA';
export type KeyStatus = 'Given' | 'Not Given' | 'Original' | 'Duplicate';

export interface RcDetails {
  status: string;
  paidThrough: string;
  chequeNumber: string;
  amount: number;
}

export interface Guarantor {
  name: string;
  address: string;
  mobile: string;
}

export interface CellNumber {
  number: string;
}

export interface Vehicle {
  vehicleType: VehicleType;
  make: string;
  model: string;
  regNo: string;
  rcStatus?: string;
  noc?: string;
  insurance?: string;
  idProofType?: string;
  idProofNumber?: string;
  keyStatus?: string;
}

export interface Cheque {
  chequeNumber: string;
  bank: string;
  amount: number;
}

export interface Installment {
  sNo: number;
  dueAmount: number;
  dueDate: string;
  amountReceived: number;
  dateReceived: string | null;
  sign: string;
  paymentType: PaymentType;
  status: InstallmentStatus;
  adjustment: number;
  pendingAmount: number;
  shortfallAmount: number;
  extraAmount: number;
  paymentHistory?: Array<{
    date: string;
    amount: number;
    collector: string;
    paymentType?: PaymentType;
  }>;
  remarks?: string;
  collector?: string;
}

export interface Document {
  _id: string;
  name: string;
  type: string;
  fileId: string;
  url: string;
  uploadedAt: string;
}

export interface ClosureInfo {
  reason: ClosureReason;
  remarks: string;
  amountReceived: number;
  closureDate: string | null;
}

export interface RestructureLogEntry {
  date: string;
  mode: 'lower-emi' | 'shorten-period';
  targetValue: number;
  lumpSumApplied?: number;
  oldOutstanding: number;
  newOutstanding: number;
  oldPeriod: number;
  newPeriod: number;
  oldEmi: number;
  newEmi: number;
}

export interface Loan {
  _id: string;
  customerId: string;
  customerName?: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  regNo: string;
  loanAccountNumber: string;
  loanAmount: number;
  financeAmount: number;
  rcDetails: RcDetails;
  noc: string;
  insurance: string;
  idProofType: string;
  idProofNumber: string;
  keyStatus: string;
  salesDoneBy: string;
  address: string;
  monthlySalary: number;
  cellNumbers: CellNumber[];
  guarantor: Guarantor;
  chequesReceived: Cheque[];
  loanStartDate: string;
  installmentPeriod: number;
  installmentPeriodUnit: InstallmentPeriodUnit;
  interestRate: number;
  interestAmount: number;
  emiAmount: number;
  installments: Installment[];
  documents: Document[];
  vehicles: Vehicle[];
  outstandingPrincipal: number;
  totalPaid: number;
  status: LoanStatus;
  completedAt: string | null;
  closureInfo: ClosureInfo;
  isRenewal: boolean;
  renewedFromLoanId: string | null;
  renewedToLoanId: string | null;
  restructureLog: RestructureLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanCreateRequest {
  customerId: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  regNo: string;
  loanAccountNumber?: string;
  loanAmount: number;
  financeAmount: number;
  rcDetails?: Partial<RcDetails>;
  noc?: string;
  insurance?: string;
  idProofType?: string;
  idProofNumber?: string;
  keyStatus?: string;
  salesDoneBy?: string;
  chequesReceived?: Cheque[];
  loanStartDate: string;
  installmentPeriod: number;
  installmentPeriodUnit: InstallmentPeriodUnit;
  interestRate: number;
  providedInstallments?: Installment[];
  providedStatus?: LoanStatus;
  providedCompletedAt?: string;
  vehicles?: Vehicle[];
}

export interface LoanUpdateRequest extends Partial<LoanCreateRequest> {}

export interface RecordPaymentRequest {
  sNo: number;
  dueAmount: number;
  dueDate: string;
  amountReceived: number;
  dateReceived: string | null;
  sign?: string;
  completed: boolean;
  paymentType?: PaymentType;
}

export interface CloseLoanRequest {
  closureReason: ClosureReason;
  closureRemarks: string;
  amountReceived: number;
  closureDate: string;
  updateOnly?: boolean;
}

export interface RestructureLoanRequest {
  mode: 'lower-emi' | 'shorten-period';
  targetValue: number;
}

export interface RenewLoanRequest {
  extraAmount: number;
  installmentPeriod: number;
  interestRate: number;
  renewalDate: string;
  closeExistingLoan: boolean;
  chargeInterestOnOutstanding: boolean;
  chargeInterestOnExtra: boolean;
  totalAmount: number;
}

export interface DocumentUploadRequest {
  name: string;
  type: string;
  data: string; // data URL
}

export interface PendingDue {
  loanId: string;
  customerId: string;
  customerFileId: string;
  customerName: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  regNo: string;
  sNo: number;
  dueAmount: number;
  dueDate: string;
  amountReceived: number;
  pendingAmount: number;
  shortfallAmount: number;
  outstandingForThisInstallment: number;
  daysOverdue: number;
  status: InstallmentStatus;
}

export interface PendingDuesSummary {
  count: number;
  totalOutstanding: number;
}

export interface LoanSummary {
  vehicleTypeCounts: { Bike: number; Car: number; Auto: number };
  monthlyCollections: Array<{ month: string; collected: number }>;
  totalOutstanding: number;
  totalCollected: number;
  overdueAmount: number;
  counts: {
    total: number;
    active: number;
    completed: number;
    closed: number;
    renewed: number;
    other: number;
    uniqueCustomers: number;
  };
}

export interface ReportResponse {
  filters: Record<string, unknown>;
  paid: ReportSection<PaymentRow>;
  due: ReportSection<DueRow>;
}

export interface ReportSection<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaymentRow {
  loanId: string;
  customerId: string;
  customerName: string;
  customerFileId: string;
  cellNumbers: string[];
  address: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  regNo: string;
  loanAmount: number;
  emiAmount: number;
  sNo: number;
  dueDate: string;
  dueAmount: number;
  amountReceived: number;
  dateReceived: string;
  status: InstallmentStatus;
  pendingAmount: number;
  daysOverdue: number;
  carryingOutstanding: number;
}

export interface DueRow extends PaymentRow {
  daysOverdue: number;
  dueAmount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LoanListParams {
  search?: string;
  vehicleType?: VehicleType;
  status?: LoanStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

export interface PendingDuesParams {
  vehicleType?: VehicleType;
  fileId?: string;
  minOverdueDays?: number;
  minAmount?: number;
  page?: number;
  pageSize?: number;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  tab?: 'paid' | 'due' | 'all';
  vehicleType?: VehicleType;
  status?: InstallmentStatus;
  customerSearch?: string;
  regNo?: string;
  fileId?: string;
  page?: number;
  pageSize?: number;
  download?: boolean;
}
