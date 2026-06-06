import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UiService } from '../../../core/services/ui.user.service';
import { PresenceService } from '../../presence/presence.service';
import { InscriptionService } from '../../inscription/inscription.service';
import { ActionService } from '../../action/services/action.service';
import { shouldHideParticipantEntry } from '../../action/utils/action-participant.util';

interface TodayAction {
  actionId: number;
  title: string;
  city: string;
  dateLabel: string;
}

@Component({
  selector: 'app-scanner-presence',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ZXingScannerModule],
  templateUrl: './scanner-presence.component.html',
  styleUrl: './scanner-presence.component.scss',
})
export class ScannerPresenceComponent implements OnInit {
  readonly allowedFormats = [BarcodeFormat.QR_CODE];

  mode: 'scan' | 'pin' | 'manual' = 'scan';
  pinCode = '';
  manualQr = '';
  scannerEnabled = true;
  loading = false;
  message = '';
  isError = false;
  cameraError = '';
  todayActions: TodayAction[] = [];
  highlightedActionId: number | null = null;

  private lastScanMs = 0;

  constructor(
    private auth: AuthService,
    private ui: UiService,
    private presenceService: PresenceService,
    private inscriptionService: InscriptionService,
    private actionService: ActionService,
    private route: ActivatedRoute
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    this.ui.setPageHeader('Valider ma présence', 'JOUR J');
    const actionIdParam =
      this.route.snapshot.paramMap.get('actionId') ??
      this.route.snapshot.queryParamMap.get('actionId');
    if (actionIdParam) {
      this.highlightedActionId = Number(actionIdParam);
    }
    this.loadTodayActions();
  }

  private loadTodayActions(): void {
    this.inscriptionService
      .getMesActions(this.userId)
      .pipe(
        switchMap((inscriptions) => {
          const upcoming = inscriptions.filter((i) => i.statut === 'INSCRIT');
          if (!upcoming.length) {
            return of([] as TodayAction[]);
          }
          const actionIds = [...new Set(upcoming.map((i) => i.actionId))];
          return this.actionService.getActionSummariesByIds(actionIds).pipe(
            map((actions) => {
              const byId = new Map(actions.map((a) => [a.id, a]));
              return upcoming
                .map((insc) => {
                  const action = byId.get(insc.actionId);
                  if (!action || shouldHideParticipantEntry(insc.inscriptionStatut, action)) {
                    return null;
                  }
                  if (!this.isToday(action.dateStart)) {
                    return null;
                  }
                  return {
                    actionId: insc.actionId,
                    title: action.title,
                    city: action.city,
                    dateLabel: this.formatDate(action.dateStart),
                  } as TodayAction;
                })
                .filter((a): a is TodayAction => a != null);
            })
          );
        })
      )
      .subscribe({
        next: (actions) => (this.todayActions = actions),
        error: () => (this.todayActions = []),
      });
  }

  onScanSuccess(raw: string): void {
    const qrCode = raw?.trim();
    if (!qrCode) {
      return;
    }
    const now = Date.now();
    if (this.loading || now - this.lastScanMs < 2500) {
      return;
    }
    this.lastScanMs = now;
    this.validateQr(qrCode);
  }

  onScanError(error: unknown): void {
    if (error && typeof error === 'object' && 'name' in error) {
      const name = String((error as { name: string }).name);
      if (name === 'NotAllowedError') {
        this.cameraError =
          'Accès à la caméra refusé. Utilisez le code PIN ou saisissez le QR manuellement.';
        this.mode = 'pin';
        return;
      }
    }
    this.cameraError = 'Impossible d\'activer la caméra sur cet appareil.';
  }

  validateManualQr(): void {
    const qrCode = this.manualQr.trim();
    if (!qrCode) {
      return;
    }
    this.validateQr(qrCode);
  }

  validatePin(): void {
    const pin = this.pinCode.trim();
    if (pin.length < 4 || this.loading) {
      return;
    }

    this.loading = true;
    this.message = '';
    this.isError = false;
    this.scannerEnabled = false;

    this.presenceService.validerParPin(pin, this.userId).subscribe({
      next: (res) => this.onValidationSuccess(res.pointsCredites ?? 0, res.actionId),
      error: (err: Error) => this.onValidationError(err.message),
    });
  }

  private validateQr(qrCode: string): void {
    this.loading = true;
    this.message = '';
    this.isError = false;
    this.scannerEnabled = false;

    this.presenceService.valider(qrCode, this.userId).subscribe({
      next: (res) => this.onValidationSuccess(res.pointsCredites ?? 0, res.actionId),
      error: (err: Error) => this.onValidationError(err.message),
    });
  }

  private onValidationSuccess(points: number, actionId?: number): void {
    this.loading = false;
    this.isError = false;
    this.pinCode = '';
    this.manualQr = '';
    this.message = `Présence validée ! Vous avez gagné ${points} points Ecopria.`;
    if (actionId) {
      this.highlightedActionId = actionId;
    }
    this.loadTodayActions();
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 3000);
  }

  private onValidationError(errorMessage: string): void {
    this.loading = false;
    this.isError = true;
    this.message = errorMessage;
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 2000);
  }

  setMode(next: 'scan' | 'pin' | 'manual'): void {
    this.mode = next;
    this.message = '';
    this.isError = false;
    this.scannerEnabled = next === 'scan';
  }

  private isToday(isoDate: string): boolean {
    const d = new Date(isoDate);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
