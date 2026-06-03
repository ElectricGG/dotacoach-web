export interface HeroDto {
  id: number;
  internalName: string;
  localizedName: string;
}

export type TargetRole = 'carry' | 'mid' | 'off' | 'sup';

export interface DraftRecommendationRequest {
  enemyHeroIds: number[];
  allyHeroIds?: number[];
  targetRole?: TargetRole | null;
}

export interface MatchupBreakdown {
  enemyHeroId: number;
  enemyHeroLocalizedName: string;
  winrate: number;
  gamesPlayed: number;
}

export interface DraftRecommendation {
  heroId: number;
  heroInternalName: string;
  heroLocalizedName: string;
  advantageVsLineup: number | null;
  sampleGames: number;
  breakdown: MatchupBreakdown[];
}

export interface DraftRecommendationResponse {
  candidates: DraftRecommendation[];
}

export interface BuildItem {
  itemId: number;
  internalName: string;
  displayName: string;
  imgPath: string;
  cost: number;
  frequency: number;
}

export interface BuildPhase {
  phaseKey: string;
  phaseLabel: string;
  items: BuildItem[];
}

export interface HeroBuildResponse {
  heroId: number;
  phases: BuildPhase[];
}

export interface DraftBuildRequest {
  heroId: number;
  enemyHeroIds?: number[];
}

export interface AiBuildItem {
  itemId: number;
  internalName: string;
  displayName: string;
  imgPath: string;
  cost: number;
  reason: string;
}

export interface AiBuildPhase {
  phaseKey: string;
  phaseLabel: string;
  items: AiBuildItem[];
}

export interface AiBuildResponse {
  heroId: number;
  phases: AiBuildPhase[];
  strategySummary: string | null;
}
