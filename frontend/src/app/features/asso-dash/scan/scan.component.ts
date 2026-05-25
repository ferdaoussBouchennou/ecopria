import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PresenceService } from '../../presence/presence.service';
import {
  PresenceValidationResult,
  PresenceStatus
} from '../../../core/models/presence.model';

type ScanMode = 'camera' | 'manual';
type ScanState = 'idle' | 'validating' | 'result';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.css']
})
export class ScanComponent implements OnInit, OnDestroy {

  mode: ScanMode = 'camera';
  state: ScanState = 'idle';

  manualToken = '';
  participantUserId = '';
  actionId = '';

  actionQrCode = '';
  loadingActionQr = false;

  validatorLat: number | null = null;
  validatorLng: number | null = null;
  gpsError = '';
  gpsLoading = false;

  result: PresenceValidationResult | null = null;
  erreurMessage = '';

  history: Array<{ token: string; result: PresenceValidationResult; time: Date }> = [];

  cameraSimToken = '';

  constructor(private presenceService: PresenceService) {}

  ngOnInit(): void {
    this.getGpsPosition();
  }

  ngOnDestroy(): void {}

  getGpsPosition(): void {
    if (!navigator.geolocation) {
      this.gpsError = 'Géolocalisation non supportée.';
      return;
    }
    this.gpsLoading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.validatorLat = pos.coords.latitude;
        this.validatorLng = pos.coords.longitude;
        this.gpsLoading = false;
      },
      (err) => {
        this.gpsError = err.message;
        this.gpsLoading = false;
        this.validatorLat = 35.5785;
        this.validatorLng = -5.3684;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  loadActionQr(): void {
    const id = Number(this.actionId);
    if (!id) return;
    this.loadingActionQr = true;
    this.presenceService.getQrCodeParAction(id).subscribe({
      next: (res) => {
        this.actionQrCode = res.qrCode;
        this.loadingActionQr = false;
      },
      error: (err: Error) => {
        this.actionQrCode = '';
        this.erreurMessage = err.message;
        this.loadingActionQr = false;
      }
    });
  }

  setMode(m: ScanMode): void {
    this.mode = m;
    this.resetResult();
  }

  submitManual(): void {
    if (!this.manualToken.trim() || !this.participantUserId.trim()) return;
    this.valider(this.manualToken.trim(), Number(this.participantUserId));
  }

  simulateScan(): void {
    if (!this.cameraSimToken.trim() || !this.participantUserId.trim()) return;
    this.valider(this.cameraSimToken.trim(), Number(this.participantUserId));
  }

  valider(qrCode: string, userId: number): void {
    this.state = 'validating';
    this.erreurMessage = '';
    this.result = null;

    this.presenceService.valider(qrCode, userId).subscribe({
      next: (res: PresenceValidationResult) => {
        this.result = res;
        this.state = 'result';
        this.history.unshift({
          token: qrCode.slice(0, 12) + '…',
          result: res,
          time: new Date()
        });
        this.manualToken = '';
        this.cameraSimToken = '';
      },
      error: (err: Error) => {
        const status = this.presenceService.toUiStatus(err.message);
        this.result = {
          status,
          message: err.message,
          userId: Number(this.participantUserId) || undefined
        };
        this.state = 'result';
      }
    });
  }

  resetResult(): void {
    this.state = 'idle';
    this.result = null;
    this.erreurMessage = '';
    this.manualToken = '';
    this.cameraSimToken = '';
  }

  countStatus(status: PresenceStatus): number {
    return this.history.filter((h) => h.result.status === status).length;
  }

  get isSuccess(): boolean {
    return this.result?.status === 'VALIDE';
  }

  get isFraud(): boolean {
    return this.result?.status === 'FRAUDE_DETECTEE';
  }

  get resultClass(): string {
    if (!this.result) return '';
    const map: Record<PresenceStatus, string> = {
      VALIDE: 'result--success',
      DEJA_VALIDE: 'result--warning',
      QR_INVALIDE: 'result--error',
      GPS_HORS_ZONE: 'result--error',
      FRAUDE_DETECTEE: 'result--fraud',
      ERREUR: 'result--error'
    };
    return map[this.result.status] ?? 'result--error';
  }

  get resultIcon(): string {
    if (!this.result) return '';
    const map: Record<PresenceStatus, string> = {
      VALIDE: '✓',
      DEJA_VALIDE: '⚠',
      QR_INVALIDE: '✕',
      GPS_HORS_ZONE: '📍',
      FRAUDE_DETECTEE: '🚨',
      ERREUR: '✕'
    };
    return map[this.result.status] ?? '✕';
  }

  get resultLabel(): string {
    if (!this.result) return '';
    const map: Record<PresenceStatus, string> = {
      VALIDE: 'Présence validée !',
      DEJA_VALIDE: 'Déjà validé',
      QR_INVALIDE: 'QR Code invalide',
      GPS_HORS_ZONE: 'Hors zone GPS',
      FRAUDE_DETECTEE: 'Fraude détectée — admin alerté',
      ERREUR: 'Erreur'
    };
    return map[this.result.status] ?? 'Erreur';
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}
