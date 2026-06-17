import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorageService } from '../services/token-storage.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // Solo tocamos calls a la API.
  const isApiCall = req.url.includes('/api/');

  // El JWT vive en una cookie httpOnly. El navegador la manda automáticamente
  // si la request va con credentials. Por eso forzamos withCredentials para
  // que la cookie viaje cross-origin (front 4200 ↔ back 5178).
  const outgoing = isApiCall
    ? req.clone({ withCredentials: true })
    : req;

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      // 402: prueba/suscripción vencida → al paywall.
      if (isApiCall && error.status === 402) {
        toast.error('Tu prueba terminó. Suscríbete para seguir usando DotaMentor.');
        router.navigate(['/app/subscription']);
      }
      if (isApiCall && error.status === 401) {
        const isAuthEndpoint = req.url.includes('/auth/');
        if (!isAuthEndpoint) {
          // Cookie vencida o inválida en endpoint protegido: limpio cache y redirijo.
          storage.clear();
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
