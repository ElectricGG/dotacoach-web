import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [IonContent, RouterOutlet],
  template: `
    <ion-content [fullscreen]="true">
      <router-outlet></router-outlet>
    </ion-content>
  `,
})
export class AppShellComponent {}
