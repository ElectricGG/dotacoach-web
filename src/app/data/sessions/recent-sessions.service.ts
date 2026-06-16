import { Injectable, signal } from '@angular/core';

import { SessionOutcome, SessionResponseDto } from './session.models';

const STORAGE_KEY = 'dotacoach.recent_sessions';
const MAX_RECENT = 20;

export interface RecentSessionEntry {
  sessionId: string;
  type: 'MatchAnalysis' | 'DraftConsultation' | string;
  matchId: number | null;
  heroLocalizedName: string;
  playerSlot: number | null;
  laneRole: number | null;
  createdAt: string;
  expiresAt: string;
  status: string;
  outcome: SessionOutcome;
}

/** Cache local de sesiones recientes (signal + localStorage). Estado puro:
 *  no sabe nada de HTTP. La sincronización con el backend la maneja
 *  SessionSyncService. */
@Injectable({ providedIn: 'root' })
export class RecentSessionsService {
  readonly entries = signal<RecentSessionEntry[]>(this.load());

  add(session: SessionResponseDto): void {
    const entry: RecentSessionEntry = {
      sessionId: session.sessionId,
      type: session.type,
      matchId: session.matchId,
      heroLocalizedName: session.heroLocalizedName,
      playerSlot: session.playerSlot,
      laneRole: session.laneRole,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      status: session.status,
      outcome: session.outcome ?? 'Unknown',
    };

    const current = this.entries();
    const filtered = current.filter((e) => e.sessionId !== entry.sessionId);
    const next = [entry, ...filtered].slice(0, MAX_RECENT);
    this.entries.set(next);
    this.persist(next);
  }

  remove(sessionId: string): void {
    const next = this.entries().filter((e) => e.sessionId !== sessionId);
    this.entries.set(next);
    this.persist(next);
  }

  /** Reemplaza el listado completo (usado al hidratar desde el servidor). */
  replace(entries: RecentSessionEntry[]): void {
    const trimmed = entries.slice(0, MAX_RECENT);
    this.entries.set(trimmed);
    this.persist(trimmed);
  }

  clear(): void {
    this.entries.set([]);
    this.persist([]);
  }

  private load(): RecentSessionEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RecentSessionEntry[]) : [];
    } catch {
      return [];
    }
  }

  private persist(entries: RecentSessionEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }
}
