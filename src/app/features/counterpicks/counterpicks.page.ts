import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DraftApi } from '../../data/draft/draft.api';
import {
  AiBuildResponse,
  DraftRecommendation,
  HeroBuildResponse,
  HeroDto,
  TargetRole,
} from '../../data/draft/draft.models';

type Pick = 'none' | 'enemy' | 'ally';
export type BuildMode = 'popular' | 'ai';

@Component({
  selector: 'app-counterpicks',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './counterpicks.page.html',
  styleUrls: ['./counterpicks.page.scss'],
})
export class CounterpicksPage implements OnInit {
  private readonly api = inject(DraftApi);

  readonly heroes = signal<HeroDto[]>([]);
  readonly loadingHeroes = signal(false);
  readonly heroesError = signal<string | null>(null);

  /** Map heroId → Pick. Solo guardamos los != 'none' para no inflar. */
  private readonly picksMap = signal<Map<number, Pick>>(new Map());

  readonly recommendations = signal<DraftRecommendation[]>([]);
  readonly loadingRecs = signal(false);
  readonly recsError = signal<string | null>(null);

  readonly query = signal('');
  readonly targetRole = signal<TargetRole | null>(null);
  /** Lado que se marca al tocar un héroe en la grilla. Toggle global. */
  readonly currentSide = signal<'enemy' | 'ally'>('enemy');

  setSide(side: 'enemy' | 'ally'): void {
    this.currentSide.set(side);
  }

  readonly roleOptions: { value: TargetRole; label: string }[] = [
    { value: 'carry', label: 'Carry' },
    { value: 'mid', label: 'Mid' },
    { value: 'off', label: 'Off' },
    { value: 'sup', label: 'Sup' },
  ];

  setRole(role: TargetRole | null): void {
    this.targetRole.set(this.targetRole() === role ? null : role);
  }

  /** heroId del candidato cuya build está expandida en la lista. null = colapsado. */
  readonly expandedHeroId = signal<number | null>(null);
  /** Modo de build seleccionado para el héroe expandido. */
  readonly buildMode = signal<BuildMode>('popular');

  /** Cache de builds populares por heroId (no dependen de enemies). */
  private readonly popularBuildCache = new Map<number, HeroBuildResponse>();
  /** Cache de builds IA por (heroId + lineup enemigo). */
  private readonly aiBuildCache = new Map<string, AiBuildResponse>();

  readonly loadingBuildFor = signal<number | null>(null);
  readonly buildError = signal<string | null>(null);

  private aiCacheKey(heroId: number): string {
    const enemyIds = this.enemies()
      .map((h) => h.id)
      .sort((a, b) => a - b);
    return `${heroId}:${enemyIds.join(',')}`;
  }

  async toggleBuild(heroId: number): Promise<void> {
    if (this.expandedHeroId() === heroId) {
      this.expandedHeroId.set(null);
      return;
    }
    this.expandedHeroId.set(heroId);
    // Siempre arrancamos en popular: es instantáneo y no quema tokens si el user
    // solo está chequeando rápido. Si quiere la versión IA, toca el tab.
    this.buildMode.set('popular');
    this.buildError.set(null);
    await this.ensureBuildLoaded(heroId);
  }

  async setBuildMode(heroId: number, mode: BuildMode): Promise<void> {
    this.buildMode.set(mode);
    this.buildError.set(null);
    await this.ensureBuildLoaded(heroId);
  }

  private async ensureBuildLoaded(heroId: number): Promise<void> {
    const mode = this.buildMode();
    if (mode === 'popular') {
      if (this.popularBuildCache.has(heroId)) return;
      this.loadingBuildFor.set(heroId);
      try {
        const build = await firstValueFrom(this.api.popularBuild({ heroId }));
        this.popularBuildCache.set(heroId, build);
      } catch (e) {
        console.warn('[Counterpicks] popular build failed', e);
        this.buildError.set('No se pudo cargar la build.');
      } finally {
        this.loadingBuildFor.set(null);
      }
    } else {
      const key = this.aiCacheKey(heroId);
      if (this.aiBuildCache.has(key)) return;
      this.loadingBuildFor.set(heroId);
      try {
        const build = await firstValueFrom(
          this.api.aiBuild({
            heroId,
            enemyHeroIds: this.enemies().map((h) => h.id),
          }),
        );
        this.aiBuildCache.set(key, build);
      } catch (e) {
        console.warn('[Counterpicks] ai build failed', e);
        this.buildError.set('No se pudo generar la build con IA. Probá la versión más usada.');
      } finally {
        this.loadingBuildFor.set(null);
      }
    }
  }

  popularBuildFor(heroId: number): HeroBuildResponse | null {
    return this.popularBuildCache.get(heroId) ?? null;
  }

  aiBuildFor(heroId: number): AiBuildResponse | null {
    return this.aiBuildCache.get(this.aiCacheKey(heroId)) ?? null;
  }

  itemImgUrl(imgPath: string): string {
    if (!imgPath) return '';
    return `https://cdn.cloudflare.steamstatic.com${imgPath}`;
  }

  formatCost(cost: number): string {
    if (cost <= 0) return '';
    if (cost >= 1000) return `${(cost / 1000).toFixed(1)}k`;
    return cost.toString();
  }

  readonly enemies = computed(() => this.filterByPick('enemy'));
  readonly allies = computed(() => this.filterByPick('ally'));

  readonly filteredHeroes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.heroes();
    if (!q) return list;
    return list.filter((h) => h.localizedName.toLowerCase().includes(q));
  });

  readonly canRequest = computed(() => this.enemies().length > 0);

  /** Throttle: re-pedimos las recomendaciones cuando cambia el set de picks. */
  private requestSeq = 0;

  constructor() {
    effect(() => {
      // Triggers: cambia el set de picks o el rol → refetch
      this.picksMap();
      this.targetRole();
      queueMicrotask(() => this.refreshRecommendations());
    });
  }

  ngOnInit(): void {
    this.loadHeroes();
  }

  pickOf(heroId: number): Pick {
    return this.picksMap().get(heroId) ?? 'none';
  }

  /** Marca/desmarca un héroe usando el lado activo (enemy/ally).
   *  - Si el héroe ya está en el lado activo → lo saca.
   *  - Si está en el otro lado → lo cambia al lado activo.
   *  - Si está libre → lo marca con el lado activo (respetando cap de 5). */
  togglePick(hero: HeroDto): void {
    const current = this.pickOf(hero.id);
    const side = this.currentSide();
    const map = new Map(this.picksMap());

    if (current === side) {
      map.delete(hero.id);
    } else {
      const sameSideCount = [...map.values()].filter((p) => p === side).length;
      // Si el hero ya estaba en el otro lado, el cap no se rompe (cambia de bando, no agrega).
      if (current !== side && sameSideCount >= 5 && current === 'none') {
        return;
      }
      map.set(hero.id, side);
    }
    this.picksMap.set(map);
  }

  /** Tap directo sobre una mini del band: lo saca, independiente del lado activo. */
  removePick(hero: HeroDto): void {
    const map = new Map(this.picksMap());
    map.delete(hero.id);
    this.picksMap.set(map);
  }

  clearAll(): void {
    this.picksMap.set(new Map());
  }

  heroPortraitUrl(internalName: string): string {
    const slug = internalName.replace(/^npc_dota_hero_/, '');
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  }

  formatAdvantage(adv: number | null): string {
    if (adv === null) return '—';
    return `${(adv * 100).toFixed(1)}%`;
  }

  formatGames(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }

  private filterByPick(pick: Pick): HeroDto[] {
    const map = this.picksMap();
    return this.heroes().filter((h) => map.get(h.id) === pick);
  }

  private async loadHeroes(): Promise<void> {
    this.loadingHeroes.set(true);
    this.heroesError.set(null);
    try {
      const heroes = await firstValueFrom(this.api.listHeroes());
      this.heroes.set(heroes);
    } catch (e) {
      console.warn('[Counterpicks] loadHeroes failed', e);
      this.heroesError.set('No se pudo cargar el listado de héroes.');
    } finally {
      this.loadingHeroes.set(false);
    }
  }

  private async refreshRecommendations(): Promise<void> {
    const enemyIds = this.enemies().map((h) => h.id);
    const allyIds = this.allies().map((h) => h.id);

    if (enemyIds.length === 0) {
      this.recommendations.set([]);
      this.recsError.set(null);
      return;
    }

    const seq = ++this.requestSeq;
    this.loadingRecs.set(true);
    this.recsError.set(null);

    try {
      const res = await firstValueFrom(
        this.api.recommend({
          enemyHeroIds: enemyIds,
          allyHeroIds: allyIds,
          targetRole: this.targetRole(),
        }),
      );
      // Si llegó otra request después, descartamos esta para evitar resultados stale.
      if (seq !== this.requestSeq) return;
      this.recommendations.set(res.candidates);
    } catch (e) {
      if (seq !== this.requestSeq) return;
      console.warn('[Counterpicks] recommend failed', e);
      this.recsError.set('No se pudieron calcular las recomendaciones.');
    } finally {
      if (seq === this.requestSeq) {
        this.loadingRecs.set(false);
      }
    }
  }
}
