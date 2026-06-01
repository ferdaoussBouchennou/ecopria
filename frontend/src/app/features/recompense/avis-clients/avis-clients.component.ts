import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../partenaire.service';
import { AvisPartenaire } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-avis-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avis-clients.component.html',
  styleUrls: ['./avis-clients.component.scss']
})
export class AvisClientsComponent implements OnInit {
  avis: AvisPartenaire[] = [];
  loading  = true;
  saving   = false;
  erreur   = '';
  editingId : number | null = null;
  expandedId: number | null = null;
  reponseTexte = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.erreur  = '';
    this.partenaireService.getAvis().subscribe({
      next:  (list) => { this.avis = list; this.loading = false; },
      error: (e: Error) => { this.erreur = e.message; this.loading = false; }
    });
  }

  get noteMoyenne(): string | null {
    if (!this.avis.length) return null;
    const sum = this.avis.reduce((acc, a) => acc + a.rating, 0);
    return (sum / this.avis.length).toFixed(1);
  }

  startEdit(a: AvisPartenaire): void {
    this.editingId    = a.id;
    this.reponseTexte = a.reponse ?? '';
    this.expandedId   = null;
  }

  cancelEdit(): void {
    this.editingId    = null;
    this.expandedId   = null;
    this.reponseTexte = '';
  }

  enregistrerReponse(avisId: number): void {
    if (!this.reponseTexte.trim()) return;
    this.saving = true;
    this.partenaireService.repondreAvis(avisId, this.reponseTexte.trim()).subscribe({
      next: (updated) => {
        this.avis       = this.avis.map((a) => (a.id === avisId ? updated : a));
        this.editingId  = null;
        this.expandedId = null;
        this.saving     = false;
      },
      error: (e: Error) => {
        alert(e.message);
        this.saving = false;
      }
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
