// DTOs que reflejan los del backend (DotaCoach.Application/DTOs/Auth/*).

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  email: string;
  tier: 'Free' | 'Pro' | 'Team' | string;
  status: 'Active' | 'Cancelled' | 'Expired' | 'PastDue' | string;
  createdAt: string;
  subscriptionExpiresAt: string | null;
  steamAccountId: number | null;
}

/**
 * Respuesta de los endpoints de autenticación. El JWT NO viene en el body:
 * lo entrega el backend en una cookie httpOnly que el navegador maneja solo.
 */
export interface SessionResponse {
  expiresAt: string;
  user: UserDto;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SendVerificationCodeRequest {
  email: string;
}

export interface ConfirmVerificationCodeRequest {
  email: string;
  code: string;
}
