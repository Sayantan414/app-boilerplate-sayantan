import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { LayoutService } from '../../@core/services/layout.service';
import { NavigationComponent } from '../common/navigation/navigation.component';
import { ThemeSwitcherComponent } from '../common/theme-switcher/theme-switcher.component';
import { UserMenuComponent } from '../common/user-menu/user-menu.component';
import { NavigationSearchComponent } from '../common/navigation-search/navigation-search.component';
import { NAV_ITEMS } from '../common/nav-data';
import { OrganizationService } from '../../@core/services/organization.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-vertical-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigationComponent, ThemeSwitcherComponent, UserMenuComponent, NavigationSearchComponent],
  templateUrl: './vertical-layout.component.html',
  styleUrl: './vertical-layout.component.css'
})
export class VerticalLayoutComponent {
  protected readonly layoutService = inject(LayoutService);
  protected readonly orgService = inject(OrganizationService);
  private readonly router = inject(Router);

  readonly menuItems = NAV_ITEMS;
  readonly mobileSidebarOpen = signal(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileSidebarOpen.set(false);
    });
  }
}
