import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../data/auth/auth.store';
import { PlayerStore } from '../../data/player/player.store';
import { RecentMatchDto } from '../../data/player/player.models';
import { RecentSessionsService } from '../../data/sessions/recent-sessions.service';
import { laneRoleLabel } from '../../shared/utils/lane-role';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly recents = inject(RecentSessionsService);
  private readonly playerStore = inject(PlayerStore);
  private readonly router = inject(Router);

  private readonly HOME_RECENT_LIMIT = 6;

  readonly user = this.authStore.currentUser;
  /** Solo las últimas N sesiones para mostrar en Home (el listado completo vive en /app/sessions). */
  readonly recentEntries = computed(() =>
    this.recents.entries().slice(0, this.HOME_RECENT_LIMIT),
  );
  readonly hasRecents = computed(() => this.recents.entries().length > 0);
  readonly totalSessionCount = computed(() => this.recents.entries().length);
  readonly hasMoreSessions = computed(
    () => this.totalSessionCount() > this.HOME_RECENT_LIMIT,
  );

  readonly hasSteamLinked = computed(() => this.user()?.steamAccountId != null);
  readonly steamMatches = this.playerStore.recentMatches;
  readonly isLoadingSteam = this.playerStore.isLoadingMatches;
  readonly steamError = this.playerStore.matchesError;

  readonly displayName = computed(() => {
    const email = this.user()?.email ?? '';
    return email.split('@')[0] || 'jugador';
  });

  ngOnInit(): void {
    if (this.hasSteamLinked()) {
      this.playerStore.refreshRecentMatches();
    }
  }

  refreshSteamMatches(): void {
    this.playerStore.refreshRecentMatches();
  }

  analyzeMatch(match: RecentMatchDto): void {
    this.router.navigate(['/app/new'], {
      queryParams: { matchId: match.matchId, playerSlot: match.playerSlot },
    });
  }

  positionLabel(slot: number | null, laneRole: number | null): string {
    if (slot === null) return 'Consulta de draft';
    const team = (slot & 0b1000_0000) === 0 ? 'Radiant' : 'Dire';
    const role = laneRoleLabel(laneRole);
    return role ? `${team} · ${role}` : team;
  }

  heroPortraitUrl(heroLocalizedName: string): string {
    const slug = heroLocalizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
