import { Component, inject } from '@angular/core';

import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="false">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class]="'variant-' + toast.variant" role="status">
          <span class="toast-icon">
            @switch (toast.variant) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @default { ℹ }
            }
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="dismiss(toast.id)" aria-label="Cerrar">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast-host.component.scss'],
})
export class ToastHostComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: Toast['id']): void {
    this.toastService.dismiss(id);
  }
}
