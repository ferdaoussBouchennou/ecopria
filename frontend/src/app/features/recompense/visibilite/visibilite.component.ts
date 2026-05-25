import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartenaireService } from '../partenaire.service';
import { VisibilitePartenaire } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-visibilite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visibilite.component.html',
  styleUrls: ['./visibilite.component.scss']
})
export class VisibiliteComponent implements OnInit {
  data: VisibilitePartenaire | null = null;
  loading = true;
  erreur = '';

  constructor(private partenaireService: PartenaireService) {}

  ngOnInit(): void {
    this.partenaireService.getVisibilite().subscribe({
      next: (d) => {
        this.data = d;
        this.loading = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }
}
