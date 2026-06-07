import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

// Shared Components
import { ButtonComponent } from './components/button/button.component';
import { ModalComponent } from './components/modal/modal.component';
import { TableComponent } from './components/table/table.component';
import { TableSkeletonComponent } from './components/table-skeleton/table-skeleton.component';
import { DrawerComponent } from './components/drawer/drawer.component';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';
import {MatRadioModule} from '@angular/material/radio';

const COMMON_MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatOptionModule,
  MatCheckboxModule,
  MatIconModule,
  MatRadioModule,
  ButtonComponent,
  ModalComponent,
  TableComponent,
  TableSkeletonComponent,
  DrawerComponent,
  DynamicFormComponent
];

@NgModule({
  imports: [...COMMON_MODULES],
  exports: [...COMMON_MODULES]
})
export class SharedModule { }
