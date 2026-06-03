import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserDto } from '../auth/auth.models';
import { LinkSteamAccountRequest, RecentMatchDto } from './player.models';

@Injectable({ providedIn: 'root' })
export class PlayerApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users/me`;

  linkSteam(body: LinkSteamAccountRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/steam`, body);
  }

  recentMatches(): Observable<RecentMatchDto[]> {
    return this.http.get<RecentMatchDto[]>(`${this.base}/recent-matches`);
  }
}
