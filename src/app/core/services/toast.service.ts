import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

let toastIdCounter = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, variant: ToastVariant = 'info', durationMs = 5000): void {
    const toast: Toast = {
      id: ++toastIdCounter,
      message,
      variant,
      durationMs,
    };
    this.toasts.update((current) => [...current, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  success(message: string, durationMs?: number): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show(message, 'error', durationMs ?? 7000);
  }

  warning(message: string, durationMs?: number): void {
    this.show(message, 'warning', durationMs);
  }

  info(message: string, durationMs?: number): void {
    this.show(message, 'info', durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
