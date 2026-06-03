import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, firstValueFrom, from, interval, takeUntil } from 'rxjs';

import { BrowserNotificationService } from '../../core/services/browser-notification.service';
import { MatchApi } from '../../data/matches/match.api';
import { MatchPlayerPreview, MatchPlayersDto } from '../../data/matches/match.models';
import { SessionStore } from '../../data/sessions/session.store';

const PARSING_POLL_INTERVAL_MS = 30_000;

const LANE_ROLE_LABELS: Record<number, string> = {
  1: 'Safe',
  2: 'Mid',
  3: 'Offlane',
  4: 'Jungle',
};

@Component({
  selector: 'app-new-analysis',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './new-analysis.page.html',
  styleUrls: ['./new-analysis.page.scss'],
})
export class NewAnalysisPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sessions = inject(SessionStore);
  private readonly matches = inject(MatchApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(BrowserNotificationService);

  /** Señal interna para cortar el polling cuando termina o se cancela.
   *  Se completa también automáticamente vía takeUntilDestroyed. */
  private readonly pollStop$ = new Subject<void>();

  readonly form = this.fb.nonNullable.group({
    matchId: [
      '',
      [Validators.required, Validators.pattern(/^\d{6,15}$/)],
    ],
    playerSlot: [-1, [Validators.required, this.slotValidator]],
    notes: ['', [Validators.maxLength(500)]],
  });

  readonly isLoading = this.sessions.isLoading;
  readonly loadingPhase = this.sessions.loadingPhase;
  readonly error = this.sessions.error;
  readonly parsingMatchId = signal<number | null>(null);

  readonly preview = signal<MatchPlayersDto | null>(null);
  readonly loadingPlayers = signal(false);
  readonly playersError = signal<string | null>(null);

  readonly radiantPlayers = computed(() =>
    (this.preview()?.players ?? []).filter((p) => p.isRadiant),
  );
  readonly direPlayers = computed(() =>
    (this.preview()?.players ?? []).filter((p) => !p.isRadiant),
  );

  readonly notesLength = computed(() =>
    (this.form.controls.notes.value ?? '').length,
  );

  ngOnInit(): void {
    // Cuando llegamos desde "Analizar" en Home (lista de partidas de Steam),
    // recibimos matchId y playerSlot como query params: precargamos el form
    // y traemos los jugadores para que el héroe quede pre-seleccionado.
    const params = this.route.snapshot.queryParamMap;
    const matchIdParam = params.get('matchId');
    const playerSlotParam = params.get('playerSlot');
    if (matchIdParam && /^\d{6,15}$/.test(matchIdParam)) {
      this.form.controls.matchId.setValue(matchIdParam);
      this.loadPlayers().then(() => {
        if (playerSlotParam !== null) {
          const slot = Number(playerSlotParam);
          if (Number.isFinite(slot)) {
            this.form.controls.playerSlot.setValue(slot);
          }
        }
      });
    }
  }

  selectPlayer(player: MatchPlayerPreview): void {
    this.form.controls.playerSlot.setValue(player.playerSlot);
    this.form.controls.playerSlot.markAsTouched();
  }

  isPlayerSelected(player: MatchPlayerPreview): boolean {
    return this.form.controls.playerSlot.value === player.playerSlot;
  }

  isInvalid(field: 'matchId' | 'playerSlot' | 'notes'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onPasteMatchId(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const match = pasted.match(/(\d{6,15})/);
    if (match) {
      event.preventDefault();
      this.form.controls.matchId.setValue(match[1]);
    }
  }

  resetPreview(): void {
    this.preview.set(null);
    this.playersError.set(null);
    this.form.controls.playerSlot.setValue(-1);
  }

  async loadPlayers(): Promise<void> {
    const matchIdControl = this.form.controls.matchId;
    matchIdControl.markAsTouched();
    if (matchIdControl.invalid) return;

    const matchId = Number(matchIdControl.value);
    this.loadingPlayers.set(true);
    this.playersError.set(null);
    this.preview.set(null);
    this.form.controls.playerSlot.setValue(-1);

    try {
      const result = await firstValueFrom(this.matches.getPlayers(matchId));
      this.preview.set(result);
    } catch (e) {
      this.playersError.set(this.describeMatchError(e));
    } finally {
      this.loadingPlayers.set(false);
    }
  }

  laneRoleLabel(role: number | null): string {
    if (role == null) return '';
    return LANE_ROLE_LABELS[role] ?? '';
  }

  heroPortraitUrl(internalName: string, localizedName: string): string {
    const base = (internalName ?? '').replace(/^npc_dota_hero_/, '');
    const slug = base
      ? base
      : localizedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const result = await this.submitOnce();

      if (result.kind === 'parsing') {
        this.parsingMatchId.set(result.matchId);
        // Pedimos permiso al entrar al estado parsing: ya el user aceptó esperar.
        this.notifications.requestPermission();
        this.startPolling();
        return;
      }

      this.router.navigate(['/app/sessions', result.session.sessionId]);
    } catch {
      // error queda en this.error
    }
  }

  retryAfterParsing(): void {
    this.stopPolling();
    this.parsingMatchId.set(null);
    this.onSubmit();
  }

  cancelParsing(): void {
    this.stopPolling();
    this.parsingMatchId.set(null);
  }

  private startPolling(): void {
    this.stopPolling();
    interval(PARSING_POLL_INTERVAL_MS)
      .pipe(
        // exhaustMap evita superponer reintentos si uno demora más que el tick.
        // El catchError interno aísla fallos: un tick que falla no mata el stream.
        exhaustMap(() =>
          from(this.submitOnce()).pipe(
            catchError((e) => {
              console.warn('[NewAnalysis] poll attempt failed; will retry', e);
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.pollStop$),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (result.kind !== 'created') return;
        const matchId = this.parsingMatchId();
        this.stopPolling();
        this.parsingMatchId.set(null);
        this.notifications.notify('Análisis de partida listo', {
          body: `OpenDota terminó de procesar la partida ${matchId}. Tu análisis está esperando.`,
          tag: `match-${matchId}`,
          icon: '/assets/icon/favicon.png',
        });
        this.router.navigate(['/app/sessions', result.session.sessionId]);
      });
  }

  private stopPolling(): void {
    this.pollStop$.next();
  }

  private submitOnce() {
    const { matchId, playerSlot, notes } = this.form.getRawValue();
    return this.sessions.createSession({
      matchId: Number(matchId),
      playerSlot,
      notes: notes?.trim() || null,
    });
  }

  private slotValidator(control: { value: number }) {
    return control.value !== -1 ? null : { required: true };
  }

  private describeMatchError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) return 'No se pudo conectar al servidor.';
      if (e.status === 404) return 'No se encontró esa partida en OpenDota.';
      if (e.status === 502) return 'OpenDota no respondió. Intentá de nuevo.';
      const detail = (e.error as { detail?: string } | null)?.detail;
      if (detail) return detail;
    }
    return 'No se pudieron cargar los jugadores. Verificá el match ID.';
  }
}
