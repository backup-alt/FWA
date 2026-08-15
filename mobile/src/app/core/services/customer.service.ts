import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, CustomerCreateRequest, CustomerUpdateRequest, CustomerSearchParams, PaginatedResponse } from '../models/customer.model';
import { Loan } from '../models/loan.model';

export interface CustomerDetailResponse {
  customer: Customer;
  loans: Loan[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseUrl = `${environment.apiBaseUrl}/customers`;

  constructor(private http: HttpClient) {}

  list(params: CustomerSearchParams = {}): Observable<PaginatedResponse<Customer>> {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    });
    return this.http.get<PaginatedResponse<Customer>>(this.baseUrl, { params: cleanParams });
  }

  get(id: string): Observable<CustomerDetailResponse> {
    return this.http.get<CustomerDetailResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: CustomerCreateRequest): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, data);
  }

  update(id: string, data: CustomerUpdateRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
