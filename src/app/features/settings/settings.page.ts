import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthStore } from '../../data/auth/auth.store';
import { RecentSessionsService } from '../../data/sessions/recent-sessions.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  private readonly authStore = inject(AuthStore);
  private readonly recents = inject(RecentSessionsService);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly apiUrl = environment.apiUrl;
  readonly version = '0.1.0-mvp';

  async clearLocalCache(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Borrar historial local',
      message: '¿Borrar el historial local de sesiones recientes? No afecta los datos en el servidor.',
      confirmText: 'Borrar',
      danger: true,
    });
    if (ok) {
      this.recents.clear();
      this.toast.success('Historial local borrado.');
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
