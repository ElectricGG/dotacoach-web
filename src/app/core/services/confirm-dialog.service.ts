import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ActiveDialog extends ConfirmOptions {
  resolver: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly active = signal<ActiveDialog | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.active.set({
        ...options,
        resolver: resolve,
      });
    });
  }

  resolve(result: boolean): void {
    const current = this.active();
    if (!current) return;
    current.resolver(result);
    this.active.set(null);
  }
}
