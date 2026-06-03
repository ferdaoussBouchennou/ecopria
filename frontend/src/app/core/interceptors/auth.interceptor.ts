import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Attache le JWT (et X-User-Id pour /admin) aux requêtes API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  const userId = auth.getUserId();

  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (req.url.includes('/admin') && userId != null) {
    headers['X-User-Id'] = String(userId);
  }

  return next(req.clone({ setHeaders: headers }));
};
