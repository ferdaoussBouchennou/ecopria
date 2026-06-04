import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import { AdminConfiguration } from '../../../core/models/admin.model';

type ConfigInputType = 'percent' | 'number' | 'email' | 'boolean' | 'text';

interface ConfigUiMeta {
  cle: string;
  label: string;
  hint: string;
  group: string;
  type: ConfigInputType;
  min?: number;
  max?: number;
  active: boolean;
}

@Component({
  selector: 'app-admin-configurations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-configurations.component.html',
  styleUrl: './admin-configurations.component.scss',
})
export class AdminConfigurationsComponent implements OnInit {
  loading = true;
  savingCle: string | null = null;
  error = '';
  message = '';
  items: AdminConfiguration[] = [];
  drafts = new Map<string, string>();

  readonly groups = [
    'Commission & récompenses',
    'Actions & inscriptions',
    'Plateforme & communication',
    'Autres paramètres',
  ];

  private readonly metaByCle: Record<string, ConfigUiMeta> = {
    taux_commission: {
      cle: 'taux_commission',
      label: 'Taux de commission global',
      hint: 'Pourcentage appliqué aux commissions partenaires. Utilisé sur le tableau de bord admin.',
      group: 'Commission & récompenses',
      type: 'percent',
      min: 5,
      max: 30,
      active: true,
    },
    points_defaut_action: {
      cle: 'points_defaut_action',
      label: 'Points par défaut (nouvelle action)',
      hint: 'Valeur de référence pour les associations lors de la création d’actions.',
      group: 'Actions & inscriptions',
      type: 'number',
      min: 1,
      max: 500,
      active: false,
    },
    places_max_defaut_action: {
      cle: 'places_max_defaut_action',
      label: 'Places max par défaut',
      hint: 'Capacité indicative pour une nouvelle action citoyenne.',
      group: 'Actions & inscriptions',
      type: 'number',
      min: 1,
      max: 500,
      active: false,
    },
    email_support: {
      cle: 'email_support',
      label: 'E-mail support',
      hint: 'Contact affiché dans les e-mails et pages d’aide.',
      group: 'Plateforme & communication',
      type: 'email',
      active: false,
    },
    delai_resend_verification_sec: {
      cle: 'delai_resend_verification_sec',
      label: 'Délai renvoi code vérification',
      hint: 'Secondes entre deux envois de code (auth-service : variable dédiée dans .env).',
      group: 'Plateforme & communication',
      type: 'number',
      min: 30,
      max: 600,
      active: false,
    },
    plateforme_maintenance: {
      cle: 'plateforme_maintenance',
      label: 'Mode maintenance',
      hint: 'Si activé, prévu pour bloquer l’accès public (à connecter à la gateway).',
      group: 'Plateforme & communication',
      type: 'boolean',
      active: false,
    },
  };

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.admin.getConfigurations().subscribe({
      next: (list) => {
        this.items = list ?? [];
        this.drafts.clear();
        for (const item of this.items) {
          this.drafts.set(item.cle, item.valeur);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error =
          'Impossible de charger les configurations. Vérifiez admin-service (8087) et la gateway (8080).';
      },
    });
  }

  itemsForGroup(group: string): AdminConfiguration[] {
    return this.items.filter((item) => this.meta(item.cle).group === group);
  }

  meta(cle: string): ConfigUiMeta {
    const item = this.items.find((i) => i.cle === cle);
    return (
      this.metaByCle[cle] ?? {
        cle,
        label: this.formatCleLabel(cle),
        hint: item?.description?.trim() || 'Paramètre plateforme.',
        group: 'Autres paramètres',
        type: 'text',
        active: false,
      }
    );
  }

  draftValue(item: AdminConfiguration): string {
    return this.drafts.get(item.cle) ?? item.valeur;
  }

  setDraft(cle: string, value: string): void {
    this.drafts.set(cle, value);
  }

  isDirty(item: AdminConfiguration): boolean {
    return this.draftValue(item).trim() !== (item.valeur ?? '').trim();
  }

  save(item: AdminConfiguration): void {
    const meta = this.meta(item.cle);
    const valeur = this.draftValue(item).trim();
    if (!valeur) {
      this.error = 'La valeur ne peut pas être vide.';
      return;
    }

    this.savingCle = item.cle;
    this.error = '';
    this.message = '';

    this.admin.updateConfiguration(item.cle, valeur, item.description).subscribe({
      next: (updated) => {
        this.savingCle = null;
        this.message = `« ${meta.label} » enregistré.`;
        const idx = this.items.findIndex((c) => c.cle === item.cle);
        if (idx >= 0) {
          this.items[idx] = updated;
        }
        this.drafts.set(item.cle, updated.valeur);
      },
      error: (err: HttpErrorResponse) => {
        this.savingCle = null;
        this.error = this.extractError(err, 'Enregistrement impossible.');
      },
    });
  }

  resetDraft(item: AdminConfiguration): void {
    this.drafts.set(item.cle, item.valeur);
    this.error = '';
  }

  onPercentInput(item: AdminConfiguration, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.setDraft(item.cle, value);
  }

  onNumberChange(cle: string, value: number | string | null): void {
    if (value === null || value === '') {
      this.setDraft(cle, '');
      return;
    }
    this.setDraft(cle, String(value));
  }

  toggleMaintenance(item: AdminConfiguration): void {
    const current = this.draftValue(item).toLowerCase() === 'true';
    this.setDraft(item.cle, current ? 'false' : 'true');
  }

  formatUpdated(at?: string): string {
    if (!at) {
      return '—';
    }
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? at : d.toLocaleString('fr-FR');
  }

  private formatCleLabel(cle: string): string {
    return cle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.message) {
      return body.message;
    }
    return fallback;
  }
}
