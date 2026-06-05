import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import {
  isPasswordStrong,
  PASSWORD_POLICY_HINT,
} from '../../../core/utils/password-policy.util';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  resetToken = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  submitting = false;
  error = '';
  success = false;

  readonly passwordPolicyHint = PASSWORD_POLICY_HINT;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.resetToken) {
      this.error = 'Session expirée. Recommencez depuis « Mot de passe oublié ».';
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
      return;
    }
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit(): void {
    this.error = '';
    if (!this.resetToken) {
      return;
    }
    if (!isPasswordStrong(this.password)) {
      this.error = PASSWORD_POLICY_HINT;
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.submitting = true;
    this.auth.resetPassword(this.resetToken, this.password).subscribe({
      next: () => {
        this.submitting = false;
        this.success = true;
        setTimeout(() => void this.router.navigate(['/connexion']), 2500);
      },
      error: (err) => {
        this.submitting = false;
        this.error = httpErrorMessage(err, 'Impossible de mettre à jour le mot de passe.');
      },
    });
  }
}
