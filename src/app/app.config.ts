import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  RouteReuseStrategy,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthStore } from './data/auth/auth.store';
import { SessionSyncService } from './data/sessions/session-sync.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideIonicAngular({ mode: 'md' }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Si al arrancar la app ya hay un usuario en cache (cookie viva en el backend),
    // hidratamos la lista de sesiones desde el server. Sin await: dejamos que la
    // app arranque y la lista aparece cuando llegue.
    provideAppInitializer(() => {
      const auth = inject(AuthStore);
      const sync = inject(SessionSyncService);
      if (auth.isAuthenticated()) {
        sync.refreshList();
      }
    }),
  ],
};
