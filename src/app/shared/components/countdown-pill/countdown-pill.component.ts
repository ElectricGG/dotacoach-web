import { Component, Input, OnDestroy, OnInit, computed, signal } from '@angular/core';

@Component({
  selector: 'app-countdown-pill',
  standalone: true,
  template: `
    <span class="pill" [class.warn]="isExpiringSoon()" [class.expired]="isExpired()">
      ⏱ {{ label() }}
    </span>
  `,
  styles: [`
    @use '../../../theme/colors' as c;
    @use '../../../theme/typography' as t;
    @use '../../../theme/layout' as l;

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: l.$radius-pill;
      font-size: t.$fs-caption;
      font-weight: t.$fw-bold;
      letter-spacing: 0.05em;
      background: rgba(29, 185, 84, 0.15);
      color: c.$accent-primary;

      &.warn {
        background: rgba(242, 169, 0, 0.15);
        color: c.$warning;
      }
      &.expired {
        background: c.$bg-tinted;
        color: c.$text-mute;
      }
    }
  `],
})
export class CountdownPillComponent implements OnInit, OnDestroy {
  @Input({ required: true }) expiresAt!: string;

  private readonly remainingMs = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly isExpired = computed(() => this.remainingMs() <= 0);
  readonly isExpiringSoon = computed(() => {
    const ms = this.remainingMs();
    return ms > 0 && ms < 60 * 60 * 1000;
  });

  readonly label = computed(() => {
    const ms = this.remainingMs();
    if (ms <= 0) return 'Expirada';
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m restantes`;
    return `${Math.floor(totalSec)}s`;
  });

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    const target = new Date(this.expiresAt).getTime();
    const now = Date.now();
    this.remainingMs.set(Math.max(0, target - now));
  }
}
