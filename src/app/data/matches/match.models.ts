export interface MatchPlayerPreview {
  playerSlot: number;
  isRadiant: boolean;
  heroId: number;
  heroInternalName: string;
  heroLocalizedName: string;
  laneRole: number | null;
  kills: number;
  deaths: number;
  assists: number;
}

export interface MatchPlayersDto {
  matchId: number;
  durationSeconds: number | null;
  radiantWin: boolean | null;
  isParsed: boolean;
  players: MatchPlayerPreview[];
}
