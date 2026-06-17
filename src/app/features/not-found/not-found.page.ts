import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [IonContent, RouterLink],
  template: `
    <ion-content [fullscreen]="true">
      <div class="not-found">
        <div class="bg-glow"></div>
        <div class="content">
          <span class="error-code">404</span>
          <h1 class="text-display">Esta partida no existe</h1>
          <p class="text-subdued">
            La URL que pediste no existe o quizás se borró tu sesión.
            Volvamos a base.
          </p>
          <div class="actions">
            <a routerLink="/" class="btn btn-primary">Ir al inicio</a>
            <a routerLink="/app/home" class="btn btn-ghost">Mi app</a>
          </div>
          <p class="hint text-mute">
            Tip: si llegaste aquí desde un enlace viejo de una sesión, probablemente
            ya no exista en el servidor.
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./not-found.page.scss'],
})
export class NotFoundPage {}
