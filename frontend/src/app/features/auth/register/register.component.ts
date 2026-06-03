import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  TURNSTILE_DEV_BYPASS_TOKEN,
  TurnstileService,
} from '../../../core/services/turnstile.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import { ProfileType } from '../../../core/models/auth.model';
import { VerifyEmailComponent } from '../verify-email/verify-email.component';

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('turnstileContainer', { static: true })
  turnstileContainer!: ElementRef<HTMLElement>;

  profileType: ProfileType = 'citoyen';

  firstName = '';
  lastName = '';
  orgName = '';
  email = '';
  phone = '';
  address = '';
  city = '';
  password = '';
  captchaToken = '';
  captchaDevBypass = false;
  captchaUseDevFallback = false;

  documentFile: File | null = null;
  documentFileName = 'Aucun fichier sélectionné.';

  submitting = false;
  error = '';
  successMessage = '';

  private turnstileWidgetId: string | null = null;

  constructor(
    private auth: AuthService,
    private turnstile: TurnstileService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    void this.initTurnstile();
  }

  ngOnDestroy(): void {
    if (this.turnstileWidgetId && window.turnstile) {
      window.turnstile.remove(this.turnstileWidgetId);
    }
  }

  private async initTurnstile(): Promise<void> {
    try {
      await this.turnstile.loadScript();
      this.turnstileWidgetId = this.turnstile.render(
        this.turnstileContainer.nativeElement,
        (token) => {
          this.captchaToken = token;
          this.captchaUseDevFallback = false;
          this.captchaDevBypass = false;
        },
        () => {
          this.captchaToken = '';
        }
      );
      if (!this.turnstileWidgetId) {
        this.enableDevCaptchaFallback();
      }
    } catch {
      this.enableDevCaptchaFallback();
    }
  }

  private enableDevCaptchaFallback(): void {
    if (this.turnstile.devBypassAllowed) {
      this.captchaUseDevFallback = true;
      this.error = '';
      return;
    }
    this.error =
      'Impossible de charger le captcha (réseau ou bloqueur). Réessayez ou désactivez le bloqueur pour challenges.cloudflare.com.';
  }

  onDevCaptchaToggle(checked: boolean): void {
    this.captchaDevBypass = checked;
    this.captchaToken = checked ? TURNSTILE_DEV_BYPASS_TOKEN : '';
  }

  private hasValidCaptcha(): boolean {
    if (this.captchaToken.trim()) {
      return true;
    }
    if (this.captchaUseDevFallback && this.captchaDevBypass) {
      this.captchaToken = TURNSTILE_DEV_BYPASS_TOKEN;
      return true;
    }
    return false;
  }

  selectProfile(type: ProfileType): void {
    this.profileType = type;
    this.error = '';
    if (type === 'citoyen') {
      this.clearDocument();
    }
  }

  triggerFilePicker(): void {
    const input = document.getElementById('verification-doc') as HTMLInputElement | null;
    input?.click();
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.clearDocument();
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!ALLOWED_TYPES.has(file.type) && !allowedExt.includes(ext)) {
      this.error = 'Format accepté : PDF, JPG ou PNG.';
      this.clearDocument();
      input.value = '';
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      this.error = 'Le fichier ne doit pas dépasser 5 Mo.';
      this.clearDocument();
      input.value = '';
      return;
    }

    this.error = '';
    this.documentFile = file;
    this.documentFileName = file.name;
  }

  private clearDocument(): void {
    this.documentFile = null;
    this.documentFileName = 'Aucun fichier sélectionné.';
  }

  submit(): void {
    this.error = '';
    if (!this.hasValidCaptcha()) {
      this.error = this.captchaUseDevFallback
        ? 'Cochez la case de vérification ci-dessous.'
        : 'Veuillez valider le captcha.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    if (this.profileType === 'citoyen') {
      if (!this.firstName.trim() || !this.lastName.trim()) {
        this.error = 'Le prénom et le nom sont obligatoires.';
        return;
      }
      if (!this.city.trim()) {
        this.error = 'La ville est obligatoire pour les citoyen·nes.';
        return;
      }
      this.submitCitizen();
      return;
    }

    if (!this.orgName.trim()) {
      this.error = 'Le nom de l’organisation est obligatoire.';
      return;
    }
    if (!this.documentFile) {
      this.error = 'Veuillez sélectionner un document de vérification (PDF ou JPG).';
      return;
    }
    this.submitOrganization();
  }

  private goToEmailVerification(): void {
    void this.router.navigate(['/verifier-email'], {
      queryParams: { email: this.email.trim().toLowerCase() },
    });
  }

  private submitCitizen(): void {
    this.submitting = true;
    const token = this.captchaToken;
    this.auth
      .registerCitizen(
        {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          phone: this.phone,
          address: this.address,
          city: this.city,
          password: this.password,
        },
        token
      )
      .subscribe({
        next: () => {
          this.submitting = false;
          VerifyEmailComponent.savePendingProfile({
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email.trim().toLowerCase(),
            phone: this.phone,
            address: this.address,
            city: this.city,
            profileType: 'citoyen',
          });
          this.goToEmailVerification();
        },
        error: (err) => {
          this.submitting = false;
          this.error = httpErrorMessage(err, 'Impossible de créer le compte.');
          this.turnstile.reset(this.turnstileWidgetId ?? undefined);
          this.captchaToken = '';
        },
      });
  }

  private submitOrganization(): void {
    if (!this.documentFile) {
      return;
    }
    this.submitting = true;
    const token = this.captchaToken;
    this.auth
      .registerOrganization(
        {
          profileType: this.profileType as 'association' | 'partenaire',
          nom: this.orgName,
          email: this.email,
          password: this.password,
          phone: this.phone,
          address: this.address,
          city: this.city,
          documentFile: this.documentFile,
        },
        token
      )
      .subscribe({
        next: () => {
          this.submitting = false;
          VerifyEmailComponent.savePendingProfile({
            firstName: '',
            lastName: '',
            email: this.email.trim().toLowerCase(),
            phone: this.phone,
            address: this.address,
            city: this.city,
            profileType: this.profileType,
          });
          this.goToEmailVerification();
        },
        error: (err) => {
          this.submitting = false;
          this.error = httpErrorMessage(err, 'Impossible de créer le compte.');
          this.turnstile.reset(this.turnstileWidgetId ?? undefined);
          this.captchaToken = '';
        },
      });
  }
}
