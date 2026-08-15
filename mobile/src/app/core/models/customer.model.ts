export interface CellNumber {
  number: string;
}

export interface Guarantor {
  name: string;
  address: string;
  mobile: string;
}

export interface Customer {
  _id: string;
  name: string;
  fileId?: string;
  address?: string;
  temporaryAddress?: string;
  monthlySalary?: number;
  cellNumbers: CellNumber[];
  guarantor?: Guarantor;
  profileImageFileId?: string;
  profileImage?: string;
  profileImageUrl?: string;
  idProofType?: string;
  idProofNumber?: string;
  idStatus?: 'Yes' | 'No' | '';
  createdAt?: string;
  updatedAt?: string;

  // Aggregation fields from list endpoint
  loanCount?: number;
  activeLoans?: number;
  renewedLoans?: number;
  closedLoans?: number;
  completedLoans?: number;
  totalOutstanding?: number;
  bikeCount?: number;
  carCount?: number;
  autoCount?: number;
  bikeRegNos?: string[];
  carRegNos?: string[];
  autoRegNos?: string[];
}

export interface CustomerCreateRequest {
  name: string;
  fileId?: string;
  address?: string;
  temporaryAddress?: string;
  monthlySalary?: number;
  cellNumbers: CellNumber[];
  guarantor?: Guarantor;
  profileImage?: string; // data URL or empty string
  idProofType?: string;
  idProofNumber?: string;
  idStatus?: 'Yes' | 'No' | '';
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CustomerSearchParams {
  search?: string;
  searchType?: 'name' | 'fileId' | 'phone' | 'regNo';
  page?: number;
  pageSize?: number;
}