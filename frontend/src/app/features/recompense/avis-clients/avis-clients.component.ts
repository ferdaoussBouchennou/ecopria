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
  loading = true;
  erreur = '';
  reponseDraft: Record<number, string> = {};
  savingId: number | null = null;

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.partenaireService.getAvis().subscribe({
      next: (list) => {
        this.avis = list;
        list.forEach((a) => {
          if (a.reponse) this.reponseDraft[a.id] = a.reponse;
        });
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  moyenne(): number | null {
    if (!this.avis.length) return null;
    const s = this.avis.reduce((acc, a) => acc + a.rating, 0);
    return Math.round((s / this.avis.length) * 10) / 10;
  }

  publierReponse(a: AvisPartenaire): void {
    const texte = (this.reponseDraft[a.id] ?? '').trim();
    if (!texte) return;
    this.savingId = a.id;
    this.partenaireService.repondreAvis(a.id, texte).subscribe({
      next: (updated) => {
        this.avis = this.avis.map((x) => (x.id === a.id ? updated : x));
        this.savingId = null;
      },
      error: (e: Error) => {
        alert(e.message);
        this.savingId = null;
      }
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
