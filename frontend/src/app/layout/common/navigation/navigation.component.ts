import { Component, input, inject, computed, HostListener, ElementRef, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../../@core/services/auth.service';
import { OrganizationService } from '../../../@core/services/organization.service';

export interface NavItem {
  id: string;
  title: string;
  type: 'item' | 'group' | 'collapsable';
  icon?: string;
  url?: string;
  translate?: string;
  privilege?: string[];
  feature?: string;
  class?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit {
  mode = input<'vertical' | 'horizontal'>('vertical');
  items = input<NavItem[]>([]);

  protected readonly authService = inject(AuthService);
  protected readonly orgService = inject(OrganizationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private expandedItems = new Set<string>();

  // Create a signal from the organization BehaviorSubject
  orgData = toSignal(this.orgService.organization);

  isAppAdmin = computed(() => this.authService.currentUser()?.role === 'APPADMIN');

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.autoExpandActiveParent();
    });
    // Run once initially
    this.autoExpandActiveParent();
  }

  private autoExpandActiveParent() {
    if (this.mode() !== 'vertical') {
      return;
    }
    const currentUrl = this.router.url;

    const checkAndExpand = (item: NavItem): boolean => {
      if (item.type === 'item' && item.url && currentUrl.startsWith(item.url)) {
        return true;
      }
      if (item.children && item.children.length > 0) {
        let hasActiveChild = false;
        for (const child of item.children) {
          if (checkAndExpand(child)) {
            hasActiveChild = true;
          }
        }
        if (hasActiveChild && item.type === 'collapsable') {
          this.expandedItems.add(item.id);
        }
        return hasActiveChild;
      }
      return false;
    };

    this.items().forEach(item => checkAndExpand(item));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.mode() === 'horizontal' && !this.elementRef.nativeElement.contains(event.target)) {
      this.expandedItems.clear();
    }
  }

  filteredItems = computed(() => {
    const navItems = this.items();
    return this.filterRecursive(navItems);
  });

  private filterRecursive(items: NavItem[]): NavItem[] {
    const userFeatures = this.authService.currentUser()?.features || [];
    const isAdmin = this.isAppAdmin();

    return items
      .filter(item => {
        if (isAdmin) return true;

        // Feature filtering
        if (item.feature) {
          if (userFeatures.length === 0 || !userFeatures.includes(item.feature)) {
            return false;
          }
        }

        // Privilege filtering
        if (item.privilege && item.privilege.length > 0) {
          const hasPrivilege = item.privilege.some(priv => this.authService.hasPrivilege([priv]));
          if (!hasPrivilege) return false;
        }

        return true;
      })
      .map(item => {
        const newItem = { ...item };
        if (newItem.children) {
          newItem.children = this.filterRecursive(newItem.children);
        }
        return newItem;
      })
      .filter(item => item.type !== 'collapsable' || (item.children && item.children.length > 0));
  }

  toggleExpand(item: NavItem, siblings?: NavItem[]) {
    const id = item.id;
    if (this.expandedItems.has(id)) {
      this.expandedItems.delete(id);
      this.collapseDescendants(item);
    } else {
      if (siblings) {
        for (const sibling of siblings) {
          if (sibling.id !== id) {
            this.expandedItems.delete(sibling.id);
            this.collapseDescendants(sibling);
          }
        }
      }
      this.expandedItems.add(id);
    }
  }

  private collapseDescendants(item: NavItem) {
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        this.expandedItems.delete(child.id);
        this.collapseDescendants(child);
      }
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedItems.has(id);
  }

  getNavLinkClass(depth: number): string {
    const isVertical = this.mode() === 'vertical';
    const baseClasses = "group flex items-center gap-3 p-2.5 rounded-md font-semibold text-sm cursor-pointer w-full transition-all duration-200";
    const depthClasses = depth > 0 ? "px-4 py-2.5 text-[0.8125rem]" : "";
    const colorClasses = isVertical 
      ? "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
    return `${baseClasses} ${depthClasses} ${colorClasses}`;
  }

  getSafeIcon(iconName?: string) {
    return this.sanitizer.bypassSecurityTrustHtml(this.getIconSvg(iconName));
  }

  private getIconSvg(iconName?: string): string {
    switch (iconName) {
      case 'dashboard':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>';
      case 'group':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
      case 'person':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      case 'folder':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
      case 'dot':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>';
      case 'keyboard_arrow_right':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';
      case 'category':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>';
      case 'badge':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"/></svg>';
      case 'shield':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
      case 'briefcase':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
      case 'timeline':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22.95" y2="12"/></svg>';
      case 'account_tree':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M12 8v4H5v4M12 12h7v4"/></svg>';
      case 'settings':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
      case 'master':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>';
      case 'train':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M18 22l-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/></svg>';
      case 'event_note':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      default:
        return '';
    }
  }
}
