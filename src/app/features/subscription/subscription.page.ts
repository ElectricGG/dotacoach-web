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

  /** Inicia el checkout de Mercado Pago y redirige al init_point. */
  startCheckout(tier: SubscriptionTier): void {
    if (this.checkoutLoading()) return;
    this.checkoutLoading.set(tier);
    this.billing.createCheckout({ tier }).subscribe({
      next: ({ initPoint }) => {
        // Salimos de la SPA hacia el checkout de Mercado Pago.
        window.location.href = initPoint;
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

  /**
   * Al volver de Mercado Pago, la URL trae ?preapproval_id=... Lo mandamos al
   * backend para confirmar y activar el tier del usuario autenticado.
   */
  private handleReturnStatus(): void {
    const preapprovalId = this.route.snapshot.queryParamMap.get('preapproval_id');
    if (preapprovalId) {
      this.billing.confirm(preapprovalId).subscribe({
        next: (status) => {
          this.status.set(status);
          if (status.isActive) {
            this.toast.success('¡Listo! Tu plan Mentor Pro está activo. 🎉');
          } else {
            this.toast.info('Pago recibido. Tu plan se activará en unos segundos.');
          }
        },
        error: () => this.toast.error('No pudimos confirmar tu suscripción. Si pagaste, escríbenos.'),
      });
      return;
    }

    if (this.route.snapshot.queryParamMap.get('status') === 'failure') {
      this.toast.error('El pago no se completó. No se te cobró nada.');
    }
  }
}
