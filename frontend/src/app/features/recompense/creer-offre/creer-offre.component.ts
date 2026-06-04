import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PartenaireService } from '../partenaire.service';
import { CreateRecompenseRequest, RecompenseType } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-creer-offre',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './creer-offre.component.html',
  styleUrls: ['./creer-offre.component.scss']
})
export class CreerOffreComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  loadingOffre = false;
  erreur = '';
  succes = '';
  editId: number | null = null;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  imageUploadError = '';

  readonly types: { value: RecompenseType; label: string }[] = [
    { value: 'STOCK',      label: 'Stock (objet physique)' },
    { value: 'REDUCTION',  label: 'Réduction (%)' },
    { value: 'SERVICE',    label: 'Service / prestation' },
    { value: 'EXPERIENCE', label: 'Expérience' }
  ];

  constructor(
    private fb: FormBuilder,
    private partenaireService: PartenaireService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title:             ['', [Validators.required, Validators.maxLength(200)]],
      description:       [''],
      pointsNecessaires: [150, [Validators.required, Validators.min(1)]],
      type:              ['STOCK' as RecompenseType, Validators.required],
      stock:             [10],
      discountPercentage:[null as number | null],
      valeurDh:          [null as number | null],
      dateExpiration:    [''],
      hasMystereBox:     [false],
      mystereBoxPoints:  [80],
      mystereBoxItems:   this.fb.array([])
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.chargerOffre(this.editId);
    } else {
      // Pré-remplir 2 items pour la boîte mystère (désactivés par défaut)
      this.ajouterItemMystere();
      this.ajouterItemMystere();
    }
  }

  get mystereItems(): FormArray {
    return this.form.get('mystereBoxItems') as FormArray;
  }

  get probaTotal(): number {
    return this.mystereItems.controls.reduce(
      (sum, c) => sum + (Number(c.get('probabilite')?.value) || 0), 0
    );
  }

  get showStock(): boolean {
    const t = this.form.get('type')?.value;
    return t === 'STOCK' || t === 'EXPERIENCE';
  }

  get showReduction(): boolean {
    return this.form.get('type')?.value === 'REDUCTION';
  }

  get hasMystereBoxValue(): boolean {
    return !!this.form.get('hasMystereBox')?.value;
  }

  private chargerOffre(id: number): void {
    this.loadingOffre = true;
    this.partenaireService.getMesOffres().subscribe({
      next: (list) => {
        const o = list.find((x) => x.id === id);
        if (!o) {
          this.erreur = 'Offre introuvable';
          this.loadingOffre = false;
          return;
        }
        this.imagePreview = o.imageUrl ?? null;
        this.form.patchValue({
          title:             o.title,
          description:       o.description ?? '',
          pointsNecessaires: o.pointsNecessaires,
          type:              o.type,
          stock:             o.stock ?? 0,
          discountPercentage:o.discountPercentage ?? null,
          valeurDh:          o.valeurDh ?? null,
          dateExpiration:    o.dateExpiration ? o.dateExpiration.slice(0, 16) : '',
          hasMystereBox:     o.hasMystereBox ?? false,
          mystereBoxPoints:  o.mystereBoxPoints ?? 80
        });
        this.mystereItems.clear();
        if (o.mystereBoxItems?.length) {
          o.mystereBoxItems.forEach((item: any) => this.mystereItems.push(this.creerItemGroup(item)));
        } else {
          this.ajouterItemMystere();
          this.ajouterItemMystere();
        }
        this.loadingOffre = false;
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loadingOffre = false;
      }
    });
  }

  private creerItemGroup(item?: { titre: string; description?: string; probabilite: number }): FormGroup {
    return this.fb.group({
      titre:       [item?.titre ?? ''],
      description: [item?.description ?? ''],
      probabilite: [item?.probabilite ?? 50]
    });
  }

  ajouterItemMystere(): void {
    this.mystereItems.push(this.creerItemGroup());
  }

  supprimerItemMystere(i: number): void {
    if (this.mystereItems.length > 2) {
      this.mystereItems.removeAt(i);
    }
  }

  onMystereToggle(): void {
    if (this.hasMystereBoxValue && this.mystereItems.length < 2) {
      while (this.mystereItems.length < 2) {
        this.ajouterItemMystere();
      }
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imageUploadError = '';
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.imageUploadError = 'Format non supporté. Utilisez JPG, PNG ou WEBP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.imageUploadError = 'Fichier trop volumineux (maximum 5 Mo).';
      return;
    }
    this.imageFile = file;
    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = URL.createObjectURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.imageFile = null;
    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = null;
    this.imageUploadError = '';
  }

  submit(): void {
    this.erreur = '';
    this.succes = '';

    // Validation manuelle boîte mystère
    if (this.hasMystereBoxValue) {
      const items = this.mystereItems.controls;
      if (items.length < 2) {
        this.erreur = 'Ajoutez au moins 2 offres secrètes dans la boîte mystère.';
        return;
      }
      for (const item of items) {
        if (!item.get('titre')?.value?.trim()) {
          this.erreur = 'Chaque offre secrète doit avoir un titre.';
          return;
        }
        const secretTitle = item.get('titre')?.value?.trim().toLowerCase();
        const mainTitle = this.form.get('title')?.value?.trim().toLowerCase();
        if (mainTitle && secretTitle === mainTitle) {
          this.erreur = 'Une offre secrète ne peut pas avoir le même titre que l\'offre principale.';
          return;
        }
      }
      if (this.probaTotal !== 100) {
        this.erreur = `La somme des probabilités doit être 100 % (actuel : ${this.probaTotal} %).`;
        return;
      }
      const mbPoints = Number(this.form.get('mystereBoxPoints')?.value);
      if (!mbPoints || mbPoints < 1) {
        this.erreur = 'Indiquez le coût en points de la boîte mystère.';
        return;
      }
    }

    // Validation du formulaire principal
    if (this.form.get('title')?.invalid) {
      this.erreur = 'Le titre est obligatoire.';
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.get('pointsNecessaires')?.invalid) {
      this.erreur = 'Les points requis doivent être supérieurs à 0.';
      this.form.markAllAsTouched();
      return;
    }
    if (this.showStock && (!this.form.get('stock')?.value || this.form.get('stock')?.value < 1)) {
      this.erreur = 'Le stock doit être supérieur à 0.';
      return;
    }
    if (this.showReduction && !this.form.get('discountPercentage')?.value) {
      this.erreur = 'Le pourcentage de réduction est obligatoire.';
      return;
    }

    const raw = this.form.getRawValue();

    const dto: CreateRecompenseRequest = {
      title:             raw.title.trim(),
      description:       raw.description?.trim() || undefined,
      pointsNecessaires: Number(raw.pointsNecessaires),
      type:              raw.type,
      stock:             this.showStock ? Number(raw.stock) : undefined,
      discountPercentage:this.showReduction ? Number(raw.discountPercentage) : undefined,
      valeurDh:          (raw.valeurDh !== null && raw.valeurDh !== '' && raw.valeurDh !== undefined)
                           ? Number(raw.valeurDh) : undefined,
      dateExpiration:    raw.dateExpiration ? raw.dateExpiration : undefined,
      hasMystereBox:     !!raw.hasMystereBox,
      mystereBoxPoints:  raw.hasMystereBox ? Number(raw.mystereBoxPoints) : undefined,
      mystereBoxItems:   raw.hasMystereBox
        ? raw.mystereBoxItems.map((i: { titre: string; description?: string; probabilite: number }) => ({
            titre:       i.titre.trim(),
            description: i.description?.trim() || undefined,
            probabilite: Number(i.probabilite)
          }))
        : undefined
    };

    this.loading = true;

    const save$ = this.editId
      ? this.partenaireService.modifierOffre(this.editId, dto)
      : this.partenaireService.creerOffre(dto);

    save$.pipe(
      switchMap((result) => {
        if (!this.imageFile) return of(result);
        return this.partenaireService.uploadOffreImage(result.id, this.imageFile).pipe(
          switchMap(() => of(result))
        );
      })
    ).subscribe({
      next: (result) => {
        this.succes = this.editId
          ? `✓ Offre "${result.title}" mise à jour avec succès.`
          : `✓ Offre "${result.title}" créée avec succès.`;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/partenaire/offres']), 1500);
      },
      error: (e: Error) => {
        this.erreur = e.message;
        this.loading = false;
      }
    });
  }

  get pageTitle(): string {
    return this.editId ? "Modifier l'offre" : 'Nouvelle offre';
  }
}
