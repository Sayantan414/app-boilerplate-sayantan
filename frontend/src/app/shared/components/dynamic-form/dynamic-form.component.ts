import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'date' | 'datetime' | 'autocomplete' | 'radio';
  placeholder?: string;
  value?: any;
  validators?: any[];
  options?: { label: string; value: any }[];
  colSpan?: number; // Column span in our grid layout
  maxlength?: number;
  filter?: 'numeric' | 'decimal';
  readonly?: boolean;
  suffix?: string;
  suffixIcon?: string;
  suffixTooltip?: string;
  show?: (form: FormGroup) => boolean; // Optional dynamic visibility predicate
}

@Component({
  selector: 'ui-dynamic-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatTooltipModule
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent {
  formGroup = input<FormGroup>();
  fields = input.required<FormFieldConfig[]>();
  columns = input<number>(2); // Number of columns in the grid layout
  onSuffixClick = output<string>();

  // Tracks visibility of individual password fields
  private hidePasswords = signal<{ [key: string]: boolean }>({});

  isPasswordHidden(key: string): boolean {
    const hiddenMap = this.hidePasswords();
    return hiddenMap[key] !== false; // Defaults to true (hidden)
  }

  togglePasswordVisibility(key: string, event: Event) {
    event.stopPropagation();
    this.hidePasswords.update(map => ({
      ...map,
      [key]: !this.isPasswordHidden(key)
    }));
  }

  onInputFilter(event: Event, field: FormFieldConfig) {
    const input = event.target as HTMLInputElement;
    if (field.filter === 'numeric') {
      const sanitized = input.value.replace(/[^0-9]/g, '');
      input.value = sanitized;
      this.formGroup()?.get(field.key)?.setValue(sanitized, { emitEvent: false });
    } else if (field.filter === 'decimal') {
      let value = input.value.replace(/[^0-9.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1]?.length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
      input.value = value;
      this.formGroup()?.get(field.key)?.setValue(value, { emitEvent: false });
    }
  }

  shouldShowField(field: FormFieldConfig): boolean {
    if (field.show && this.formGroup()) {
      return field.show(this.formGroup()!);
    }
    return true;
  }

  getFilteredOptions(field: FormFieldConfig): { label: string; value: any }[] {
    if (!field.options) return [];
    
    // For reactive form group
    const controlValue = this.formGroup() ? this.formGroup()!.get(field.key)?.value : field.value;
    
    if (!controlValue || typeof controlValue !== 'string') {
      return field.options;
    }
    
    const filterValue = controlValue.toLowerCase();
    return field.options.filter(option => option.label.toLowerCase().includes(filterValue));
  }
}
