import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { tap, catchError, of, Observable, map, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrganizationService } from './organization.service';

export interface User {
  id: string;
  mobile: string;
  userid: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  status: string;
  ocode?: string;
  otype?: string;
  dept_name?: string;
  profilePic?: string;
  empno?: string;
  features?: string[];
  privilege?: string[];
  role_privilege?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private orgService = inject(OrganizationService);
  private apiUrl = `${environment.apiUrl}/user`;

  readonly currentUser = signal<User | null>(null);
  readonly accessToken = signal<string | null>(null);

  // Observable for sharing a single refresh token call
  private refreshSubscription$: Observable<any> | null = null;

  // Mock current user privileges
  readonly userPrivileges = signal<string[]>([
    'App Dashboard',
    'View User',
    'View Employee',
    'View Role',
    'View Section Master',
    'View Line Master',
    'View Designation Master'
  ]);

  constructor() {
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signin`, credentials, { withCredentials: true }).pipe(
      switchMap(res => {
        return this.http.get<any[]>('assets/jsons/defaultroles.json').pipe(
          tap(defaultRoles => {
            const { accessToken, ...user } = res;
            this.accessToken.set(accessToken);
            this.currentUser.set(user as User);

            let privs = user.role_privilege || user.privilege || [];
            if (privs.length === 0 && user.role) {
              const dRole = defaultRoles.find(r => r.name === user.role);
              if (dRole) privs = dRole.privilege || [];
            }
            this.userPrivileges.set(privs);
          }),
          map(() => res)
        );
      })
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/signout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  refreshToken(): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    // If a refresh is already in progress, share that observable
    if (this.refreshSubscription$) {
      return this.refreshSubscription$;
    }

    this.refreshSubscription$ = this.http.post<any>(`${this.apiUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
      tap(res => {
        this.accessToken.set(res.accessToken);
        this.refreshSubscription$ = null;
      }),
      catchError(err => {
        // Do NOT clearSession here — the guard/interceptor caller handles redirect
        this.refreshSubscription$ = null;
        throw err;
      }),
      shareReplay(1)
    );

    return this.refreshSubscription$;
  }

  getMe(): Observable<User> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null as any);
    }

    return this.http.get<any>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      switchMap(res => {
        const { accessToken, ...user } = res;
        if (accessToken) {
          this.accessToken.set(accessToken);
        }
        return this.http.get<any[]>('assets/jsons/defaultroles.json').pipe(
          tap(defaultRoles => {
            if (isPlatformBrowser(this.platformId)) {
              const savedOrg = localStorage.getItem('selectedOrg');
              if (savedOrg) {
                try {
                  const org = JSON.parse(savedOrg);
                  user.ocode = org.ocode;
                  user.otype = org.otype;
                } catch (e) { }
              }
            }
            this.currentUser.set(user);

            let privs = user.role_privilege || user.privilege || [];
            if (privs.length === 0 && user.role) {
              const dRole = defaultRoles.find(r => r.name === user.role);
              if (dRole) privs = dRole.privilege || [];
            }
            this.userPrivileges.set(privs);
          }),
          map(() => user as User)
        );
      })
    );
  }

  private clearSession() {
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.orgService.clear();
  }

  hasPrivilege(requiredPrivileges?: string[]): boolean {
    if (!requiredPrivileges || requiredPrivileges.length === 0) {
      return true;
    }
    return requiredPrivileges.some(p => this.userPrivileges().includes(p));
  }

  isLoggedIn(): boolean {
    return !!this.accessToken();
  }
}
