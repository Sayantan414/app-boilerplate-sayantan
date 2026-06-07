import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="getBtnClasses()" 
      [disabled]="disabled()"
      (click)="onClick.emit($event)">
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input<boolean>(false);
  onClick = output<MouseEvent>();

  getBtnClasses(): string {
    const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 cursor-pointer border border-solid gap-2 whitespace-nowrap select-none active:translate-y-0 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizes = {
      sm: 'h-8 px-4 text-[0.8125rem]',
      md: 'h-10 px-6 text-sm',
      lg: 'h-12 px-8 text-base'
    };

    const variants = {
      primary: 'border-transparent bg-primary text-primary-foreground shadow-sm hover:enabled:bg-primary/90 hover:enabled:-translate-y-[1px] hover:enabled:shadow-md',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:enabled:bg-secondary/80',
      outline: 'border-border bg-transparent text-foreground hover:enabled:bg-accent hover:enabled:border-accent',
      ghost: 'border-transparent bg-transparent text-foreground hover:enabled:bg-accent hover:enabled:text-accent-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:enabled:bg-destructive/90'
    };

    return `${base} ${sizes[this.size()]} ${variants[this.variant()]}`;
  }
}
