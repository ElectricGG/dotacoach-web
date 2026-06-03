import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { ToastService } from '../../core/services/toast.service';
import { AuthStore } from '../../data/auth/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrls: ['./auth-shared.scss'],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly showPassword = signal(false);
  readonly isLoading = this.authStore.isLoading;
  readonly error = this.authStore.error;

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const { email, password } = this.form.getRawValue();
      await this.authStore.login(email, password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.router.navigateByUrl(returnUrl ?? '/app/home');
    } catch (e) {
      // 403 con code=email_not_verified → redirigir a verify-email
      if (
        e instanceof HttpErrorResponse &&
        e.status === 403 &&
        (e.error as { code?: string } | null)?.code === 'email_not_verified'
      ) {
        const email = this.form.controls.email.value;
        this.toast.info('Tu cuenta no fue verificada. Te enviamos un código a tu correo.');
        try {
          await this.authStore.sendVerificationCode(email);
        } catch {
          // si falla por cooldown o lo que sea, igual seguimos al verify-email
        }
        this.router.navigate(['/verify-email'], { queryParams: { email } });
        return;
      }
      // Otros errores quedan expuestos en this.error vía AuthStore
    }
  }

  isInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
