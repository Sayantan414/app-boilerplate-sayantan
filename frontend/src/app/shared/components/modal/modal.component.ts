import { Component, input, output, effect, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-background/40 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-backdropFadeIn" (click)="onClose.emit()">
        <div [class]="getModalContainerClasses()" (click)="$event.stopPropagation()">
          <div class="px-8 py-6 flex items-center justify-between border-b border-border bg-gradient-to-br from-muted/40 to-card">
            <div class="flex flex-col gap-1 flex-1 pr-4">
              <h3 class="text-[1.35rem] font-bold text-foreground tracking-tight leading-snug">{{ title() }}</h3>
              @if (description()) {
                <p class="text-sm text-muted-foreground leading-normal">{{ description() }}</p>
              }
            </div>
            <button class="text-muted-foreground transition-all duration-150 p-[6px] rounded-md bg-muted/30 border border-border/50 flex items-center justify-center cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 hover:rotate-90" (click)="onClose.emit()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <div class="p-8 overflow-y-auto flex-1 bg-background scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <ng-content></ng-content>
          </div>
          
          <div class="px-8 py-6 border-t border-border flex justify-end items-center gap-4 bg-muted/30">
            <ng-content select="[footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  description = input<string>('');
  size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  onClose = output<void>();

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.isOpen()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    });
  }

  getModalContainerClasses(): string {
    const base = 'bg-background border border-border border-t-4 border-t-primary rounded-xl w-full max-h-[90vh] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25),_0_0_32px_0_hsl(var(--primary)/0.05)] flex flex-col animate-modalSlideUp overflow-hidden';

    const sizes = {
      sm: 'max-w-[440px]',
      md: 'max-w-[640px]',
      lg: 'max-w-[840px]',
      xl: 'max-w-[1180px]',
      full: 'max-w-[95vw] h-[95vh]'
    };

    return `${base} ${sizes[this.size()]}`;
  }
}
