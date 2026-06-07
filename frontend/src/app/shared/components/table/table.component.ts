import { Component, input, output, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatMenuModule } from '@angular/material/menu';

export interface TableAction {
  label: string;
  icon: string;
  type: string;
  /** Optional color for styling the action button */
  color?: string;
  /** Optional function to determine if the action should be shown for a specific row */
  show?: (row: any) => boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'actions' | 'user' | 'button';
  actions?: TableAction[];
  getValue?: (row: any) => string;
  flex?: string;
  minWidth?: string;
}

@Component({
  selector: 'ui-table',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  template: `
    <div class="table-container w-full bg-card border border-foreground/15 rounded-lg shadow-sm flex flex-col overflow-x-auto max-w-full" [class.flex-none]="data().length === 0">
      <table class="w-full border-collapse table-auto">
        <thead class="bg-accent/20 border-b border-foreground/15">
          <tr>
            @for (col of columns(); track col.key) {
              <th class="px-3 py-4 text-xs font-semibold  tracking-wider text-foreground whitespace-nowrap text-left"
                  >
                <div class="flex items-center w-full"
                     [style.justify-content]="col.type === 'actions' ? 'flex-end' : 'flex-start'">
                  {{ col.label }}
                </div>
              </th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-border/40">
          @for (row of data(); track $index; let rowIndex = $index) {
            <tr class="group border-b border-border/40 hover:bg-primary/[0.01]">
              @for (col of columns(); track col.key) {
                <td class="px-3 py-4 text-sm text-foreground align-middle transition-colors duration-200"
                    >
                  <div class="flex items-center w-full min-w-0"
                       [style.justify-content]="col.type === 'actions' ? 'flex-end' : 'flex-start'">
                    @if (col.type === 'user') {
                      <div class="flex items-center gap-3 min-w-0 w-full">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">{{ row['avatar'] || getCellValue(row, col).substring(0, 2) }}</div>
                        <div class="flex flex-col min-w-0 break-all overflow-wrap-anywhere whitespace-normal">
                          <span class="font-semibold text-foreground">{{ getCellValue(row, col) }}</span>
                        </div>
                      </div>
                    } @else if (col.type === 'badge') {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap" [class]="getBadgeClass(getCellValue(row, col))">{{ getCellValue(row, col) }}</span>
                    } @else if (col.type === 'actions') {
                      <div class="relative inline-flex justify-end">
                        <button type="button" [matMenuTriggerFor]="menu" class="w-8 h-8 rounded-full flex items-center justify-center text-foreground bg-accent/50 border border-border cursor-pointer transition-all duration-200 hover:bg-accent hover:scale-105" title="More actions">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                             <circle cx="12" cy="5" r="2"/>
                             <circle cx="12" cy="12" r="2"/>
                             <circle cx="12" cy="19" r="2"/>
                          </svg>
                        </button>
                        
                        <mat-menu #menu="matMenu" xPosition="before" class="table-actions-menu">
                          @for (action of col.actions; track action.type) {
                            @if (!action.show || action.show(row)) {
                              <button mat-menu-item (click)="handleAction(action.type, row)">
                                <div class="flex items-center gap-2.5">
                                  <span class="flex items-center justify-center w-5 text-muted-foreground" [innerHTML]="getSafeIcon(action.icon)"></span>
                                  <span>{{ action.label }}</span>
                                </div>
                              </button>
                            }
                          }
                        </mat-menu>
                      </div>
                    } @else if (col.type === 'button') {
                      <button type="button" [class]="getCellBtnClass(row['selected'])" (click)="handleAction('click_' + col.key, row)">
                        {{ getCellValue(row, col) }}
                      </button>
                    } @else {
                      <span class="break-all overflow-wrap-anywhere whitespace-normal w-full">{{ getCellValue(row, col) }}</span>
                    }
                  </div>
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns().length" class="border-none">
                <div class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[200px] w-full">
                  <div class="mb-4 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  </div>
                  <p class="text-sm font-semibold m-0">{{ emptyMessage() }}</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class TableComponent {
  columns = input<TableColumn[]>([]);
  data = input<any[]>([]);
  emptyMessage = input<string>('No records found');
  onAction = output<{ type: string, row: any }>();

  private readonly elementRef = inject(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);

  handleAction(type: string, row: any) {
    this.onAction.emit({ type, row });
  }

  getCellValue(row: any, col: TableColumn): string {
    if (col.getValue) {
      return col.getValue(row);
    }
    return row[col.key] || '';
  }

  getSafeIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }


  getColMinWidth(col: TableColumn): string {
    if (col.minWidth) {
      return col.minWidth;
    }
    if (col.type === 'actions') {
      return '70px';
    }
    const labelLength = col.label ? col.label.length : 0;
    if (labelLength > 15) {
      return `${Math.min(labelLength * 8.5 + 40, 320)}px`;
    }
    return '120px';
  }

  getBadgeClass(val: string): string {
    const v = val.toLowerCase().trim();
    if (v === 'active') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (v === 'pending' || v === 'expired') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    
    // User Action Log Badges
    if (v === 'signin' || v === 'sign in') return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    if (v === 'signout' || v === 'sign out') return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    if (v === 'add' || v === 'create') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (v === 'update' || v === 'edit') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    if (v === 'delete' || v === 'remove') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';

    return 'bg-destructive/10 text-destructive';
  }

  getCellBtnClass(isSelected: boolean): string {
    return isSelected
      ? 'px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border bg-emerald-600 border-emerald-600 text-white min-w-[60px]'
      : 'px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border border-primary bg-transparent text-primary transition-all duration-200 min-w-[60px] hover:bg-primary/10';
  }
}
