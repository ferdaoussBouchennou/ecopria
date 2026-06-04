import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecompenseService } from '../recompense.service';
import {
  CouponDto,
  RecompenseItemDto,
  ResultatMystereBox
} from '../../../core/models/recompense.model';

@Component({
  selector: 'app-catalogue-recompenses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss']
})
export class CatalogueRecompensesComponent implements OnInit {
  offres: RecompenseItemDto[] = [];
  loading = true;
  erreur = '';
  actionId: number | null = null;
  mystereResult: ResultatMystereBox | null = null;
  showMystereModal = false;
  dernierCoupon: CouponDto | null = null;
  showCouponModal = false;

  constructor(private recompenseService: RecompenseService) {}

  ngOnInit(): void {
    this.recompenseService.getCatalogue().subscribe({
      next: (list) => {
        this.offres = list;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  ouvrirDetail(o: RecompenseItemDto): void {
    this.recompenseService.enregistrerClic(o.id).subscribe({ error: () => {} });
  }

  echanger(o: RecompenseItemDto): void {
    if (!o.isAvailable) return;
    if (!confirm(`Échanger ${o.pointsNecessaires} pts pour « ${o.title} » ?`)) return;
    this.actionId = o.id;
    this.recompenseService.echanger(o.id).subscribe({
      next: (c) => {
        this.dernierCoupon = c;
        this.showCouponModal = true;
        this.actionId = null;
      },
      error: (e: Error) => {
        alert(e.message);
        this.actionId = null;
      }
    });
  }

  ouvrirMystere(o: RecompenseItemDto): void {
    if (!o.hasMystereBox || !o.mystereBoxPoints) return;
    if (!confirm(`Ouvrir la boîte mystère pour ${o.mystereBoxPoints} pts ?`)) return;
    this.actionId = o.id;
    this.recompenseService.ouvrirMystereBox(o.id).subscribe({
      next: (r) => {
        this.mystereResult = r;
        this.showMystereModal = true;
        this.actionId = null;
      },
      error: (e: Error) => {
        alert(e.message);
        this.actionId = null;
      }
    });
  }

  fermerModals(): void {
    this.showMystereModal = false;
    this.showCouponModal = false;
    this.mystereResult = null;
    this.dernierCoupon = null;
  }
}
