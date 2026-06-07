import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'ui-table-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="bg-card border border-border rounded-lg overflow-x-auto max-w-full shadow-sm flex flex-col">
      <div class="flex items-center px-6 py-4 bg-accent/20 border-b border-border w-max min-w-full box-border">
        @for (i of [].constructor(columns()); track $index) {
          <div class="flex items-center box-border px-2 first:pl-0 last:pr-0" 
               [style.flex]="$index === (columns() - 1) ? '0 0 70px' : '1 1 0%'"
               [style.min-width]="$index === (columns() - 1) ? '70px' : '120px'"
               [style.justify-content]="$index === (columns() - 1) ? 'flex-end' : 'flex-start'">
            <ui-skeleton height="14px" [width]="$index === (columns() - 1) ? '40px' : '70px'"></ui-skeleton>
          </div>
        }
      </div>
      @for (row of [].constructor(rows()); track $index; let rowIndex = $index) {
        <div class="flex items-center px-6 py-3 border-b border-border w-max min-w-full box-border last:border-b-0 transition-colors duration-300">
          @for (i of [].constructor(columns()); track $index; let colIndex = $index) {
            <div class="flex items-center box-border px-2 first:pl-0 last:pr-0" 
                 [style.flex]="colIndex === (columns() - 1) ? '0 0 70px' : '1 1 0%'"
                 [style.min-width]="colIndex === (columns() - 1) ? '70px' : '120px'"
                 [style.justify-content]="colIndex === (columns() - 1) ? 'flex-end' : 'flex-start'">
              @if (colIndex === (columns() - 1)) {
                <div class="flex justify-end w-full">
                  <ui-skeleton height="32px" width="32px" variant="circle"></ui-skeleton>
                </div>
              } @else if (columns() > 3 && colIndex === (columns() - 2)) {
                <ui-skeleton height="22px" width="65px" style="border-radius: 12px; display: inline-block;"></ui-skeleton>
              } @else {
                <ui-skeleton height="14px" [width]="(40 + ((colIndex + rowIndex) * 13 % 50)) + '%'"></ui-skeleton>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TableSkeletonComponent {
  columns = input<number>(5);
  rows = input<number>(5);
  columnWidth = input<string>('80px');
}
