import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '../../data/auth/auth.store';

/** Redirige usuarios ya logueados fuera de las pantallas públicas (login/register). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/app/home']);
  }

  return true;
};
