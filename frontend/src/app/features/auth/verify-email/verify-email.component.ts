import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { environment } from '../../../../environments/environment';

const PENDING_PROFILE_KEY = 'ecopria_pending_citizen_profile';

export interface PendingCitizenProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  profileType: 'citoyen' | 'association' | 'partenaire';
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  readonly showDevHint = !environment.production;

  email = '';
  code = '';
  submitting = false;
  resending = false;
  error = '';
  info = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!this.email) {
      const pending = this.loadPendingProfile();
      this.email = pending?.email ?? '';
    }
  }

  submit(): void {
    this.error = '';
    this.info = '';
    const trimmedCode = this.code.replace(/\D/g, '');
    if (trimmedCode.length !== 6) {
      this.error = 'Saisissez le code à 6 chiffres reçu par e-mail.';
      return;
    }

    this.submitting = true;
    const pending = this.loadPendingProfile();
    const email = this.email.trim().toLowerCase();

    if (pending?.profileType === 'citoyen') {
      this.auth.verifyCitizenAndCompleteProfile(email, trimmedCode, pending).subscribe({
        next: () => {
          sessionStorage.removeItem(PENDING_PROFILE_KEY);
          this.submitting = false;
          void this.router.navigate(['/espace'], { queryParams: { bienvenue: '1' } });
        },
        error: (err) => {
          this.submitting = false;
          this.error = httpErrorMessage(err, 'Code invalide ou expiré.');
        },
      });
      return;
    }

    this.auth.verifyEmail({ email, code: trimmedCode }).subscribe({
      next: () => {
        sessionStorage.removeItem(PENDING_PROFILE_KEY);
        this.submitting = false;
        if (pending?.profileType === 'association' || pending?.profileType === 'partenaire') {
          void this.router.navigate(['/compte-en-attente'], { queryParams: { email } });
          return;
        }
        void this.router.navigate(['/connexion']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = httpErrorMessage(err, 'Code invalide ou expiré.');
      },
    });
  }

  resend(): void {
    this.error = '';
    this.info = '';
    if (!this.email.trim()) {
      this.error = 'Adresse e-mail manquante.';
      return;
    }
    this.resending = true;
    this.auth.resendVerification(this.email).subscribe({
      next: (res) => {
        this.resending = false;
        this.info = res.message;
      },
      error: (err) => {
        this.resending = false;
        this.error = httpErrorMessage(err, 'Impossible de renvoyer le code.');
      },
    });
  }

  static savePendingProfile(profile: PendingCitizenProfile): void {
    sessionStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile));
  }

  private loadPendingProfile(): PendingCitizenProfile | null {
    const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as PendingCitizenProfile;
    } catch {
      return null;
    }
  }
}
