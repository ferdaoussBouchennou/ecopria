import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-verify-reset-code',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-reset-code.component.html',
  styleUrl: './verify-reset-code.component.scss',
})
export class VerifyResetCodeComponent implements OnInit {
  email = '';
  code = '';
  submitting = false;
  error = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  submit(): void {
    this.error = '';
    const trimmedCode = this.code.replace(/\D/g, '');
    if (!this.email.trim()) {
      this.error = 'Adresse e-mail manquante.';
      return;
    }
    if (trimmedCode.length !== 6) {
      this.error = 'Saisissez le code à 6 chiffres reçu par e-mail.';
      return;
    }

    this.submitting = true;
    this.auth.verifyResetCode(this.email.trim().toLowerCase(), trimmedCode).subscribe({
      next: (res) => {
        this.submitting = false;
        void this.router.navigate(['/reinitialiser-mot-de-passe/nouveau'], {
          queryParams: { token: res.resetToken },
        });
      },
      error: (err) => {
        this.submitting = false;
        this.error = httpErrorMessage(err, 'Code invalide ou expiré.');
      },
    });
  }
}
