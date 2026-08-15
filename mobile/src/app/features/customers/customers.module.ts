import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AddCustomerPage } from './add-customer/add-customer.page';
import { CustomerDetailPage } from './customer-detail/customer-detail.page';
import { CustomerListPage } from './customer-list/customer-list.page';

const routes: Routes = [
  { path: '', component: CustomerListPage },
  { path: 'add', component: AddCustomerPage },
  { path: ':id', component: CustomerDetailPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [CustomerListPage, CustomerDetailPage, AddCustomerPage]
})
export class CustomersModule {}
