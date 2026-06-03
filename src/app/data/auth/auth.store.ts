import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TokenStorageService } from '../../core/services/token-storage.service';
import { RecentSessionsService } from '../sessions/recent-sessions.service';
import { SessionSyncService } from '../sessions/session-sync.service';
import { AuthApi } from './auth.api';
import { SessionResponse, UserDto } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(TokenStorageService);
  private readonly recentSessions = inject(RecentSessionsService);
  private readonly sessionSync = inject(SessionSyncService);

  // El user en localStorage es solo cache para hidratar la UI rápido al recargar.
  // La sesión real la valida el backend leyendo la cookie httpOnly.
  readonly currentUser = signal<UserDto | null>(this.storage.getUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async register(email: string, password: string): Promise<void> {
    this.beginRequest();
    try {
      // El backend NO setea cookie en register: hay que confirmar email primero.
      await firstValueFrom(this.api.register({ email, password }));
    } catch (e) {
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.beginRequest();
    try {
      const response = await firstValueFrom(this.api.login({ email, password }));
      this.handleSuccess(response);
    } catch (e) {
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendVerificationCode(email: string): Promise<void> {
    await firstValueFrom(this.api.sendVerificationCode({ email }));
  }

  async confirmVerificationCode(email: string, code: string): Promise<void> {
    this.beginRequest();
    try {
      const response = await firstValueFrom(
        this.api.confirmVerificationCode({ email, code }),
      );
      this.handleSuccess(response);
    } catch (e) {
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.api.me());
      this.currentUser.set(user);
      this.storage.setUser(user);
    } catch (e) {
      // 401 lo trata el interceptor (limpia cache y redirige)
      console.warn('[AuthStore] refreshCurrentUser failed', e);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this.beginRequest();
    try {
      await firstValueFrom(this.api.changePassword({ currentPassword, newPassword }));
    } catch (e) {
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Actualiza el currentUser cuando el PlayerLinkService devuelve un user fresco
   *  (vinculación / desvinculación de Steam). El servicio de player tiene su
   *  propio store; este método sirve solo para mantener sincronizado el signal
   *  de currentUser. */
  applyUserUpdate(user: UserDto): void {
    this.storage.setUser(user);
    this.currentUser.set(user);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } catch (e) {
      // Aunque falle el backend, limpiamos local y dejamos al user fuera.
      console.warn('[AuthStore] logout API failed; clearing local state anyway', e);
    }
    this.storage.clear();
    this.recentSessions.clear();
    this.currentUser.set(null);
    this.error.set(null);
  }

  clearError(): void {
    this.error.set(null);
  }

  private beginRequest(): void {
    this.isLoading.set(true);
    this.error.set(null);
  }

  private handleSuccess(response: SessionResponse): void {
    this.storage.setUser(response.user);
    this.currentUser.set(response.user);
    // Tras login / confirmación, traemos la lista real desde el server. No await:
    // no queremos bloquear la promesa de login por la sincronización del cache.
    this.sessionSync.refreshList();
  }

  private handleError(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      const body = e.error as { detail?: string; code?: string } | null;
      switch (e.status) {
        case 0:
          this.error.set('No se pudo conectar al servidor. ¿Está el backend corriendo?');
          break;
        case 401:
          this.error.set('Email o contraseña incorrectos.');
          break;
        case 403:
          if (body?.code === 'email_not_verified') {
            this.error.set(null);
          } else {
            this.error.set(body?.detail ?? 'No tienes permiso para esta acción.');
          }
          break;
        case 409:
          this.error.set('Ya existe una cuenta con ese email.');
          break;
        case 429:
          this.error.set(body?.detail ?? 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.');
          break;
        case 400:
          this.error.set(body?.detail ?? 'Datos inválidos. Revisa los campos.');
          break;
        default:
          this.error.set('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } else {
      this.error.set('Ocurrió un error inesperado.');
    }
  }
}
