import { Component, signal, computed, inject, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NAV_ITEMS } from '../nav-data';
import { AuthService } from '../../../@core/services/auth.service';

interface SearchNode {
  title: string;
  url: string;
  category?: string;
  icon?: string;
}

@Component({
  selector: 'app-navigation-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-search.component.html',
  styleUrl: './navigation-search.component.css'
})
export class NavigationSearchComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  getInputWrapperClasses(): string {
    return `flex items-center rounded-md px-3 h-[38px] transition-all duration-200 backdrop-blur-sm border ${
      this.isFocused() 
        ? 'bg-card border-primary ring-4 ring-primary/20' 
        : 'bg-muted/85 border-input-border'
    }`;
  }

  @ViewChild('containerRef') containerRef!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  query = signal('');
  isFocused = signal(false);
  activeIndex = signal(0);
  isAppAdmin = computed(() => this.authService.currentUser()?.role === 'APPADMIN');

  // Flattened navigation nodes
  private readonly allNodes = computed<SearchNode[]>(() => {
    const nodes: SearchNode[] = [];
    const userFeatures = this.authService.currentUser()?.features || [];

    const hasAccess = (item: any) => {
      if (this.isAppAdmin()) return true;

      // Feature filtering
      if (item.feature) {
        if (userFeatures.length === 0 || !userFeatures.includes(item.feature)) {
          return false;
        }
      }
      
      // Privilege filtering
      if (item.privilege && item.privilege.length > 0) {
        const hasPrivilege = item.privilege.some((priv: string) => this.authService.hasPrivilege([priv]));
        if (!hasPrivilege) return false;
      }

      return true;
    };

    // Core routes
    nodes.push({ title: 'My Profile', url: '/profile', category: 'Account' });

    const flatten = (items: any[], parentCategory: string) => {
      items.forEach(item => {
        if (!hasAccess(item)) return;

        if (item.type === 'item') {
          nodes.push({
            title: item.title,
            url: item.url || '',
            category: parentCategory || item.feature || 'General Pages'
          });
        } else if (item.children && item.children.length > 0) {
          flatten(item.children, parentCategory || item.title);
        }
      });
    };

    NAV_ITEMS.forEach(item => {
      if (!hasAccess(item)) return;

      if (item.type === 'item') {
        nodes.push({
          title: item.title,
          url: item.url || '',
          category: item.feature || 'General Pages'
        });
      } else if (item.children && item.children.length > 0) {
        flatten(item.children, item.title);
      }
    });

    return nodes;
  });

  // Filtered nodes based on query
  readonly filteredNodes = computed<SearchNode[]>(() => {
    const term = this.query().toLowerCase().trim();
    if (!term) return this.allNodes();
    return this.allNodes().filter(node =>
      node.title.toLowerCase().includes(term) ||
      node.category?.toLowerCase().includes(term)
    );
  });

  // Group filtered nodes by category
  readonly groupedNodes = computed(() => {
    const groups: { name: string; items: SearchNode[] }[] = [];

    this.filteredNodes().forEach(node => {
      const categoryName = node.category || 'General Pages';
      let group = groups.find(g => g.name === categoryName);
      if (!group) {
        group = { name: categoryName, items: [] };
        groups.push(group);
      }
      group.items.push(node);
    });

    return groups;
  });

  readonly isOpen = computed(() => this.isFocused());

  onInputChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.query.set(val);
    this.activeIndex.set(0);
  }

  clearSearch(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.query.set('');
    this.activeIndex.set(0);
    this.inputRef.nativeElement.focus();
  }

  isActive(node: SearchNode): boolean {
    const index = this.filteredNodes().indexOf(node);
    return index === this.activeIndex();
  }

  onMouseEnter(node: SearchNode) {
    const index = this.filteredNodes().indexOf(node);
    this.activeIndex.set(index);
  }

  selectNode(node: SearchNode) {
    this.router.navigate([node.url]);
    this.isFocused.set(false);
    this.query.set('');
    this.inputRef.nativeElement.blur();
  }

  // Keyboard navigation & global shortcuts
  onKeyDown(event: KeyboardEvent) {
    const nodes = this.filteredNodes();
    if (nodes.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() + 1) % nodes.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() - 1 + nodes.length) % nodes.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const activeNode = nodes[this.activeIndex()];
      if (activeNode) {
        this.selectNode(activeNode);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.isFocused.set(false);
      this.inputRef.nativeElement.blur();
    }
  }

  // Click outside to close dropdown
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.containerRef && !this.containerRef.nativeElement.contains(event.target)) {
      this.isFocused.set(false);
    }
  }

  // Ctrl + K or Cmd + K shortcut to focus
  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.inputRef.nativeElement.focus();
    }
  }
}
