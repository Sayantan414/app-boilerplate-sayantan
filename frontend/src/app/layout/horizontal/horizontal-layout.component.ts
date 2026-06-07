import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../../@core/services/layout.service';
import { NavigationComponent } from '../common/navigation/navigation.component';
import { ThemeSwitcherComponent } from '../common/theme-switcher/theme-switcher.component';
import { UserMenuComponent } from '../common/user-menu/user-menu.component';
import { NAV_ITEMS } from '../common/nav-data';

@Component({
  selector: 'app-horizontal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigationComponent, ThemeSwitcherComponent, UserMenuComponent],
  templateUrl: './horizontal-layout.component.html',
  styleUrl: './horizontal-layout.component.css'
})
export class HorizontalLayoutComponent {
  protected readonly layoutService = inject(LayoutService);
  isMobileMenuOpen = false;
  readonly menuItems = NAV_ITEMS;
}
