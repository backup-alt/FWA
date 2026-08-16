import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ReportsPage } from './reports.page';
import { ReportDownloadPage } from './report-download/report-download.page';

const routes: Routes = [{ path: 'download', component: ReportDownloadPage }, { path: '', component: ReportsPage }];

@NgModule({ imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)], declarations: [ReportsPage, ReportDownloadPage] })
export class ReportsModule {}
