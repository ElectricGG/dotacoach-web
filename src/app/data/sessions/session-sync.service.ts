import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RecentSessionEntry, RecentSessionsService } from './recent-sessions.service';
import { SessionApi } from './session.api';
import { SessionSummaryDto } from './session.models';

/** Orquesta la sincronización entre el backend (SessionApi) y el cache local
 *  (RecentSessionsService). Es la única pieza de la capa de datos que conoce
 *  ambos lados — el cache se mantiene "tonto" y la API también. */
@Injectable({ providedIn: 'root' })
export class SessionSyncService {
  private readonly api = inject(SessionApi);
  private readonly cache = inject(RecentSessionsService);

  /** Trae la lista autoritativa del servidor y reemplaza el cache local.
   *  Falla silenciosamente: si el server no responde, dejamos el cache como está. */
  async refreshList(take = 20): Promise<void> {
    try {
      const summaries = await firstValueFrom(this.api.list(take));
      this.cache.replace(summaries.map(toEntry));
    } catch (e) {
      console.warn('[SessionSync] refreshList failed', e);
    }
  }
}

function toEntry(s: SessionSummaryDto): RecentSessionEntry {
  return {
    sessionId: s.sessionId,
    type: s.type,
    matchId: s.matchId,
    heroLocalizedName: s.heroLocalizedName,
    playerSlot: s.playerSlot,
    laneRole: s.laneRole,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    status: s.status,
    outcome: s.outcome ?? 'Unknown',
  };
}
