import { Component, input, output, effect, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'ui-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-background/40 z-[1000] animate-backdropFadeIn" (click)="onClose.emit()">
        <div 
          [class]="getDrawerClasses()" 
          (click)="$event.stopPropagation()"
        >
          <div class="p-6 flex items-start justify-between border-b border-border bg-background">
            <div class="flex flex-col gap-1">
              <h3 class="text-lg font-bold text-foreground tracking-tight m-0">{{ title() }}</h3>
              @if (description()) {
                <p class="text-xs text-muted-foreground leading-normal m-0">{{ description() }}</p>
              }
            </div>
            <button class="text-muted-foreground transition-all duration-200 p-1.5 rounded-md -mt-1.5 -mr-1.5 flex items-center justify-center hover:bg-accent hover:text-foreground" (click)="onClose.emit()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto flex-1 bg-background scrollbar-thin">
            <ng-content></ng-content>
          </div>
          
          <div class="p-6 border-t border-border flex justify-end gap-3 bg-background">
            <ng-content select="[footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class DrawerComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  description = input<string>('');
  position = input<'left' | 'right'>('right');
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

  getDrawerClasses(): string {
    const sizeMap = {
      sm: 'w-[360px]',
      md: 'w-[480px]',
      lg: 'w-[640px]',
      xl: 'w-[800px]',
      full: 'w-screen'
    };
    const positionMap = {
      right: 'right-0 border-l border-border animate-drawerSlideInRight',
      left: 'left-0 border-r border-border animate-drawerSlideInLeft'
    };
    return `absolute top-0 bottom-0 bg-background shadow-2xl flex flex-col h-full z-[1001] max-w-full ${sizeMap[this.size()]} ${positionMap[this.position()]}`;
  }
}
