import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChangePasswordRequest,
  ConfirmVerificationCodeRequest,
  LoginRequest,
  RegisterRequest,
  SendVerificationCodeRequest,
  SessionResponse,
  UserDto,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  register(body: RegisterRequest): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.base}/auth/register`, body);
  }

  login(body: LoginRequest): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.base}/auth/login`, body);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout`, {});
  }

  me(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.base}/users/me`);
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/users/me/password`, body);
  }

  sendVerificationCode(body: SendVerificationCodeRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/verify-email/send`, body);
  }

  confirmVerificationCode(body: ConfirmVerificationCodeRequest): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.base}/auth/verify-email/confirm`, body);
  }
}
