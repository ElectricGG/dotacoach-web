import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Públicas
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'verify-email',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/verify-email.page').then((m) => m.VerifyEmailPage),
  },

  // App protegida
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/app-shell/app-shell.routes').then((m) => m.appShellRoutes),
  },

  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage) },
];
