import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    void router.navigate(['/connexion']);
    return false;
  }

  if (auth.getRole() !== 'ADMIN') {
    void router.navigate(['/']);
    return false;
  }

  return true;
};
