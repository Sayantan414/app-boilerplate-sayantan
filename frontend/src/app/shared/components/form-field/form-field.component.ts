import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative mb-2 w-full">
      <div [class]="getInputWrapperClasses()">
        <label [class]="getLabelClasses()">{{ label() }}</label>
        <input 
          [type]="type()" 
          [(ngModel)]="value" 
          (focus)="isFocused = true" 
          (blur)="isFocused = false"
          class="w-full border-none bg-transparent text-[0.9375rem] text-foreground outline-none p-0"
          [placeholder]="isFocused ? placeholder() : ''"
        >
      </div>
      @if (error()) {
        <span class="text-xs text-destructive mt-1 ml-3.5 block">{{ error() }}</span>
      }
    </div>
  `
})
export class FormFieldComponent {
  label = input.required<string>();
  type = input<string>('text');
  placeholder = input<string>('');
  error = input<string | null>(null);
  value = model<string>('');

  isFocused = false;

  getInputWrapperClasses(): string {
    return `relative bg-transparent border rounded-md transition-all duration-200 flex items-center ${
      this.isFocused 
        ? 'border-primary border-2 px-3 py-[11px]' 
        : 'border-input hover:border-foreground/40 px-3.5 py-3'
    }`;
  }

  getLabelClasses(): string {
    const isActive = this.isFocused || this.value();
    return `absolute pointer-events-none transition-all duration-200 px-1 ${
      isActive 
        ? 'top-0 left-2 -translate-y-1/2 scale-[0.85] font-semibold bg-card ' + (this.isFocused ? 'text-primary' : 'text-muted-foreground')
        : 'top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'
    }`;
  }
}
