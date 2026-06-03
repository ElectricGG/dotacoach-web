import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MatchPlayersDto } from './match.models';

@Injectable({ providedIn: 'root' })
export class MatchApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/matches`;

  getPlayers(matchId: number): Observable<MatchPlayersDto> {
    return this.http.get<MatchPlayersDto>(`${this.base}/${matchId}/players`);
  }
}
