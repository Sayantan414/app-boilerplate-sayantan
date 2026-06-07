import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, map } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const snackbarService = inject(SnackbarService);
  const token = authService.accessToken();

  // Clone request with credentials and token
  let authReq = req.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('signin') &&
        !req.url.includes('refresh-token')
      ) {
        return handle401Error(authReq, next, authService);
      }

      // Automatically display backend-driven error messages in a snackbar
      // Skip showing error snackbar for refresh-token failures — these are handled silently
      if (error instanceof HttpErrorResponse && !req.url.includes('refresh-token')) {
        const errorBody = error.error;
        const errorMsg = (errorBody && typeof errorBody === 'object' && errorBody.message)
          ? errorBody.message
          : (error.message || 'An error occurred');
        snackbarService.error(errorMsg);
      }

      return throwError(() => error);
    }),
    map((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        const body = event.body;
        if (body && typeof body === 'object' && body.success === true) {
          if (body.message && typeof body.message === 'string') {
            const msgLower = body.message.toLowerCase();
            if (
              !msgLower.includes('fetched') &&
              !msgLower.includes('refreshed') &&
              !req.url.includes('refresh-token') &&
              !req.url.includes('signin') &&
              !req.url.includes('search') &&
              !req.url.includes('count')
            ) {
              snackbarService.success(body.message);
            }
          }
          if ('data' in body) {
            return event.clone({ body: body.data });
          }
        }
      }
      return event;
    })
  );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res) => {
        isRefreshing = false;
        if (!res) {
          refreshTokenSubject.next('');
          return throwError(() => new Error('Session Expired (SSR)'));
        }
        const newToken = res.accessToken;
        refreshTokenSubject.next(newToken);

        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next(''); // Signal failure
        return throwError(() => err);
      })
    );
  } else {
    // Wait for the refresh to complete
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        if (!token) return throwError(() => new Error('Session Expired'));
        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        }));
      })
    );
  }
}
