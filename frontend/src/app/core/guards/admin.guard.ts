import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { defaultHomeForRole } from '../utils/auth-navigation.util';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    void router.navigate(['/connexion'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (auth.getRole() !== 'ADMIN') {
    void router.navigateByUrl(defaultHomeForRole(auth.getRole()));
    return false;
  }

  return true;
};
