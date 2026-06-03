import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AiBuildResponse,
  DraftBuildRequest,
  DraftRecommendationRequest,
  DraftRecommendationResponse,
  HeroBuildResponse,
  HeroDto,
} from './draft.models';

@Injectable({ providedIn: 'root' })
export class DraftApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listHeroes(): Observable<HeroDto[]> {
    return this.http.get<HeroDto[]>(`${this.base}/heroes`);
  }

  recommend(body: DraftRecommendationRequest): Observable<DraftRecommendationResponse> {
    return this.http.post<DraftRecommendationResponse>(`${this.base}/draft/recommend`, body);
  }

  popularBuild(body: DraftBuildRequest): Observable<HeroBuildResponse> {
    return this.http.post<HeroBuildResponse>(`${this.base}/draft/build/popular`, body);
  }

  aiBuild(body: DraftBuildRequest): Observable<AiBuildResponse> {
    return this.http.post<AiBuildResponse>(`${this.base}/draft/build/ai`, body);
  }
}
