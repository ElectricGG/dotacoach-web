import { Injectable } from '@angular/core';

import { UserDto } from '../../data/auth/auth.models';

// El JWT vive en una cookie httpOnly seteada por el backend, JS no la puede leer
// ni escribir. Solo cacheamos el `user` en localStorage para hidratar la UI rápido
// en la próxima carga; la verdad la confirma el backend con GET /users/me.
const USER_KEY = 'dotacoach.user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getUser(): UserDto | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserDto) : null;
    } catch {
      return null;
    }
  }

  setUser(user: UserDto): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }
}
