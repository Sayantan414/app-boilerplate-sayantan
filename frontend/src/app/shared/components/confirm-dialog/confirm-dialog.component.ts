import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  confirmColor: 'primary' | 'destructive' | 'outline' | 'ghost';
  cancelText?: string;
}

@Component({
  selector: 'ui-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ModalComponent],
  template: `
    <ui-modal [isOpen]="isOpen()" [title]="data()?.title || 'Confirm'" (onClose)="onCancel.emit()">
      <div class="py-4 flex gap-4 items-start">
        @if (data()?.confirmColor === 'destructive') {
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-destructive/10 text-destructive">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </div>
        } @else {
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16.01"/></svg>
          </div>
        }
        <div class="flex-1">
          <p class="text-muted-foreground leading-relaxed text-[0.9375rem] m-0">{{ data()?.message }}</p>
        </div>
      </div>
      
      <div footer class="flex justify-end gap-3 w-full">
        <ui-button variant="ghost" (click)="onCancel.emit()">
          {{ data()?.cancelText || 'Cancel' }}
        </ui-button>
        <ui-button [variant]="data()?.confirmColor || 'primary'" (click)="onConfirm.emit()">
          {{ data()?.confirmText || 'Confirm' }}
        </ui-button>
      </div>
    </ui-modal>
  `
})
export class ConfirmDialogComponent {
  isOpen = input<boolean>(false);
  data = input<ConfirmDialogData | null>(null);
  
  onConfirm = output<void>();
  onCancel = output<void>();
}
