import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../@core/services/layout.service';
import { VerticalLayoutComponent } from './vertical/vertical-layout.component';
import { HorizontalLayoutComponent } from './horizontal/horizontal-layout.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, VerticalLayoutComponent, HorizontalLayoutComponent],
  template: `
    @if (layoutService.navType() === 'vertical') {
      <app-vertical-layout></app-vertical-layout>
    } @else {
      <app-horizontal-layout></app-horizontal-layout>
    }
  `
})
export class LayoutComponent {
  protected readonly layoutService = inject(LayoutService);
}
