import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { map, of, switchMap } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';

import {

  ActionAssociationRequest,

  ActionFixe,

  ActionFixeRequest,

  ActionNonFixe,

  ActionNonFixeDetail,

  AdminCategorie,

} from '../../../core/models/admin.model';



interface AssociationChoice {

  id: number;

  name: string;

  label: string;

}



@Component({

  selector: 'app-admin-actions-fixes',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './admin-actions-fixes.component.html',

  styleUrl: './admin-actions-fixes.component.scss',

})

export class AdminActionsFixesComponent implements OnInit {

  loading = true;

  saving = false;

  error = '';

  message = '';

  search = '';

  actionType: 'fixed' | 'non-fixed' = 'fixed';



  items: ActionFixe[] = [];

  nonFixedItems: ActionNonFixe[] = [];

  categories: AdminCategorie[] = [];

  editingId: number | null = null;

  editingNonFixedId: number | null = null;



  form: ActionFixeRequest = this.emptyForm();

  nonFixedForm: ActionAssociationRequest = this.emptyNonFixedForm();

  associationChoices: AssociationChoice[] = [];

  selectedAssociationId: number | null = null;



  programText = '';

  practicalInfosText = '';

  photoFile: File | null = null;

  photoPreview: string | null = null;

  existingPhotoUrl: string | null = null;

  photoError = '';



  constructor(private admin: AdminService) {}



  ngOnInit(): void {

    this.loadAssociationChoices();

    this.loadCategories();

    this.reload();

  }



  loadAssociationChoices(): void {

    this.admin.getActionAssociations().subscribe({

      next: (list) => {

        this.associationChoices = (list ?? []).map((a) => ({

          id: a.id,

          name: a.name,

          label: a.city ? `${a.name} — ${a.city}` : a.name,

        }));

      },

      error: () => {

        this.associationChoices = [];

      },

    });

  }



  loadCategories(): void {

    this.admin.getCategories().subscribe({

      next: (list) => {

        this.categories = list ?? [];

      },

      error: () => {

        this.categories = [];

      },

    });

  }



  onAssociationSelected(id: number | null): void {

    this.selectedAssociationId = id;

    if (id == null) {

      return;

    }

    this.nonFixedForm.associationId = id;

    const choice = this.associationChoices.find((a) => a.id === id);

    this.nonFixedForm.associationName = choice?.name ?? '';

  }



  get filteredItems(): ActionFixe[] {

    const q = this.search.trim().toLowerCase();

    if (!q) {

      return this.items;

    }

    return this.items.filter(

      (a) =>

        a.titre.toLowerCase().includes(q) ||

        a.categorie.toLowerCase().includes(q)

    );

  }



  get filteredNonFixedItems(): ActionNonFixe[] {

    const q = this.search.trim().toLowerCase();

    if (!q) {

      return this.nonFixedItems;

    }

    return this.nonFixedItems.filter(

      (a) =>

        (a.title ?? '').toLowerCase().includes(q) ||

        (a.categoryName ?? '').toLowerCase().includes(q)

    );

  }



  reload(): void {

    this.loading = true;

    this.error = '';

    if (this.actionType === 'fixed') {

      this.admin.getActionsFixes().subscribe({

        next: (list) => {

          this.items = list ?? [];

          this.loading = false;

        },

        error: () => {

          this.loading = false;

          this.error = 'Impossible de charger les actions fixes.';

        },

      });

      return;

    }



    this.admin.getActionsNonFixes().subscribe({

      next: (list) => {

        this.nonFixedItems = list ?? [];

        this.loading = false;

      },

      error: () => {

        this.loading = false;

        this.error = 'Impossible de charger les actions non fixes.';

      },

    });

  }



  startCreate(): void {

    this.editingId = null;

    this.editingNonFixedId = null;

    this.form = this.emptyForm();

    this.nonFixedForm = this.emptyNonFixedForm();

    this.selectedAssociationId = null;

    this.programText = '';

    this.practicalInfosText = '';

    this.clearPhotoSelection();
    this.existingPhotoUrl = null;

    this.message = '';

  }



  setActionType(type: 'fixed' | 'non-fixed'): void {

    if (this.actionType === type) {

      return;

    }

    this.actionType = type;

    this.startCreate();

    if (type === 'non-fixed') {

      this.loadAssociationChoices();

      this.loadCategories();

    }

    this.reload();

  }



  startEdit(item: ActionFixe): void {

    this.editingId = item.id;

    this.message = '';

    this.form = {

      titre: item.titre,

      description: item.description ?? '',

      categorie: item.categorie,

      points: item.points,

    };

  }



  startEditNonFixed(item: ActionNonFixe): void {

    this.editingId = null;

    this.editingNonFixedId = item.id;

    this.message = '';

    this.clearPhotoSelection();

    this.admin.getActionNonFixe(item.id).subscribe({

      next: (detail) => this.applyNonFixedDetail(detail),

      error: () => {

        this.message = 'Impossible de charger le détail de l’action.';

      },

    });

  }



  onPhotoSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    this.photoError = '';

    if (!file) {

      return;

    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {

      this.photoError = 'Format accepté : JPG, PNG ou WEBP.';

      input.value = '';

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      this.photoError = 'Image trop volumineuse (5 Mo max).';

      input.value = '';

      return;

    }

    if (this.photoPreview) {

      URL.revokeObjectURL(this.photoPreview);

    }

    this.photoFile = file;

    this.photoPreview = URL.createObjectURL(file);

  }



  clearPhotoSelection(): void {

    if (this.photoPreview) {

      URL.revokeObjectURL(this.photoPreview);

    }

    this.photoFile = null;

    this.photoPreview = null;

    this.photoError = '';

  }



  submit(): void {

    if (this.actionType === 'non-fixed') {

      this.submitNonFixed();

      return;

    }

    const titre = this.form.titre.trim();

    const categorie = this.form.categorie.trim();

    if (!titre || !categorie) {

      this.message = 'Titre et catégorie sont obligatoires.';

      return;

    }

    if (this.form.points == null || this.form.points < 0) {

      this.message = 'Les points doivent être un nombre positif.';

      return;

    }



    const body: ActionFixeRequest = {

      titre,

      categorie,

      points: Number(this.form.points),

      description: this.form.description?.trim() || undefined,

    };



    this.saving = true;

    this.message = '';

    const call =

      this.editingId != null

        ? this.admin.updateActionFixe(this.editingId, body)

        : this.admin.createActionFixe(body);



    call.subscribe({

      next: () => {

        this.saving = false;

        this.message = this.editingId != null ? 'Action mise à jour.' : 'Action créée.';

        this.editingId = null;

        this.form = this.emptyForm();

        this.reload();

      },

      error: (err) => {

        this.saving = false;

        this.message = this.readErrorMessage(err, 'Échec de l’enregistrement.');

      },

    });

  }



  submitNonFixed(): void {

    const titre = this.nonFixedForm.titre.trim();

    const categorie = this.nonFixedForm.categorie.trim();

    if (!titre || !categorie) {

      this.message = 'Titre et catégorie sont obligatoires.';

      return;

    }

    if (this.selectedAssociationId == null || this.selectedAssociationId <= 0) {

      this.message = 'Choisissez une association.';

      return;

    }

    if (!this.nonFixedForm.dateStart?.trim() || !this.nonFixedForm.dateEnd?.trim()) {

      this.message = 'Les dates de début et de fin sont obligatoires.';

      return;

    }

    this.nonFixedForm.associationId = this.selectedAssociationId;



    const body: ActionAssociationRequest = {

      titre,

      categorie,

      points: Number(this.nonFixedForm.points ?? 10),

      associationId: Number(this.nonFixedForm.associationId),

      description: this.nonFixedForm.description?.trim() || undefined,

      associationName: this.nonFixedForm.associationName?.trim() || undefined,

      address: this.nonFixedForm.address?.trim() || undefined,

      city: this.nonFixedForm.city?.trim() || undefined,

      lieu: this.nonFixedForm.lieu?.trim() || this.nonFixedForm.city?.trim() || undefined,

      latitude: Number(this.nonFixedForm.latitude ?? 33.5731),

      longitude: Number(this.nonFixedForm.longitude ?? -7.5898),

      placesTotal: this.nonFixedForm.placesTotal

        ? Number(this.nonFixedForm.placesTotal)

        : undefined,

      dateStart: this.nonFixedForm.dateStart.trim(),

      dateEnd: this.nonFixedForm.dateEnd.trim(),

      program: this.linesToArray(this.programText),

      practicalInfos: this.linesToArray(this.practicalInfosText),

    };



    const isEdit = this.editingNonFixedId != null;

    this.saving = true;

    this.message = '';



    const save$ = isEdit

      ? this.admin

          .updateActionNonFixe(this.editingNonFixedId!, body)

          .pipe(map(() => this.editingNonFixedId!))

      : this.admin.createActionNonFixe(body).pipe(map((created) => created.id));



    save$

      .pipe(

        switchMap((actionId) => {

          if (this.photoFile) {

            return this.admin

              .uploadActionPhoto(actionId, this.photoFile)

              .pipe(map(() => actionId));

          }

          return of(actionId);

        })

      )

      .subscribe({

        next: () => {

          this.saving = false;

          this.message = isEdit ? 'Action non fixe mise à jour.' : 'Action non fixe créée.';

          this.editingNonFixedId = null;

          this.nonFixedForm = this.emptyNonFixedForm();

          this.selectedAssociationId = null;

          this.programText = '';

          this.practicalInfosText = '';

          this.clearPhotoSelection();

          this.reload();

        },

        error: (err) => {

          this.saving = false;

          this.message = this.readErrorMessage(err, 'Échec de l’enregistrement.');

        },

      });

  }



  deactivate(item: ActionFixe, event: Event): void {

    event.stopPropagation();

    if (!item.active) {

      return;

    }

    if (!confirm(`Désactiver « ${item.titre} » ?`)) {

      return;

    }

    this.admin.deactivateActionFixe(item.id).subscribe({

      next: () => {

        this.message = 'Action désactivée.';

        this.reload();

      },

      error: () => {

        this.message = 'Échec de la désactivation.';

      },

    });

  }



  deactivateNonFixed(item: ActionNonFixe, event: Event): void {

    event.stopPropagation();

    if (item.status === 'CANCELLED') {

      return;

    }

    if (!confirm(`Désactiver « ${item.title} » ?`)) {

      return;

    }

    this.admin.deactivateActionNonFixe(item.id).subscribe({

      next: () => {

        this.message = 'Action non fixe désactivée.';

        this.reload();

      },

      error: () => {

        this.message = 'Échec de la désactivation.';

      },

    });

  }



  statusLabel(item: ActionFixe): string {

    return item.active ? 'Active' : 'Brouillon';

  }



  statusClass(item: ActionFixe): string {

    return item.active ? 'status-pill--active' : 'status-pill--draft';

  }



  private applyNonFixedDetail(detail: ActionNonFixeDetail): void {

    this.nonFixedForm = {

      titre: detail.title ?? '',

      categorie: detail.categoryName ?? '',

      description: detail.description ?? '',

      points: detail.points ?? 10,

      associationId: detail.associationId ?? 0,

      associationName: detail.associationName ?? '',

      latitude: detail.latitude ?? 33.5731,

      longitude: detail.longitude ?? -7.5898,

      address: detail.address ?? '',

      city: detail.city ?? '',

      lieu: detail.city ?? '',

      placesTotal: detail.maxParticipants ?? 20,

      dateStart: this.toDatetimeLocal(detail.dateStart),

      dateEnd: this.toDatetimeLocal(detail.dateEnd),

    };

    this.programText = this.arrayToLines(detail.program);

    this.practicalInfosText = this.arrayToLines(detail.practicalInfos);

    this.selectedAssociationId = detail.associationId ?? null;

    this.existingPhotoUrl = detail.photoUrls?.[0] ?? null;

  }



  private emptyForm(): ActionFixeRequest {

    return {

      titre: '',

      categorie: '',

      description: '',

      points: 10,

    };

  }



  private emptyNonFixedForm(): ActionAssociationRequest {

    const start = new Date();

    start.setDate(start.getDate() + 1);

    start.setHours(10, 0, 0, 0);

    const end = new Date(start);

    end.setHours(12, 0, 0, 0);



    return {

      titre: '',

      categorie: '',

      description: '',

      associationId: 0,

      associationName: '',

      latitude: 33.5731,

      longitude: -7.5898,

      points: 10,

      placesTotal: 20,

      address: '',

      city: '',

      lieu: '',

      dateStart: this.formatDatetimeLocal(start),

      dateEnd: this.formatDatetimeLocal(end),

    };

  }



  private formatDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private toDatetimeLocal(value?: string): string {

    if (!value) {

      return '';

    }

    return value.length >= 16 ? value.slice(0, 16) : value;

  }



  private arrayToLines(items?: string[]): string {

    return (items ?? []).join('\n');

  }



  private linesToArray(text: string): string[] | undefined {

    const lines = text

      .split('\n')

      .map((line) => line.trim())

      .filter(Boolean);

    return lines.length ? lines : undefined;

  }



  private readErrorMessage(err: unknown, fallback: string): string {

    if (!(err instanceof HttpErrorResponse)) {

      return fallback;

    }

    const body = err.error;

    if (typeof body === 'string' && body.trim()) {

      return body;

    }

    if (body && typeof body === 'object' && 'message' in body) {

      const message = (body as { message?: string }).message;

      if (message?.trim()) {

        return message;

      }

    }

    if (err.status === 0) {

      return 'Service indisponible. Vérifiez que admin-service et service-action (9090) sont démarrés.';

    }

    return fallback;

  }

}


