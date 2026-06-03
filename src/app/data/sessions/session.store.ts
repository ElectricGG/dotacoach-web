import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RecentSessionsService } from './recent-sessions.service';
import { SessionApi } from './session.api';
import {
  CreateSessionRequest,
  SessionResponseDto,
} from './session.models';

export type CreateSessionOutcome =
  | { kind: 'created'; session: SessionResponseDto }
  | { kind: 'parsing'; matchId: number };

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(SessionApi);
  private readonly recents = inject(RecentSessionsService);

  readonly current = signal<SessionResponseDto | null>(null);
  readonly isLoading = signal(false);
  readonly loadingPhase = signal<'idle' | 'fetching' | 'analyzing' | 'sending'>('idle');
  readonly error = signal<string | null>(null);

  readonly canSendMessage = computed(() => {
    const session = this.current();
    if (!session) return false;
    return session.status === 'Active' && session.remainingMessages > 0;
  });

  async createSession(request: CreateSessionRequest): Promise<CreateSessionOutcome> {
    this.beginRequest('fetching');
    try {
      const response = await firstValueFrom(this.api.createWithStatus(request));

      // 202 Accepted → match no parseado todavía
      if (response.status === 202) {
        return { kind: 'parsing', matchId: request.matchId };
      }

      const session = response.body!;
      this.current.set(session);
      this.recents.add(session);
      return { kind: 'created', session };
    } catch (e) {
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
      this.loadingPhase.set('idle');
    }
  }

  async loadSession(id: string): Promise<void> {
    this.beginRequest('fetching');
    try {
      const session = await firstValueFrom(this.api.getById(id));
      this.current.set(session);
    } catch (e) {
      // Si la sesión no existe en el backend, la sacamos del listado local.
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.recents.remove(id);
      }
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
      this.loadingPhase.set('idle');
    }
  }

  async sendMessage(id: string, message: string): Promise<void> {
    this.beginRequest('sending');
    try {
      const session = await firstValueFrom(this.api.sendMessage(id, { message }));
      this.current.set(session);
      this.recents.add(session);
    } catch (e) {
      this.handleError(e);
      throw e;
    } finally {
      this.isLoading.set(false);
      this.loadingPhase.set('idle');
    }
  }

  setLoadingPhase(phase: 'idle' | 'fetching' | 'analyzing' | 'sending'): void {
    this.loadingPhase.set(phase);
  }

  clear(): void {
    this.current.set(null);
    this.error.set(null);
  }

  clearError(): void {
    this.error.set(null);
  }

  private beginRequest(phase: 'fetching' | 'analyzing' | 'sending'): void {
    this.isLoading.set(true);
    this.loadingPhase.set(phase);
    this.error.set(null);
  }

  private handleError(e: unknown): void {
    if (e instanceof HttpErrorResponse) {
      switch (e.status) {
        case 0:
          this.error.set('No se pudo conectar al servidor.');
          break;
        case 400: {
          const detail = (e.error as { detail?: string } | null)?.detail;
          this.error.set(detail ?? 'Datos inválidos.');
          break;
        }
        case 410:
          this.error.set('Esta sesión expiró. Iniciá una nueva.');
          break;
        case 429:
          this.error.set('Llegaste al límite de mensajes en esta sesión.');
          break;
        case 502:
          this.error.set('El servicio externo (OpenDota o Gemini) no respondió. Intentá de nuevo.');
          break;
        default:
          this.error.set('Ocurrió un error inesperado.');
      }
    } else {
      this.error.set('Ocurrió un error inesperado.');
    }
  }
}
