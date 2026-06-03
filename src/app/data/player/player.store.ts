import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '../auth/auth.store';
import { PlayerApi } from './player.api';
import { RecentMatchDto } from './player.models';

@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly api = inject(PlayerApi);
  private readonly authStore = inject(AuthStore);

  readonly recentMatches = signal<RecentMatchDto[]>([]);
  readonly isLoadingMatches = signal(false);
  readonly matchesError = signal<string | null>(null);
  readonly isLinking = signal(false);
  readonly linkError = signal<string | null>(null);

  constructor() {
    // Cuando el usuario se desloguea, limpiamos cualquier dato sensible cacheado.
    // Evita acoplar AuthStore -> PlayerStore directamente (mantenemos DI lineal).
    effect(() => {
      if (this.authStore.currentUser() === null) {
        this.clear();
      }
    });
  }

  async linkSteam(steamId: number | null): Promise<void> {
    this.isLinking.set(true);
    this.linkError.set(null);
    try {
      const user = await firstValueFrom(this.api.linkSteam({ steamId }));
      this.authStore.applyUserUpdate(user);
      if (steamId === null) {
        this.recentMatches.set([]);
      } else {
        // Pre-cargar partidas para que el Home las muestre apenas vincule.
        await this.refreshRecentMatches();
      }
    } catch (e) {
      this.linkError.set(describeLinkError(e));
      throw e;
    } finally {
      this.isLinking.set(false);
    }
  }

  async refreshRecentMatches(): Promise<void> {
    if (!this.authStore.currentUser()?.steamAccountId) return;
    this.isLoadingMatches.set(true);
    this.matchesError.set(null);
    try {
      const matches = await firstValueFrom(this.api.recentMatches());
      this.recentMatches.set(matches);
    } catch (e) {
      this.matchesError.set(describeMatchesError(e));
    } finally {
      this.isLoadingMatches.set(false);
    }
  }

  clear(): void {
    this.recentMatches.set([]);
    this.matchesError.set(null);
    this.linkError.set(null);
  }
}

function describeLinkError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const detail = (e.error as { detail?: string } | null)?.detail;
    if (detail) return detail;
    if (e.status === 400) return 'Steam ID inválido.';
  }
  return 'No se pudo vincular la cuenta. Verificá el ID y reintentá.';
}

function describeMatchesError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'No se pudo conectar al servidor.';
    if (e.status === 502) return 'OpenDota no respondió. Reintentá en unos segundos.';
    const detail = (e.error as { detail?: string } | null)?.detail;
    if (detail) return detail;
  }
  return 'No se pudieron cargar las partidas recientes.';
}
