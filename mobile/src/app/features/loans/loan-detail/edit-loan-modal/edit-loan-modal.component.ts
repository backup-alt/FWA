import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { Loan, LoanUpdateRequest, Vehicle } from '../../../../core/models/loan.model';
import { LoanService } from '../../../../core/services/loan.service';

@Component({
  selector: 'app-edit-loan-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './edit-loan-modal.component.html',
  styleUrls: ['./edit-loan-modal.component.scss']
})
export class EditLoanModalComponent implements OnInit {
  @Input({ required: true }) loan!: Loan;
  saving = false;

  form = this.fb.group({
    loanAccountNumber: [''],
    loanAmount: [0, [Validators.required, Validators.min(1)]],
    installmentPeriod: [1, [Validators.required, Validators.min(1)]],
    installmentPeriodUnit: ['Months', Validators.required],
    interestRate: [0, [Validators.required, Validators.min(0)]],
    salesDoneBy: [''],
    vehicles: this.fb.array([])
  });

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loanService: LoanService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.form.patchValue({
      loanAccountNumber: this.loan.loanAccountNumber,
      loanAmount: this.loan.loanAmount,
      installmentPeriod: this.loan.installmentPeriod,
      installmentPeriodUnit: this.loan.installmentPeriodUnit,
      interestRate: this.loan.interestRate,
      salesDoneBy: this.loan.salesDoneBy
    });
    const vehicles = this.loan.vehicles?.length ? this.loan.vehicles : [this.primaryVehicle()];
    vehicles.forEach(vehicle => this.vehicles.push(this.createVehicle(vehicle)));
  }

  get vehicles(): FormArray {
    return this.form.controls.vehicles;
  }

  addVehicle() {
    this.vehicles.push(this.createVehicle());
  }

  removeVehicle(index: number) {
    if (this.vehicles.length > 1) this.vehicles.removeAt(index);
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value = this.form.getRawValue();
    const vehicles = value.vehicles as Vehicle[];
    const primary = vehicles[0];
    const payload: LoanUpdateRequest = {
      loanAccountNumber: value.loanAccountNumber || undefined,
      loanAmount: Number(value.loanAmount),
      installmentPeriod: Number(value.installmentPeriod),
      installmentPeriodUnit: value.installmentPeriodUnit as Loan['installmentPeriodUnit'],
      interestRate: Number(value.interestRate),
      salesDoneBy: value.salesDoneBy || undefined,
      vehicles,
      vehicleType: primary.vehicleType,
      make: primary.make,
      model: primary.model,
      regNo: primary.regNo,
      noc: primary.noc,
      insurance: primary.insurance,
      keyStatus: primary.keyStatus
    };
    try {
      const updated = await firstValueFrom(this.loanService.update(this.loan._id, payload));
      await this.modalCtrl.dismiss({ success: true, loan: updated });
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.error?.message || 'Could not update loan',
        duration: 4000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.saving = false;
    }
  }

  private createVehicle(vehicle: Partial<Vehicle> = {}) {
    return this.fb.group({
      vehicleType: [vehicle.vehicleType || 'Bike', Validators.required],
      regNo: [vehicle.regNo || '', Validators.required],
      make: [vehicle.make || '', Validators.required],
      model: [vehicle.model || '', Validators.required],
      rcStatus: [vehicle.rcStatus || ''],
      noc: [vehicle.noc || 'NA'],
      insurance: [vehicle.insurance || 'NA'],
      keyStatus: [vehicle.keyStatus || 'Not Given']
    });
  }

  private primaryVehicle(): Vehicle {
    return {
      vehicleType: this.loan.vehicleType,
      regNo: this.loan.regNo,
      make: this.loan.make,
      model: this.loan.model,
      rcStatus: this.loan.rcDetails?.status || '',
      noc: this.loan.noc,
      insurance: this.loan.insurance,
      keyStatus: this.loan.keyStatus
    };
  }
}
