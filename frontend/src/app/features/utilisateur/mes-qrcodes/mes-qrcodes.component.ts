import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InscriptionService } from '../../inscription/inscription.service';
import { PresenceService } from '../../presence/presence.service';
import { InscriptionResponse } from '../../../core/models/inscription.model';
import { ActionDTO } from '../../inscription/models/inscription.model';

interface QrCardItem {
  inscription: InscriptionResponse;
  action: ActionDTO | null;
  token: string;
  loadingAction: boolean;
  qrError?: string;
}

@Component({
  selector: 'app-mes-qrcodes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mes-qrcodes.component.html',
  styleUrls: ['./mes-qrcodes.component.css']
})
export class MesQrcodesComponent implements OnInit {

  items: QrCardItem[] = [];
  loading = true;
  erreurMessage = '';

  constructor(
    private inscriptionService: InscriptionService,
    private presenceService: PresenceService,
    private auth: AuthService,
    private router: Router
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    try {
      this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreurMessage = '';

    this.inscriptionService.getMesInscriptions(this.userId).subscribe({
      next: (list) => {
        const confirmees = list.filter((i) => i.statut === 'CONFIRMEE');
        if (confirmees.length === 0) {
          this.items = [];
          this.loading = false;
          return;
        }

        const qrRequests = confirmees.map((insc) =>
          this.presenceService.getQrCodeParAction(insc.actionId).pipe(
            map((qr) => ({ insc, token: qr.qrCode })),
            catchError((err: Error) =>
              of({ insc, token: '', qrError: err.message })
            )
          )
        );

        forkJoin(qrRequests).subscribe({
          next: (results) => {
            this.items = results.map((r) => ({
              inscription: r.insc,
              action: null,
              token: r.token,
              loadingAction: true,
              qrError: 'qrError' in r ? (r as { qrError: string }).qrError : undefined
            }));
            this.loading = false;
            this.items.forEach((item, idx) => {
              this.inscriptionService.getAction(item.inscription.actionId).subscribe({
                next: (action) => {
                  this.items[idx] = { ...this.items[idx], action, loadingAction: false };
                },
                error: () => {
                  this.items[idx] = { ...this.items[idx], loadingAction: false };
                }
              });
            });
          },
          error: (err: Error) => {
            this.erreurMessage = err.message;
            this.loading = false;
          }
        });
      },
      error: (err: Error) => {
        this.erreurMessage = err.message;
        this.loading = false;
      }
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatExpiry(iso?: string): string {
    if (!iso) return 'Minuit le jour de l\'action';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get activeItems(): QrCardItem[] {
    return this.items.filter((i) => !!i.token);
  }

  get pendingItems(): QrCardItem[] {
    return this.items.filter((i) => !i.token);
  }
}
