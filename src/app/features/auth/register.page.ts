import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { AuthStore } from '../../data/auth/auth.store';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonContent, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrls: ['./auth-shared.scss'],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

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
      await this.authStore.register(email, password);
      this.router.navigate(['/verify-email'], { queryParams: { email } });
    } catch {
      // Error queda en this.error
    }
  }

  isInvalid(field: 'email' | 'password' | 'confirmPassword' | 'acceptTerms'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  hasMismatch(): boolean {
    const confirm = this.form.controls.confirmPassword;
    return (
      this.form.errors?.['passwordsMismatch'] &&
      (confirm.dirty || confirm.touched) &&
      confirm.value.length > 0
    );
  }
}
