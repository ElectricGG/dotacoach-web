export interface LinkSteamAccountRequest {
  steamId: number | null;
}

export interface RecentMatchDto {
  matchId: number;
  playerSlot: number;
  heroId: number;
  heroLocalizedName: string;
  isRadiant: boolean;
  won: boolean;
  durationSeconds: number;
  kills: number;
  deaths: number;
  assists: number;
  laneRole: number | null;
  startTime: string;
  isParsed: boolean;
}
