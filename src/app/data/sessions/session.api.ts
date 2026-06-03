import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateSessionRequest,
  SendMessageRequest,
  SessionResponseDto,
  SessionSummaryDto,
} from './session.models';

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sessions`;

  create(body: CreateSessionRequest): Observable<SessionResponseDto> {
    return this.http.post<SessionResponseDto>(this.base, body, {
      observe: 'response',
    }) as unknown as Observable<SessionResponseDto>;
  }

  /** Variante que devuelve también el status code para diferenciar 201 vs 202. */
  createWithStatus(body: CreateSessionRequest) {
    return this.http.post<SessionResponseDto>(this.base, body, {
      observe: 'response',
    });
  }

  getById(id: string): Observable<SessionResponseDto> {
    return this.http.get<SessionResponseDto>(`${this.base}/${id}`);
  }

  list(take = 20): Observable<SessionSummaryDto[]> {
    return this.http.get<SessionSummaryDto[]>(`${this.base}?take=${take}`);
  }

  sendMessage(id: string, body: SendMessageRequest): Observable<SessionResponseDto> {
    return this.http.post<SessionResponseDto>(`${this.base}/${id}/messages`, body);
  }
}
