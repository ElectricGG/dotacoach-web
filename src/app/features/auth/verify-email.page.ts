import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { ToastService } from '../../core/services/toast.service';
import { AuthStore } from '../../data/auth/auth.store';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [IonContent, RouterLink],
  templateUrl: './verify-email.page.html',
  styleUrls: ['./auth-shared.scss', './verify-email.page.scss'],
})
export class VerifyEmailPage implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  @ViewChildren('digit') digits?: QueryList<ElementRef<HTMLInputElement>>;

  readonly email = signal<string>('');
  readonly digitsValue = signal<string[]>(['', '', '', '', '', '']);
  readonly isLoading = signal(false);
  readonly resendCooldown = signal(0);
  readonly error = signal<string | null>(null);

  readonly isComplete = computed(() => this.digitsValue().every((d) => /^\d$/.test(d)));
  readonly fullCode = computed(() => this.digitsValue().join(''));

  private cooldownTimer?: ReturnType<typeof setInterval>;

  ngAfterViewInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (!emailParam) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.email.set(emailParam);
    queueMicrotask(() => this.digits?.first?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');

    if (raw.length === 0) {
      this.setDigit(index, '');
      return;
    }

    if (raw.length === 1) {
      this.setDigit(index, raw);
      this.focusNext(index);
      this.maybeAutoSubmit();
      return;
    }

    // Caso de pegar varios dígitos de una en un input intermedio
    this.applyPaste(raw, index);
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digitsValue()[index]) {
      this.focusPrev(index);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.focusPrev(index);
      event.preventDefault();
    }
    if (event.key === 'ArrowRight') {
      this.focusNext(index);
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '');
    if (digits.length === 0) return;
    event.preventDefault();
    this.applyPaste(digits, 0);
  }

  async confirm(): Promise<void> {
    if (!this.isComplete() || this.isLoading()) return;

    this.error.set(null);
    this.isLoading.set(true);

    try {
      await this.authStore.confirmVerificationCode(this.email(), this.fullCode());
      this.toast.success('¡Cuenta verificada!');
      this.router.navigateByUrl('/app/home');
    } catch (e) {
      this.error.set(this.describeError(e));
      // limpiar inputs solo si el código es inválido (no si fue error de red)
      if (e instanceof HttpErrorResponse && e.status === 400) {
        this.digitsValue.set(['', '', '', '', '', '']);
        queueMicrotask(() => this.digits?.first?.nativeElement.focus());
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async resend(): Promise<void> {
    if (this.resendCooldown() > 0) return;

    try {
      await this.authStore.sendVerificationCode(this.email());
      this.toast.success('Código reenviado.');
      this.startCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 429) {
        const retry = (e.error as { retryAfterSeconds?: number } | null)?.retryAfterSeconds
          ?? RESEND_COOLDOWN_SECONDS;
        this.startCooldown(retry);
        this.toast.warning(`Espera ${retry}s antes de pedir otro código.`);
      } else {
        this.toast.error('No se pudo reenviar. Intenta de nuevo.');
      }
    }
  }

  private setDigit(index: number, value: string): void {
    const next = [...this.digitsValue()];
    next[index] = value;
    this.digitsValue.set(next);
  }

  private applyPaste(rawDigits: string, startIndex: number): void {
    const next = [...this.digitsValue()];
    let i = startIndex;
    for (const ch of rawDigits) {
      if (i >= next.length) break;
      next[i] = ch;
      i++;
    }
    this.digitsValue.set(next);

    // Sincronizar inputs nativos (Angular necesita un microtask)
    queueMicrotask(() => {
      const inputs = this.digits?.toArray() ?? [];
      next.forEach((d, idx) => {
        if (inputs[idx]) inputs[idx].nativeElement.value = d;
      });
      const focusIndex = Math.min(i, next.length - 1);
      inputs[focusIndex]?.nativeElement.focus();
      this.maybeAutoSubmit();
    });
  }

  private focusNext(index: number): void {
    const inputs = this.digits?.toArray() ?? [];
    inputs[index + 1]?.nativeElement.focus();
  }

  private focusPrev(index: number): void {
    const inputs = this.digits?.toArray() ?? [];
    inputs[index - 1]?.nativeElement.focus();
  }

  private maybeAutoSubmit(): void {
    if (this.isComplete() && !this.isLoading()) {
      this.confirm();
    }
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      const next = this.resendCooldown() - 1;
      if (next <= 0) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = undefined;
      } else {
        this.resendCooldown.set(next);
      }
    }, 1000);
  }

  private describeError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error as { detail?: string; code?: string } | null;
      if (e.status === 400 && body?.code === 'invalid_verification_code') {
        return body.detail ?? 'Código incorrecto.';
      }
      if (body?.detail) return body.detail;
    }
    return 'No se pudo verificar el código. Intenta de nuevo.';
  }
}
