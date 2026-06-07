import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { take, catchError, of, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // On the server (SSR), skip auth check — cookies are not available.
  // The browser will re-run the guard after hydration.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  // On page refresh: step 1 — get a new accessToken using the httpOnly refreshToken cookie
  return authService.refreshToken().pipe(
    take(1),
    switchMap((res) => {
      if (!res || !res.accessToken) {
        // Refresh token cookie missing or expired
        return of(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }));
      }
      // Step 2 — now accessToken is in memory, interceptor will attach Bearer header
      return authService.getMe().pipe(
        switchMap((user) => {
          if (user) return of(true as const);
          return of(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }));
        }),
        catchError(() =>
          of(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }))
        )
      );
    }),
    catchError(() =>
      of(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }))
    )
  );
};

