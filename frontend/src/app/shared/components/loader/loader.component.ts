import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getWrapperClasses()">
      <div class="flex flex-col items-center gap-4 p-8 bg-card border border-border rounded-lg shadow-xl">
        <div class="border-4 border-muted border-t-primary rounded-full animate-spin" 
             [style.width.px]="size()" 
             [style.height.px]="size()"></div>
        @if (text()) {
          <p class="text-base font-bold text-foreground m-0">{{ text() }}</p>
        }
      </div>
    </div>
  `
})
export class LoaderComponent {
  size = input<number>(40);
  text = input<string>('');
  overlay = input<boolean>(false);
  fullscreen = input<boolean>(false);

  getWrapperClasses(): string {
    if (this.fullscreen()) {
      return 'fixed inset-0 bg-background/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4';
    }
    if (this.overlay()) {
      return 'absolute inset-0 bg-background/70 backdrop-blur-sm z-50 rounded-[inherit] flex items-center justify-center p-4';
    }
    return 'flex items-center justify-center p-4';
  }
}
