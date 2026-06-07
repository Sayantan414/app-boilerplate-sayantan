import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './@core/guards/auth.guard';
import { roleGuard } from './@core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./modules/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/mail-confirm',
    loadComponent: () => import('./modules/auth/mail-confirm/mail-confirm').then(m => m.MailConfirm)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./modules/auth/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'app-dashboard',
        loadComponent: () => import('./modules/app-dashboard/app-dashboard.component').then(m => m.AppDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./modules/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'user-log',
        loadComponent: () => import('./modules/user-log/user-log.component').then(m => m.UserLogComponent)
      },
      {
        path: 'organization',
        loadComponent: () => import('./modules/organization/organization.component').then(m => m.OrganizationComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'settings/roles',
        loadComponent: () => import('./modules/roles/roles.component').then(m => m.RolesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
