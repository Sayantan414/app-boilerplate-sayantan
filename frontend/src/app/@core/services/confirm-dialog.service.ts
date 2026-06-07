import { Injectable, signal } from '@angular/core';
import { ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  isOpen = signal(false);
  data = signal<ConfirmDialogData | null>(null);
  private resolveCallback: ((value: boolean) => void) | null = null;

  confirm(data: ConfirmDialogData): Promise<boolean> {
    console.log('Opening confirm dialog:', data);
    this.data.set(data);
    this.isOpen.set(true);

    return new Promise((resolve) => {
      this.resolveCallback = resolve;
    });
  }

  handleConfirm() {
    this.isOpen.set(false);
    this.resolveCallback?.(true);
    this.resolveCallback = null;
  }

  handleCancel() {
    this.isOpen.set(false);
    this.resolveCallback?.(false);
    this.resolveCallback = null;
  }
}
