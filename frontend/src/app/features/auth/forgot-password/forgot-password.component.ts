import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  email = '';
  submitting = false;
  error = '';
  sent = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  submit(): void {
    this.error = '';
    const trimmed = this.email.trim().toLowerCase();
    if (!trimmed) {
      this.error = 'Saisissez votre adresse e-mail.';
      return;
    }

    this.submitting = true;
    this.auth.forgotPassword(trimmed).subscribe({
      next: () => {
        this.submitting = false;
        this.sent = true;
        void this.router.navigate(['/reinitialiser-mot-de-passe/code'], {
          queryParams: { email: trimmed },
        });
      },
      error: (err) => {
        this.submitting = false;
        this.error = httpErrorMessage(err, 'Impossible d’envoyer le code.');
      },
    });
  }
}
