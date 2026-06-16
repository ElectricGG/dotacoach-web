import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { RecentSessionsService } from '../../data/sessions/recent-sessions.service';
import { laneRoleLabel } from '../../shared/utils/lane-role';

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './sessions-list.page.html',
  styleUrls: ['./sessions-list.page.scss'],
})
export class SessionsListPage {
  private readonly recents = inject(RecentSessionsService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly entries = this.recents.entries;
  readonly hasEntries = computed(() => this.entries().length > 0);

  positionLabel(slot: number | null, laneRole: number | null): string {
    if (slot === null) return 'Consulta de draft';
    const team = (slot & 0b1000_0000) === 0 ? 'Radiant' : 'Dire';
    const role = laneRoleLabel(laneRole);
    return role ? `${team} · ${role}` : team;
  }

  heroPortraitUrl(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  }

  async clearAll(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Borrar historial local',
      message: 'Esto borra solamente las sesiones recientes que ves aquí. No afecta tus análisis en el servidor — siguen accesibles si tienes el enlace.',
      confirmText: 'Borrar',
      danger: true,
    });
    if (ok) {
      this.recents.clear();
      this.toast.success('Historial local borrado.');
    }
  }
}
