import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Attache JWT + X-User-Id ; tente un refresh sur 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getAccessToken();
  const userId = auth.getUserId();

  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (userId != null && req.url.includes('/api/')) {
    headers['X-User-Id'] = String(userId);
  }

  const authed = req.clone({ setHeaders: headers });

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/verify-email');

      if (err.status !== 401 || isAuthEndpoint || !localStorage.getItem('ecopria_refresh_token')) {
        return throwError(() => err);
      }

      return auth.refreshSession().pipe(
        switchMap((session) => {
          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${session.accessToken}`,
          };
          if (session.userId != null) {
            retryHeaders['X-User-Id'] = String(session.userId);
          }
          return next(req.clone({ setHeaders: retryHeaders }));
        }),
        catchError((refreshErr) => {
          auth.clearSession();
          void router.navigate(['/connexion'], {
            queryParams: { returnUrl: router.url },
          });
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
