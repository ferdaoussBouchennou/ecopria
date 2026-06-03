import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, retry, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CitizenProfileUpdate,
  LoginPayload,
  ProfileType,
  RegisterPayload,
  RegisterRole,
  RegistrationResponse,
  ResetSessionResponse,
  VerifyEmailPayload,
} from '../models/auth.model';

const TOKEN_KEY = 'ecopria_access_token';
const REFRESH_KEY = 'ecopria_refresh_token';
const USER_ID_KEY = 'ecopria_user_id';
const ROLE_KEY = 'ecopria_role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${environment.authApi}/register`, payload);
  }

  verifyEmail(payload: VerifyEmailPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.authApi}/verify-email`, payload);
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.authApi}/resend-verification`, {
      email: email.trim().toLowerCase(),
    });
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.authApi}/login`, {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.authApi}/forgot-password`, {
      email: email.trim().toLowerCase(),
    });
  }

  verifyResetCode(email: string, code: string): Observable<ResetSessionResponse> {
    return this.http.post<ResetSessionResponse>(`${environment.authApi}/verify-reset-code`, {
      email: email.trim().toLowerCase(),
      code,
    });
  }

  resetPassword(resetToken: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.authApi}/reset-password`, {
      resetToken,
      newPassword,
    });
  }

  uploadVerificationDocument(file: File): Observable<{ document: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ document: string }>(`${environment.authApi}/register/document`, formData);
  }

  completeCitizenProfile(
    authId: number,
    accessToken: string,
    profile: CitizenProfileUpdate
  ): Observable<unknown> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    return this.http.put(`${environment.userApi}/${authId}/profile`, profile, { headers }).pipe(
      retry({ count: 4, delay: 800 })
    );
  }

  registerCitizen(
    form: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      password: string;
    },
    captchaToken: string
  ): Observable<RegistrationResponse> {
    const payload: RegisterPayload = {
      email: form.email.trim(),
      password: form.password,
      role: 'USER',
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      phone: this.normalizePhone(form.phone),
      address: form.address.trim(),
      city: form.city.trim(),
      captcha_token: captchaToken,
    };
    return this.register(payload);
  }

  verifyCitizenAndCompleteProfile(
    email: string,
    code: string,
    profile: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
    }
  ): Observable<AuthResponse> {
    return this.verifyEmail({ email: email.trim().toLowerCase(), code: code.trim() }).pipe(
      switchMap((auth) => {
        this.persistSession(auth);
        const update: CitizenProfileUpdate = {
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          email: profile.email.trim(),
          phone: this.normalizePhone(profile.phone),
          address: profile.address.trim(),
          city: profile.city.trim(),
        };
        return this.completeCitizenProfile(auth.userId, auth.accessToken, update).pipe(map(() => auth));
      })
    );
  }

  registerOrganization(
    data: {
      profileType: 'association' | 'partenaire';
      nom: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
      city?: string;
      documentFile: File;
    },
    captchaToken: string
  ): Observable<RegistrationResponse> {
    return this.uploadVerificationDocument(data.documentFile).pipe(
      switchMap(({ document }) => {
        const role: RegisterRole = data.profileType === 'association' ? 'ASSOCIATION' : 'PARTNER';
        const payload: RegisterPayload = {
          email: data.email.trim(),
          password: data.password,
          role,
          nom: data.nom.trim(),
          phone: data.phone?.trim() || '',
          address: data.address?.trim() || '',
          city: data.city?.trim() || '',
          document,
          captcha_token: captchaToken,
        };
        return this.register(payload);
      })
    );
  }

  persistSession(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
    localStorage.setItem(USER_ID_KEY, String(auth.userId));
    localStorage.setItem(ROLE_KEY, auth.role);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(ROLE_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUserId(): number | null {
    const raw = localStorage.getItem(USER_ID_KEY);
    return raw ? Number(raw) : null;
  }

  getRole(): RegisterRole | null {
    return localStorage.getItem(ROLE_KEY) as RegisterRole | null;
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  profileTypeToRole(type: ProfileType): RegisterRole {
    switch (type) {
      case 'association':
        return 'ASSOCIATION';
      case 'partenaire':
        return 'PARTNER';
      default:
        return 'USER';
    }
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    return digits.length > 10 ? digits.slice(-10) : digits;
  }
}
