import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type NavType = 'vertical' | 'horizontal';
export type ThemeType = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly platformId = inject(PLATFORM_ID);

  // Navigation Type
  readonly navType = signal<NavType>('vertical');

  // Theme
  readonly theme = signal<ThemeType>('light');

  // Sidebar State
  readonly sidebarExpanded = signal(true);

  constructor() {
    // Sync theme with DOM
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const theme = this.theme();
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      }
    });

    // Load initial theme from localStorage
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme') as ThemeType;
      if (savedTheme) {
        this.theme.set(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.theme.set('dark');
      }
    }
  }

  toggleNavType(): void {
    this.navType.update(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  }

  toggleTheme(): void {
    this.theme.update(prev => prev === 'light' ? 'dark' : 'light');
  }

  toggleSidebar(): void {
    this.sidebarExpanded.update(prev => !prev);
  }
}
