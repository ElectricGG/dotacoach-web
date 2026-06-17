import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthStore } from '../../data/auth/auth.store';
import { BillingApi } from '../../data/billing/billing.api';
import { PlanDto, SubscriptionStatusDto, SubscriptionTier } from '../../data/billing/billing.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './subscription.page.html',
  styleUrls: ['./subscription.page.scss'],
})
export class SubscriptionPage implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly billing = inject(BillingApi);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.authStore.currentUser;
  readonly plans = signal<PlanDto[]>([]);
  readonly status = signal<SubscriptionStatusDto | null>(null);
  readonly checkoutLoading = signal<SubscriptionTier | null>(null);
  readonly cancelLoading = signal(false);

  ngOnInit(): void {
    this.handleReturnStatus();
    this.billing.getPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => this.toast.error('No pudimos cargar los planes.'),
    });
    this.refreshStatus();
  }

  /** Inicia el checkout de Lemon Squeezy y redirige a su URL. */
  startCheckout(tier: SubscriptionTier): void {
    if (this.checkoutLoading()) return;
    this.checkoutLoading.set(tier);
    this.billing.createCheckout({ tier }).subscribe({
      next: ({ url }) => {
        // Salimos de la SPA hacia el checkout de Lemon Squeezy.
        window.location.href = url;
      },
      error: () => {
        this.checkoutLoading.set(null);
        this.toast.error('No pudimos iniciar el pago. Intenta de nuevo.');
      },
    });
  }

  cancel(): void {
    this.cancelLoading.set(true);
    this.billing.cancel().subscribe({
      next: () => {
        this.cancelLoading.set(false);
        this.toast.success('Suscripción cancelada. Mantienes el acceso hasta el vencimiento.');
        this.refreshStatus();
      },
      error: () => {
        this.cancelLoading.set(false);
        this.toast.error('No pudimos cancelar la suscripción.');
      },
    });
  }

  private refreshStatus(): void {
    this.billing.getMyStatus().subscribe({
      next: (status) => this.status.set(status),
      error: () => {
        /* silencioso: la página sigue funcionando con los datos del usuario */
      },
    });
  }

  /** Lee ?status=success|pending|failure que Mercado Pago agrega al volver. */
  private handleReturnStatus(): void {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status === 'success') {
      this.toast.success('¡Pago recibido! Tu plan se activa en unos segundos.');
    } else if (status === 'pending') {
      this.toast.info('Tu pago quedó pendiente. Te avisamos cuando se confirme.');
    } else if (status === 'failure') {
      this.toast.error('El pago no se completó. No se te cobró nada.');
    }
  }
}
