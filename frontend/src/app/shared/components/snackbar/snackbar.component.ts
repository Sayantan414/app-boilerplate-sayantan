import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService, SnackbarData } from '../../../@core/services/snackbar.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'ui-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999] pointer-events-none">
      @for (toast of toasts(); track toast.id) {
        <div class="pointer-events-auto min-w-[300px] max-w-[450px] px-4 py-3 rounded-md bg-card border border-border shadow-lg flex items-center gap-3 text-foreground relative overflow-hidden pl-5" @slideInOut>
          <div class="absolute left-0 top-0 bottom-0 w-1" [class]="getToastBarClass(toast.type)"></div>
          <div class="flex items-center justify-center flex-shrink-0" [class]="getToastIconClass(toast.type)">
            @switch (toast.type) {
              @case ('success') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              }
              @case ('error') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16.01"/></svg>
              }
              @default {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="16"/><line x1="12" x2="12" y1="8" y2="12"/></svg>
              }
            }
          </div>
          <span class="text-sm font-semibold flex-1">{{ toast.message }}</span>
          <button class="text-muted-foreground cursor-pointer p-1 rounded transition-all duration-200 flex items-center justify-center hover:bg-accent hover:text-foreground" (click)="remove(toast.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class SnackbarComponent {
  private snackbarService = inject(SnackbarService);
  toasts: Signal<SnackbarData[]> = this.snackbarService.toasts;

  remove(id: number) {
    this.snackbarService.remove(id);
  }

  getToastBarClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-emerald-600';
      case 'error': return 'bg-destructive';
      default: return 'bg-primary';
    }
  }

  getToastIconClass(type: string): string {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'error': return 'text-destructive';
      default: return 'text-primary';
    }
  }
}
