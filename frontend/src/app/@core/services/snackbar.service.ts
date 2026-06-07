import { Injectable, signal } from '@angular/core';

export type SnackbarType = 'success' | 'error' | 'info';

export interface SnackbarData {
  id: number;
  message: string;
  type: SnackbarType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  toasts = signal<SnackbarData[]>([]);
  private counter = 0;

  show(message: string, type: SnackbarType = 'info', duration: number = 3000): number {
    const id = this.counter++;
    const toast: SnackbarData = { id, message, type, duration };
    
    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
    return id;
  }

  success(message: string, duration?: number): number {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): number {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): number {
    return this.show(message, 'info', duration);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
