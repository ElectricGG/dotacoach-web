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
      {
        path: 'new',
        loadComponent: () =>
          import('../new-analysis/new-analysis.page').then((m) => m.NewAnalysisPage),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('../sessions-list/sessions-list.page').then((m) => m.SessionsListPage),
      },
      {
        path: 'counterpicks',
        loadComponent: () =>
          import('../counterpicks/counterpicks.page').then((m) => m.CounterpicksPage),
      },
      {
        path: 'sessions/:id',
        loadComponent: () =>
          import('../chat/chat.page').then((m) => m.ChatPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('../subscription/subscription.page').then((m) => m.SubscriptionPage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];
