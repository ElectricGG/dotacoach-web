import { Injectable, signal } from '@angular/core';

/**
 * Notificaciones nativas del browser. Solo dispara si la pestaña no está visible:
 * si el user ya está mirando la app, no tiene sentido molestar.
 */
@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {
  readonly permission = signal<NotificationPermission>(this.readPermission());

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    if (Notification.permission !== 'default') {
      this.permission.set(Notification.permission);
      return Notification.permission;
    }
    const result = await Notification.requestPermission();
    this.permission.set(result);
    return result;
  }

  notify(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported() || Notification.permission !== 'granted') return null;
    if (document.visibilityState === 'visible') return null;
    return new Notification(title, options);
  }

  private readPermission(): NotificationPermission {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied';
  }
}
