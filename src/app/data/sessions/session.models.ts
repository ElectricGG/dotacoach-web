export interface CreateSessionRequest {
  matchId: number;
  playerSlot: number;
  notes?: string | null;
}

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

export interface SessionResponseDto {
  sessionId: string;
  matchId: number;
  playerSlot: number;
  heroId: number;
  heroLocalizedName: string;
  laneRole: number | null;
  status: 'Active' | 'Expired' | 'Archived' | string;
  createdAt: string;
  expiresAt: string;
  totalTokensUsed: number;
  remainingMessages: number;
  messages: ChatMessageDto[];
}

export interface SessionSummaryDto {
  sessionId: string;
  matchId: number;
  playerSlot: number;
  heroId: number;
  heroLocalizedName: string;
  laneRole: number | null;
  status: 'Active' | 'Expired' | 'Archived' | string;
  createdAt: string;
  expiresAt: string;
  remainingMessages: number;
}
