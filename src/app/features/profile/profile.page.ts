import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthStore } from '../../data/auth/auth.store';
import { PlayerStore } from '../../data/player/player.store';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPassword === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly playerStore = inject(PlayerStore);

  readonly user = this.authStore.currentUser;
  readonly isLoading = this.authStore.isLoading;
  readonly error = this.authStore.error;

  readonly steamLinked = computed(() => this.user()?.steamAccountId != null);
  readonly isLinking = this.playerStore.isLinking;
  readonly linkError = this.playerStore.linkError;
  readonly steamIdInput = signal('');

  readonly userInitial = computed(() => {
    const email = this.user()?.email ?? '?';
    return email.charAt(0).toUpperCase();
  });

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  readonly showPasswords = signal(false);

  constructor() {
    // Sincroniza el estado disabled del form con isLoading sin usar [disabled]
    // en cada input (lo cual dispara warning de Angular en reactive forms).
    effect(() => {
      if (this.isLoading()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  togglePasswords(): void {
    this.showPasswords.update((v) => !v);
  }

  isInvalid(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): boolean {
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();

    try {
      await this.authStore.changePassword(currentPassword, newPassword);
      this.form.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      this.authStore.clearError();
      this.toast.success('Contraseña actualizada correctamente.');
    } catch {
      // El error queda en this.error y se muestra inline arriba del form.
    }
  }

  async linkSteam(): Promise<void> {
    const raw = this.steamIdInput().trim();
    if (!raw) return;

    // Aceptamos URL completa (steamcommunity.com/profiles/76...) o solo el número.
    const match = raw.match(/(\d{6,17})/);
    const parsed = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.playerStore.linkError.set('Ingresa un Steam ID válido (32-bit o 64-bit).');
      return;
    }

    try {
      await this.playerStore.linkSteam(parsed);
      this.steamIdInput.set('');
      this.toast.success('Cuenta de Dota 2 vinculada.');
    } catch {
      // error queda en linkError
    }
  }

  async unlinkSteam(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Desvincular cuenta',
      message: '¿Seguro? Dejaremos de mostrar tus partidas recientes en Home.',
      confirmText: 'Desvincular',
      danger: true,
    });
    if (!ok) return;

    try {
      await this.playerStore.linkSteam(null);
      this.toast.info('Cuenta desvinculada.');
    } catch {
      // error queda en linkError
    }
  }

  async logout(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Cerrar sesión',
      message: '¿Seguro? Vas a tener que volver a ingresar tu contraseña.',
      confirmText: 'Cerrar sesión',
      danger: true,
    });
    if (ok) {
      await this.authStore.logout();
      this.toast.info('Sesión cerrada.');
      this.router.navigateByUrl('/');
    }
  }
}
