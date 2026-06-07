import { Component, inject, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  dropdownOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
    }
  }

  fullName = () => {
    const user = this.authService.currentUser();
    return user ? [user.firstname, user.lastname].filter(Boolean).join(' ') : 'Guest User';
  };

  role = () => this.authService.currentUser()?.role || 'Guest';

  username = () => this.authService.currentUser()?.userid || 'user';

  initials = () => {
    const user = this.authService.currentUser();
    if (!user) return 'GU';
    return (user.firstname[0] + (user.lastname?.[0] || '')).toUpperCase();
  };

  profilePic = () => this.authService.currentUser()?.profilePic;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  goToProfile() {
    this.dropdownOpen.set(false);
    this.router.navigate(['/profile']);
  }

  onLogout() {
    this.dropdownOpen.set(false);
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
