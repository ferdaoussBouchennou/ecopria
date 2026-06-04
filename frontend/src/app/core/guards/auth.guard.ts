import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RegisterRole } from '../models/auth.model';
import { defaultHomeForRole } from '../utils/auth-navigation.util';

function redirectToLogin(returnUrl: string): false {
  const router = inject(Router);
  void router.navigate(['/connexion'], { queryParams: { returnUrl } });
  return false;
}

/** Connexion requise. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    return redirectToLogin(state.url);
  }
  return true;
};

function createRoleGuard(...allowed: RegisterRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return redirectToLogin(state.url);
    }

    const role = auth.getRole();
    if (role && allowed.includes(role)) {
      return true;
    }

    void router.navigateByUrl(defaultHomeForRole(role));
    return false;
  };
}

export const citizenGuard = createRoleGuard('USER');
export const associationGuard = createRoleGuard('ASSOCIATION');
export const partenaireGuard = createRoleGuard('PARTNER');
