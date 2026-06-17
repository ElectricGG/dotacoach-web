import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [IonContent, RouterLink],
  templateUrl: './terms.page.html',
  styles: [
    `
      .legal-page {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 24px 80px;
      }
      .legal-header {
        margin-bottom: 32px;
      }
      .brand-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        text-decoration: none;
        color: var(--text, #e8e8e8);
        margin-bottom: 24px;
      }
      .brand-mark {
        color: #1db954;
      }
      .legal-header h1 {
        margin: 16px 0 8px;
      }
      .legal-body h2 {
        margin: 32px 0 8px;
        font-size: 18px;
        font-weight: 700;
      }
      .legal-body p,
      .legal-body ul {
        line-height: 1.7;
        margin: 0 0 12px;
      }
      .legal-body ul {
        padding-left: 20px;
      }
      .legal-body li {
        margin-bottom: 6px;
      }
      .legal-footer {
        margin-top: 40px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
    `,
  ],
})
export class TermsPage {}
