import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';

const REMEMBER_EMAIL_KEY = 'ecopria_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  submitting = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      this.email = saved;
      this.rememberMe = true;
    }
  }

  submit(): void {
    this.error = '';
    this.submitting = true;
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.auth.persistSession(res);
        if (this.rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, this.email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        this.submitting = false;
        this.redirectByRole(res.role);
      },
      error: (err) => {
        this.submitting = false;
        const msg = httpErrorMessage(err, 'Identifiants incorrects.');
        if (msg.includes('EMAIL_NOT_VERIFIED')) {
          this.error = 'Votre e-mail n’est pas encore vérifié.';
          void this.router.navigate(['/verifier-email'], {
            queryParams: { email: this.email.trim().toLowerCase() },
          });
          return;
        }
        this.error = msg;
      },
    });
  }

  private redirectByRole(role: string): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      void this.router.navigateByUrl(returnUrl);
      return;
    }

    if (role === 'ASSOCIATION') {
      void this.router.navigate(['/association']);
      return;
    }
    if (role === 'PARTNER') {
      void this.router.navigate(['/partenaire']);
      return;
    }
    void this.router.navigate(['/']);
  }
}
