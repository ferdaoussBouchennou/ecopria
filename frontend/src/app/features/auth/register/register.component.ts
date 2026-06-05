import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  TURNSTILE_DEV_BYPASS_TOKEN,
  TurnstileService,
} from '../../../core/services/turnstile.service';
import { httpErrorMessage } from '../../../core/utils/http-error.util';
import {
  isPasswordStrong,
  PASSWORD_POLICY_HINT,
  PASSWORD_RULES,
  passwordStrengthLabel,
  passwordStrengthPercent,
} from '../../../core/utils/password-policy.util';
import { ProfileType } from '../../../core/models/auth.model';
import { VerifyEmailComponent } from '../verify-email/verify-email.component';

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

type CaptchaState = 'loading' | 'ready' | 'fallback' | 'error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('turnstileContainer')
  turnstileContainer?: ElementRef<HTMLElement>;

  profileType: ProfileType = 'citoyen';

  firstName = '';
  lastName = '';
  orgName = '';
  email = '';
  phone = '';
  address = '';
  city = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  captchaToken = '';
  captchaDevBypass = false;
  captchaState: CaptchaState = 'loading';

  documentFile: File | null = null;
  documentFileName = 'Aucun fichier sélectionné.';

  submitting = false;
  error = '';
  successMessage = '';

  readonly passwordRules = PASSWORD_RULES;
  readonly passwordPolicyHint = PASSWORD_POLICY_HINT;

  private turnstileWidgetId: string | null = null;

  get authQueryParams(): Record<string, string> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl ? { returnUrl } : {};
  }

  get profileLabel(): string {
    switch (this.profileType) {
      case 'association':
        return 'Association';
      case 'partenaire':
        return 'Partenaire';
      default:
        return 'Participant';
    }
  }

  get passwordStrengthLabel(): string {
    return passwordStrengthLabel(this.password);
  }

  get passwordStrengthPercent(): number {
    return passwordStrengthPercent(this.password);
  }

  get passwordsMatch(): boolean {
    return this.confirmPassword.length > 0 && this.password === this.confirmPassword;
  }

  constructor(
    private auth: AuthService,
    private turnstile: TurnstileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    void this.initTurnstile();
  }

  ngOnDestroy(): void {
    this.removeTurnstileWidget();
  }

  ruleMet(ruleId: string): boolean {
    const rule = PASSWORD_RULES.find((item) => item.id === ruleId);
    return rule ? rule.test(this.password) : false;
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
      return;
    }
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private removeTurnstileWidget(): void {
    if (this.turnstileWidgetId && window.turnstile) {
      window.turnstile.remove(this.turnstileWidgetId);
      this.turnstileWidgetId = null;
    }
  }

  private async initTurnstile(): Promise<void> {
    this.captchaState = 'loading';
    this.captchaToken = '';
    this.captchaDevBypass = false;
    this.removeTurnstileWidget();

    try {
      await this.turnstile.loadScript();
      await this.waitForTurnstileContainer();
      const container = this.turnstileContainer?.nativeElement;
      if (!container) {
        this.enableDevCaptchaFallback();
        return;
      }

      this.turnstileWidgetId = this.turnstile.render(
        container,
        (token) => {
          this.captchaToken = token;
          this.captchaDevBypass = false;
        },
        () => {
          this.captchaToken = '';
        }
      );

      if (this.turnstileWidgetId) {
        this.captchaState = 'ready';
        return;
      }
      this.enableDevCaptchaFallback();
    } catch {
      this.enableDevCaptchaFallback();
    }
  }

  private waitForTurnstileContainer(maxAttempts = 20): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const tick = () => {
        if (this.turnstileContainer?.nativeElement || attempts >= maxAttempts) {
          resolve();
          return;
        }
        attempts += 1;
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private enableDevCaptchaFallback(): void {
    if (this.turnstile.devBypassAllowed) {
      this.captchaState = 'fallback';
      this.error = '';
      return;
    }
    this.captchaState = 'error';
    this.error =
      'Impossible de charger le captcha. Vérifiez votre connexion ou désactivez le bloqueur pour challenges.cloudflare.com.';
  }

  retryCaptcha(): void {
    this.error = '';
    void this.initTurnstile();
  }

  onDevCaptchaToggle(checked: boolean): void {
    this.captchaDevBypass = checked;
    this.captchaToken = checked ? TURNSTILE_DEV_BYPASS_TOKEN : '';
  }

  private hasValidCaptcha(): boolean {
    if (this.captchaToken.trim()) {
      return true;
    }
    if (this.captchaState === 'fallback' && this.captchaDevBypass) {
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

  private validatePasswords(): boolean {
    if (!isPasswordStrong(this.password)) {
      this.error = PASSWORD_POLICY_HINT;
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return false;
    }
    return true;
  }

  submit(): void {
    this.error = '';
    if (!this.hasValidCaptcha()) {
      this.error =
        this.captchaState === 'fallback'
          ? 'Cochez la case de vérification anti-robot.'
          : 'Veuillez compléter la vérification de sécurité (captcha).';
      return;
    }
    if (!this.validatePasswords()) {
      return;
    }

    if (this.profileType === 'citoyen') {
      if (!this.firstName.trim() || !this.lastName.trim()) {
        this.error = 'Le prénom et le nom sont obligatoires.';
        return;
      }
      if (!this.city.trim()) {
        this.error = 'La ville est obligatoire pour les participants.';
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
      queryParams: {
        email: this.email.trim().toLowerCase(),
        ...this.authQueryParams,
      },
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
          this.resetCaptchaAfterError();
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
          this.resetCaptchaAfterError();
        },
      });
  }

  private resetCaptchaAfterError(): void {
    if (this.captchaState === 'ready') {
      this.turnstile.reset(this.turnstileWidgetId ?? undefined);
      this.captchaToken = '';
      return;
    }
    if (this.captchaState === 'fallback') {
      this.captchaDevBypass = false;
      this.captchaToken = '';
    }
  }
}
