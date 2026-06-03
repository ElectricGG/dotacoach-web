import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStore } from '../../data/auth/auth.store';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './subscription.page.html',
  styleUrls: ['./subscription.page.scss'],
})
export class SubscriptionPage {
  private readonly authStore = inject(AuthStore);
  readonly user = this.authStore.currentUser;
  readonly notified = signal(false);

  notifyMe(): void {
    // En MVP solo dejamos constancia local. Cuando se integre Stripe/MP esto
    // dispara el checkout real.
    this.notified.set(true);
    setTimeout(() => this.notified.set(false), 5000);
  }
}
