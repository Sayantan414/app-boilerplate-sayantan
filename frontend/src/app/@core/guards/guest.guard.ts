import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { take, catchError, of, switchMap } from 'rxjs';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Helper to determine redirect target based on user role
  const getRedirectTarget = () => {
    const user = authService.currentUser();
    return user?.role === 'APPADMIN' ? '/app-dashboard' : '/dashboard';
  };

  if (authService.isLoggedIn()) {
    return router.createUrlTree([getRedirectTarget()]);
  }

  // Attempt token refresh on initial load/page refresh to see if user is actually authenticated
  return authService.refreshToken().pipe(
    take(1),
    switchMap((res) => {
      if (!res || !res.accessToken) {
        // Refresh token failed/expired — they are a guest, allow access to login
        return of(true);
      }
      
      // Refresh token succeeded — user is authenticated, retrieve profile and redirect to dashboard
      return authService.getMe().pipe(
        switchMap(() => {
          return of(router.createUrlTree([getRedirectTarget()]));
        }),
        catchError(() => of(true)) // Fallback to allowing access if profile fetch fails
      );
    }),
    catchError(() => of(true)) // Fallback to allowing login on refresh errors
  );
};
