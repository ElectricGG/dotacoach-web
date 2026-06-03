import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthStore } from '../../data/auth/auth.store';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [IonContent, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly user = this.authStore.currentUser;
  readonly menuOpen = signal(false);

  readonly userInitial = computed(() => {
    const email = this.user()?.email ?? '?';
    return email.charAt(0).toUpperCase();
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
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
