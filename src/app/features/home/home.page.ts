import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home-layout">
      <h1 class="text-display">App Home</h1>
      <p class="text-subdued">
        Implementación real en Fase 3 (home logueado con sesiones recientes).
      </p>
    </div>
  `,
  styles: [`
    @use '../../theme/layout' as l;
    .home-layout {
      padding: l.$space-8;
      max-width: l.$container-max;
      margin: 0 auto;
    }
  `],
})
export class HomePage {}
