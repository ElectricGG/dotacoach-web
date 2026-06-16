import { Injectable, signal } from '@angular/core';

/**
 * Controla el modal de chat de consulta de draft. La sesión ya fue creada
 * antes de abrir el modal (la creó CounterpicksPage); el modal solo
 * lee/escribe del SessionStore.current.
 */
@Injectable({ providedIn: 'root' })
export class DraftChatModalService {
  readonly activeSessionId = signal<string | null>(null);

  open(sessionId: string): void {
    this.activeSessionId.set(sessionId);
  }

  close(): void {
    this.activeSessionId.set(null);
  }
}
