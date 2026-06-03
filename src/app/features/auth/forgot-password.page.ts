import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [IonContent, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./auth-shared.scss'],
})
export class ForgotPasswordPage {
  readonly submitted = signal(false);

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }
}
