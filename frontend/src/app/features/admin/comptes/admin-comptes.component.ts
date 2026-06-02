import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminPendingAccount } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-comptes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-comptes.component.html',
  styleUrl: './admin-comptes.component.scss',
})
export class AdminComptesComponent implements OnInit {
  loading = true;
  error = '';
  associations: AdminPendingAccount[] = [];
  partenaires: AdminPendingAccount[] = [];
  actionMessage = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.admin.getPendingAssociations().subscribe({
      next: (rows) => {
        this.associations = rows;
        this.admin.getPendingPartenaires().subscribe({
          next: (parts) => {
            this.partenaires = parts;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.error = 'Impossible de charger les partenaires en attente.';
          },
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les associations en attente.';
      },
    });
  }

  approveAssociation(id: number): void {
    this.admin.approveAssociation(id).subscribe({
      next: () => {
        this.actionMessage = 'Association approuvée.';
        this.reload();
      },
      error: () => {
        this.actionMessage = 'Échec de l’approbation.';
      },
    });
  }

  accountName(item: AdminPendingAccount): string {
    return item.name ?? item.nom ?? 'Sans nom';
  }

  accountId(item: AdminPendingAccount): number {
    return item.id ?? item.authId ?? 0;
  }
}
