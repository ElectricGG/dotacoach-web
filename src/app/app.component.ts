import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, ToastHostComponent, ConfirmDialogComponent],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      <app-toast-host />
      <app-confirm-dialog />
    </ion-app>
  `,
})
export class AppComponent {}
