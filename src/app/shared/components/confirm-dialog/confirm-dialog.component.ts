import { Component, HostListener, computed, inject } from '@angular/core';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (dialog(); as d) {
      <div class="dialog-backdrop" (click)="cancel()">
        <div
          class="dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="d.title ? 'dialog-title' : null"
          (click)="$event.stopPropagation()">
          @if (d.title) {
            <h2 id="dialog-title" class="dialog-title">{{ d.title }}</h2>
          }
          <p class="dialog-message">{{ d.message }}</p>
          <div class="dialog-actions">
            <button class="btn btn-ghost" (click)="cancel()">
              {{ d.cancelText ?? 'Cancelar' }}
            </button>
            <button
              class="btn"
              [class.btn-primary]="!d.danger"
              [class.btn-danger]="d.danger"
              (click)="confirm()">
              {{ d.confirmText ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  private readonly service = inject(ConfirmDialogService);
  readonly dialog = computed(() => this.service.active());

  confirm(): void {
    this.service.resolve(true);
  }

  cancel(): void {
    this.service.resolve(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog()) this.cancel();
  }
}
