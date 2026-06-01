export type RegisterRole = 'USER' | 'ASSOCIATION' | 'PARTNER';

export type ProfileType = 'citoyen' | 'association' | 'partenaire';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: RegisterRole;
  userId: number;
}

export interface RegistrationResponse {
  requires_email_verification: boolean;
  userId: number;
  email: string;
  message: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: RegisterRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  nom?: string;
  document?: string;
  captcha_token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CitizenProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}
