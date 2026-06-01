import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Token accepté par auth-service quand turnstile.dev-bypass-enabled=true (local uniquement) */
export const TURNSTILE_DEV_BYPASS_TOKEN = 'ecopria-dev-captcha-bypass';

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private scriptLoaded: Promise<void> | null = null;

  get siteKey(): string {
    return environment.turnstileSiteKey ?? '';
  }

  get devBypassAllowed(): boolean {
    return !environment.production && !!environment.turnstileDevBypass;
  }

  loadScript(): Promise<void> {
    if (this.isApiReady()) {
      return Promise.resolve();
    }
    if (this.scriptLoaded) {
      return this.scriptLoaded;
    }

    this.scriptLoaded = new Promise((resolve, reject) => {
      const onReady = () => {
        if (this.isApiReady()) {
          resolve();
          return;
        }
        if (window.turnstile?.ready) {
          window.turnstile.ready(() => resolve());
        } else {
          reject(new Error('Turnstile API indisponible'));
        }
      };

      const existing = document.querySelector(
        'script[data-turnstile]'
      ) as HTMLScriptElement | null;

      if (existing) {
        if (existing.dataset['loaded'] === 'true' || this.isApiReady()) {
          onReady();
          return;
        }
        existing.addEventListener('load', () => {
          existing.dataset['loaded'] = 'true';
          onReady();
        });
        existing.addEventListener('error', () =>
          reject(new Error('Turnstile script failed'))
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset['turnstile'] = 'true';
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        onReady();
      };
      script.onerror = () => reject(new Error('Turnstile script failed'));
      document.head.appendChild(script);
    });

    return this.scriptLoaded;
  }

  render(
    container: HTMLElement,
    onToken: (token: string) => void,
    onExpire?: () => void
  ): string | null {
    if (!this.isApiReady() || !this.siteKey) {
      return null;
    }
    container.innerHTML = '';
    return window.turnstile!.render(container, {
      sitekey: this.siteKey,
      theme: 'light',
      callback: onToken,
      'expired-callback': onExpire,
      'error-callback': onExpire,
    });
  }

  reset(widgetId?: string): void {
    window.turnstile?.reset(widgetId);
  }

  private isApiReady(): boolean {
    return typeof window.turnstile?.render === 'function';
  }
}
