import { Routes } from '@angular/router';

export const appShellRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];
