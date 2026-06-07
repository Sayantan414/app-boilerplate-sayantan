import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NAV_ITEMS } from '../../layout/common/nav-data';
import { NavItem } from '../../layout/common/navigation/navigation.component';

// Recursive helper function to find a NavItem matching the current URL path
function findNavItemByUrl(items: NavItem[], url: string): NavItem | null {
  for (const item of items) {
    if (item.url && (url === item.url || url.startsWith(item.url + '/'))) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findNavItemByUrl(item.children, url);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export const roleGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Clean URL to remove query parameters and hash fragments for matching
  const cleanUrl = state.url.split('?')[0].split('#')[0];

  // Find the nav item for the current route inside NAV_ITEMS
  const matchedItem = findNavItemByUrl(NAV_ITEMS, cleanUrl);
  const requiredPrivileges = matchedItem?.privilege;

  // If no privilege constraint is defined for this item, allow entry
  if (!requiredPrivileges || requiredPrivileges.length === 0) {
    return true;
  }

  // Ensure the user is authenticated
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  // Verify the user has the required privileges
  if (authService.hasPrivilege(requiredPrivileges)) {
    return true;
  }

  // Redirect unauthorized users to dashboard
  return router.createUrlTree(['/dashboard']);
};
