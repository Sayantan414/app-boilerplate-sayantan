import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getSkeletonClasses()" [style.height]="height()" [style.width]="width()"></div>
  `,
  host: {
    class: 'inline-block w-full'
  }
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('20px');
  variant = input<'rect' | 'circle'>('rect');

  getSkeletonClasses(): string {
    const isCircle = this.variant() === 'circle';
    return `bg-muted animate-pulse ${isCircle ? 'rounded-full' : 'rounded-sm'} w-full h-full block`;
  }
}
