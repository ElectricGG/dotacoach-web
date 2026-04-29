import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, RouterLink],
  template: `
    <ion-content [fullscreen]="true">
      <div class="auth-layout">
        <a routerLink="/" class="back-link">← DotaCoach</a>
        <div class="auth-card">
          <h1 class="text-display">Iniciar sesión</h1>
          <p class="text-subdued">Form de login real en Fase 2.</p>
          <a routerLink="/register" class="text-link">¿No tenés cuenta? Registrate →</a>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    @use '../../theme/colors' as c;
    @use '../../theme/layout' as l;
    @use '../../theme/typography' as t;

    .auth-layout {
      min-height: 100vh;
      padding: l.$space-6;
      display: flex;
      flex-direction: column;
    }

    .back-link {
      color: c.$text-base;
      text-decoration: none;
      font-weight: t.$fw-bold;
      margin-bottom: l.$space-10;
    }

    .auth-card {
      max-width: 420px;
      width: 100%;
      margin: auto;
      padding: l.$space-8;
      background: c.$bg-elevated;
      border: 1px solid c.$bg-tinted;
      border-radius: l.$radius-xl;
    }

    .text-link {
      display: inline-block;
      margin-top: l.$space-6;
      color: c.$accent-primary;
      text-decoration: none;
      font-weight: t.$fw-medium;
    }
  `],
})
export class LoginPage {}
