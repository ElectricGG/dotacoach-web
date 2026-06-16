export interface CreateSessionRequest {
  matchId: number;
  playerSlot: number;
  notes?: string | null;
}

export interface CreateDraftConsultationRequest {
  heroId: number;
  enemyHeroIds: number[];
  targetRole?: 'carry' | 'mid' | 'off' | 'sup' | null;
}

export type SessionType = 'MatchAnalysis' | 'DraftConsultation';

/** Resultado reportado para sesiones de DraftConsultation. */
export type SessionOutcome = 'Unknown' | 'Won' | 'Lost';

export interface SendMessageRequest {
  message: string;
}

export interface ChatMessageDto {
  id: string;
  role: 'User' | 'Assistant' | 'System' | string;
  content: string;
  createdAt: string;
  tokensUsed: number | null;
}

export interface RelevantItemDto {
  itemId: number;
  internalName: string;
  displayName: string;
  imgPath: string;
  cost: number;
}

export interface SessionResponseDto {
  sessionId: string;
  type: SessionType;
  matchId: number | null;
  playerSlot: number | null;
  heroId: number;
  heroLocalizedName: string;
  laneRole: number | null;
  status: 'Active' | 'Expired' | 'Archived' | string;
  outcome: SessionOutcome;
  createdAt: string;
  expiresAt: string;
  totalTokensUsed: number;
  remainingMessages: number;
  messages: ChatMessageDto[];
  /** Solo para DraftConsultation: items populares del héroe, para renderizar inline cuando el coach los cita. */
  relevantItems: RelevantItemDto[] | null;
}

export interface SessionSummaryDto {
  sessionId: string;
  type: SessionType;
  matchId: number | null;
  playerSlot: number | null;
  heroId: number;
  heroLocalizedName: string;
  laneRole: number | null;
  status: 'Active' | 'Expired' | 'Archived' | string;
  outcome: SessionOutcome;
  createdAt: string;
  expiresAt: string;
  remainingMessages: number;
}
