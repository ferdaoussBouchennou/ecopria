import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SITE_IMAGES } from '../../../core/constants/site-images';
import { HOW_HERO, HOW_STEPS, HowStep } from './comment-ca-marche.constants';

const STEP_IMAGE_FALLBACK: Record<string, string> = {
  '01': SITE_IMAGES.communityGroup,
  '02': SITE_IMAGES.howItWorks,
  '03': SITE_IMAGES.heroPlanting,
  '04': SITE_IMAGES.recompensesCatalogue,
  '05': SITE_IMAGES.mystereBox,
};

@Component({
  selector: 'app-comment-ca-marche',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './comment-ca-marche.component.html',
  styleUrl: './comment-ca-marche.component.scss',
})
export class CommentCaMarcheComponent {
  readonly hero = HOW_HERO;
  readonly steps = HOW_STEPS;

  constructor(public auth: AuthService) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get isCitizen(): boolean {
    return this.auth.isLoggedIn() && this.auth.getRole() === 'USER';
  }

  stepCtaLink(step: HowStep): string | string[] {
    if (this.isCitizen && step.ctaLinkCitizen) {
      return step.ctaLinkCitizen;
    }
    return step.ctaLink;
  }

  onStepImageError(step: HowStep, event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = STEP_IMAGE_FALLBACK[step.num];
    if (!fallback || img.dataset['fallbackApplied'] === '1') return;
    img.dataset['fallbackApplied'] = '1';
    img.src = fallback;
  }
}
