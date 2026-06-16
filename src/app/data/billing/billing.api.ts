import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CheckoutResponse,
  CreateCheckoutRequest,
  PaymentHistoryItemDto,
  PlanDto,
  SubscriptionStatusDto,
} from './billing.models';

@Injectable({ providedIn: 'root' })
export class BillingApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/billing`;

  getPlans(): Observable<PlanDto[]> {
    return this.http.get<PlanDto[]>(`${this.base}/plans`);
  }

  getMyStatus(): Observable<SubscriptionStatusDto> {
    return this.http.get<SubscriptionStatusDto>(`${this.base}/me`);
  }

  getMyPayments(): Observable<PaymentHistoryItemDto[]> {
    return this.http.get<PaymentHistoryItemDto[]>(`${this.base}/me/payments`);
  }

  createCheckout(body: CreateCheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/checkout`, body);
  }

  cancel(): Observable<void> {
    return this.http.post<void>(`${this.base}/cancel`, {});
  }
}
