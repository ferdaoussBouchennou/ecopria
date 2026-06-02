import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';

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
  submitting = false;
  error = '';
  success = false;

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

  submit(): void {
    this.error = '';
    if (!this.resetToken) {
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
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
