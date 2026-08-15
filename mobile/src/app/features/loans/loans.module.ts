import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoanListPage } from './loan-list/loan-list.page';
import { LoanDetailPage } from './loan-detail/loan-detail.page';

const routes: Routes = [
  {
    path: '',
    component: LoanListPage
  },
  {
    path: 'add',
    loadComponent: () => import('./add-loan/add-loan.page').then(m => m.AddLoanPage)
  },
  {
    path: ':id',
    component: LoanDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [LoanListPage, LoanDetailPage]
})
export class LoansModule {}
