import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.page').then((m) => m.RegisterPage),
  },

  // App protegida (los guards se agregan en Fase 2)
  {
    path: 'app',
    loadChildren: () =>
      import('./features/app-shell/app-shell.routes').then((m) => m.appShellRoutes),
  },

  { path: '**', redirectTo: '' },
];
