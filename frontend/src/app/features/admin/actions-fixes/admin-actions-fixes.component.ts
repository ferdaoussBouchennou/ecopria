import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { map, of, switchMap } from 'rxjs';
import * as L from 'leaflet';
import { AdminService } from '../../../core/services/admin.service';
import {
  ActionAssociationRequest,
  ActionFixe,
  ActionFixeRequest,
  ActionNonFixe,
  ActionNonFixeDetail,
  AdminCategorie,
} from '../../../core/models/admin.model';
import {
  datetimeLocalToApi,
  formatNaiveDate,
  nowDatetimeLocalInput,
} from '../../../core/utils/datetime-local.util';

type FormMode = 'create' | 'edit' | 'view';
type ActionKind = 'fixed' | 'non-fixed';

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
export class AdminActionsFixesComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  saving = false;
  error = '';
  message = '';
  search = '';
  listType: ActionKind = 'fixed';
  fixedStatusFilter: 'all' | 'active' | 'inactive' = 'all';
  assoStatusFilter: 'all' | 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | 'COMPLETED' = 'all';
  formVisible = false;
  formKind: ActionKind = 'fixed';
  formMode: FormMode = 'create';

  readonly pageSize = 8;
  currentPageFixed = 1;
  currentPageNonFixed = 1;

  items: ActionFixe[] = [];
  nonFixedItems: ActionNonFixe[] = [];
  categories: AdminCategorie[] = [];
  editingId: number | null = null;
  editingNonFixedId: number | null = null;
  viewingFixedItem: ActionFixe | null = null;

  form: ActionFixeRequest = this.emptyForm();
  nonFixedForm: ActionAssociationRequest = this.emptyNonFixedForm();
  associationChoices: AssociationChoice[] = [];
  selectedAssociationId: number | null = null;
  postalCode = '';

  programItems: string[] = [];
  practicalInfoItems: string[] = [];

  photoFile: File | null = null;
  photoPreview: string | null = null;
  existingPhotoUrl: string | null = null;
  photoError = '';

  minDateTime = '';
  isGeocoding = false;
  geocodeError: string | null = null;
  geocodeSuccess = false;

  private map?: L.Map;
  private marker?: L.Marker;
  private mapInitScheduled = false;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.minDateTime = nowDatetimeLocalInput();
    this.loadAssociationChoices();
    this.loadCategories();
    this.reload();
  }

  ngAfterViewInit(): void {
    if (this.formVisible && this.formKind === 'non-fixed') {
      this.scheduleMapInit();
    }
  }

  get isFormReadonly(): boolean {
    return this.formMode === 'view';
  }

  get formTitle(): string {
    if (this.formKind === 'fixed') {
      if (this.formMode === 'view') return 'Détail de l’action fixe';
      if (this.formMode === 'edit') return 'Modifier l’action fixe';
      return 'Nouvelle action fixe';
    }
    if (this.formMode === 'view') return 'Détail de l’action association';
    if (this.formMode === 'edit') return 'Modifier l’action association';
    return 'Nouvelle action pour une association';
  }

  ngOnDestroy(): void {
    this.destroyMap();
    this.clearPhotoSelection();
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.formVisible && !this.saving) {
      this.closeForm();
    }
  }

  get isLocationReady(): boolean {
    return this.nonFixedForm.latitude != null && this.nonFixedForm.longitude != null;
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
    let list = this.items;
    if (this.fixedStatusFilter === 'active') {
      list = list.filter((a) => !!a.active);
    } else if (this.fixedStatusFilter === 'inactive') {
      list = list.filter((a) => !a.active);
    }
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (a) =>
        a.titre.toLowerCase().includes(q) ||
        a.categorie.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q)
    );
  }

  get filteredNonFixedItems(): ActionNonFixe[] {
    let list = this.nonFixedItems;
    if (this.assoStatusFilter !== 'all') {
      list = list.filter((a) => a.status === this.assoStatusFilter);
    }
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (a) =>
        (a.title ?? '').toLowerCase().includes(q) ||
        (a.categoryName ?? '').toLowerCase().includes(q) ||
        (a.associationName ?? '').toLowerCase().includes(q) ||
        (a.city ?? '').toLowerCase().includes(q)
    );
  }

  get countFixedActive(): number {
    return this.items.filter((a) => !!a.active).length;
  }

  get countFixedInactive(): number {
    return this.items.filter((a) => !a.active).length;
  }

  get countAssoDraft(): number {
    return this.nonFixedItems.filter((a) => a.status === 'DRAFT').length;
  }

  get countAssoCancelled(): number {
    return this.nonFixedItems.filter((a) => a.status === 'CANCELLED').length;
  }

  setFixedStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.fixedStatusFilter = filter;
    this.currentPageFixed = 1;
  }

  setAssoStatusFilter(filter: 'all' | 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | 'COMPLETED'): void {
    this.assoStatusFilter = filter;
    this.currentPageNonFixed = 1;
  }

  get totalPagesFixed(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
  }

  get totalPagesNonFixed(): number {
    return Math.max(1, Math.ceil(this.filteredNonFixedItems.length / this.pageSize));
  }

  get paginatedFixedItems(): ActionFixe[] {
    const start = (this.currentPageFixed - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get paginatedNonFixedItems(): ActionNonFixe[] {
    const start = (this.currentPageNonFixed - 1) * this.pageSize;
    return this.filteredNonFixedItems.slice(start, start + this.pageSize);
  }

  get paginationLabelFixed(): string {
    if (this.filteredItems.length === 0) return 'Aucun résultat';
    const start = (this.currentPageFixed - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPageFixed * this.pageSize, this.filteredItems.length);
    return `${start}–${end} sur ${this.filteredItems.length}`;
  }

  get paginationLabelNonFixed(): string {
    if (this.filteredNonFixedItems.length === 0) return 'Aucun résultat';
    const start = (this.currentPageNonFixed - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPageNonFixed * this.pageSize, this.filteredNonFixedItems.length);
    return `${start}–${end} sur ${this.filteredNonFixedItems.length}`;
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    if (this.listType === 'fixed') {
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

  onSearchChange(): void {
    this.currentPageFixed = 1;
    this.currentPageNonFixed = 1;
  }

  switchListType(type: 'fixed' | 'non-fixed'): void {
    if (this.listType === type) {
      return;
    }
    this.listType = type;
    this.currentPageFixed = 1;
    this.currentPageNonFixed = 1;
    this.reload();
  }

  changePageFixed(page: number): void {
    if (page >= 1 && page <= this.totalPagesFixed) {
      this.currentPageFixed = page;
    }
  }

  changePageNonFixed(page: number): void {
    if (page >= 1 && page <= this.totalPagesNonFixed) {
      this.currentPageNonFixed = page;
    }
  }

  resetFormState(): void {
    this.editingId = null;
    this.editingNonFixedId = null;
    this.viewingFixedItem = null;
    this.form = this.emptyForm();
    this.nonFixedForm = this.emptyNonFixedForm();
    this.selectedAssociationId = null;
    this.postalCode = '';
    this.programItems = [];
    this.practicalInfoItems = [];
    this.geocodeError = null;
    this.geocodeSuccess = false;
    this.clearPhotoSelection();
    this.existingPhotoUrl = null;
  }

  openCreateFixed(): void {
    this.destroyMap();
    this.resetFormState();
    this.formVisible = true;
    this.formKind = 'fixed';
    this.formMode = 'create';
    this.message = '';
    this.lockBodyScroll();
  }

  openCreateAssociation(): void {
    this.resetFormState();
    this.formVisible = true;
    this.formKind = 'non-fixed';
    this.formMode = 'create';
    this.message = '';
    this.loadAssociationChoices();
    this.loadCategories();
    this.lockBodyScroll();
    this.scheduleMapInit();
  }

  closeForm(): void {
    this.destroyMap();
    this.formVisible = false;
    this.resetFormState();
    this.message = '';
    document.body.style.overflow = '';
  }

  viewFixed(item: ActionFixe): void {
    this.destroyMap();
    this.resetFormState();
    this.viewingFixedItem = item;
    this.formVisible = true;
    this.formKind = 'fixed';
    this.formMode = 'view';
    this.form = {
      titre: item.titre,
      description: item.description ?? '',
      categorie: item.categorie,
      points: item.points,
    };
    this.lockBodyScroll();
  }

  editFixed(item: ActionFixe): void {
    this.destroyMap();
    this.resetFormState();
    this.editingId = item.id;
    this.formVisible = true;
    this.formKind = 'fixed';
    this.formMode = 'edit';
    this.form = {
      titre: item.titre,
      description: item.description ?? '',
      categorie: item.categorie,
      points: item.points,
    };
    this.lockBodyScroll();
  }

  viewNonFixed(item: ActionNonFixe): void {
    this.resetFormState();
    this.editingNonFixedId = item.id;
    this.formVisible = true;
    this.formKind = 'non-fixed';
    this.formMode = 'view';
    this.clearPhotoSelection();
    this.lockBodyScroll();

    this.admin.getActionNonFixe(item.id).subscribe({
      next: (detail) => {
        this.applyNonFixedDetail(detail);
        this.scheduleMapInit();
      },
      error: () => {
        this.message = 'Impossible de charger le détail de l’action.';
        this.closeForm();
      },
    });
  }

  editNonFixed(item: ActionNonFixe): void {
    this.resetFormState();
    this.editingNonFixedId = item.id;
    this.formVisible = true;
    this.formKind = 'non-fixed';
    this.formMode = 'edit';
    this.clearPhotoSelection();
    this.lockBodyScroll();

    this.admin.getActionNonFixe(item.id).subscribe({
      next: (detail) => {
        this.applyNonFixedDetail(detail);
        this.scheduleMapInit();
      },
      error: () => {
        this.message = 'Impossible de charger le détail de l’action.';
        this.closeForm();
      },
    });
  }

  switchToEdit(): void {
    if (this.formMode !== 'view') {
      return;
    }
    this.formMode = 'edit';
    if (this.formKind === 'non-fixed') {
      this.scheduleMapInit();
    }
  }

  formatTableDate(value?: string): string {
    if (!value) {
      return '—';
    }
    return formatNaiveDate(value);
  }

  formatUpdatedAt(value?: string): string {
    if (!value) {
      return '—';
    }
    return formatNaiveDate(value);
  }

  nonFixedStatusLabel(item: ActionNonFixe): string {
    switch (item.status) {
      case 'PUBLISHED':
        return 'Publiée';
      case 'DRAFT':
        return 'Brouillon';
      case 'CANCELLED':
        return 'Désactivée';
      case 'COMPLETED':
        return 'Terminée';
      default:
        return item.status ?? '—';
    }
  }

  nonFixedStatusClass(item: ActionNonFixe): string {
    switch (item.status) {
      case 'PUBLISHED':
        return 'status-pill--active';
      case 'DRAFT':
        return 'status-pill--draft';
      case 'CANCELLED':
        return 'status-pill--cancelled';
      case 'COMPLETED':
        return 'status-pill--completed';
      default:
        return 'status-pill--draft';
    }
  }

  canDeactivateFixed(item: ActionFixe): boolean {
    return !!item.active;
  }

  canActivateFixed(item: ActionFixe): boolean {
    return !item.active;
  }

  canDeactivateNonFixed(item: ActionNonFixe): boolean {
    return item.status !== 'CANCELLED' && item.status !== 'COMPLETED';
  }

  canActivateNonFixed(item: ActionNonFixe): boolean {
    return item.status === 'CANCELLED';
  }

  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  addProgramItem(): void {
    this.programItems.push('');
  }

  removeProgramItem(index: number): void {
    this.programItems.splice(index, 1);
  }

  addPracticalInfoItem(): void {
    this.practicalInfoItems.push('');
  }

  removePracticalInfoItem(index: number): void {
    this.practicalInfoItems.splice(index, 1);
  }

  rechercherAdresse(): void {
    const address = this.nonFixedForm.address?.trim();
    const city = this.nonFixedForm.city?.trim();

    if (!address || !city) {
      this.geocodeError = 'Veuillez remplir l’adresse et la ville';
      return;
    }

    this.isGeocoding = true;
    this.geocodeError = null;
    this.geocodeSuccess = false;

    const queries = [`${address}, ${city}, Maroc`, `${city}, Maroc`, `${address}, Maroc`];
    this.tryGeocodeWithQueries(queries, 0);
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
    if (this.isFormReadonly) {
      return;
    }
    if (this.formKind === 'non-fixed') {
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
        this.message = this.editingId != null ? 'Action fixe mise à jour.' : 'Action fixe créée.';
        this.closeForm();
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
    const description = this.nonFixedForm.description?.trim() ?? '';
    const address = this.nonFixedForm.address?.trim() ?? '';
    const city = this.nonFixedForm.city?.trim() ?? '';

    if (!titre || !categorie) {
      this.message = 'Titre et catégorie sont obligatoires.';
      return;
    }
    if (!description) {
      this.message = 'La description est obligatoire.';
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
    if (!this.hasValidDateRange()) {
      this.message = 'La date de fin doit être postérieure à la date de début.';
      return;
    }
    if (!address || !city) {
      this.message = 'L’adresse et la ville sont obligatoires.';
      return;
    }
    if (this.nonFixedForm.latitude == null || this.nonFixedForm.longitude == null) {
      this.message = 'Veuillez définir la position sur la carte.';
      return;
    }
    if ((this.nonFixedForm.placesTotal ?? 0) < 1) {
      this.message = 'Le nombre de places doit être au moins 1.';
      return;
    }
    if ((this.nonFixedForm.points ?? 0) < 1) {
      this.message = 'Les points doivent être au moins 1.';
      return;
    }

    this.nonFixedForm.associationId = this.selectedAssociationId;

    const body: ActionAssociationRequest = {
      titre,
      categorie,
      description,
      points: Number(this.nonFixedForm.points),
      associationId: Number(this.nonFixedForm.associationId),
      associationName: this.nonFixedForm.associationName?.trim() || undefined,
      address,
      city,
      lieu: city,
      latitude: Number(this.nonFixedForm.latitude),
      longitude: Number(this.nonFixedForm.longitude),
      placesTotal: Number(this.nonFixedForm.placesTotal),
      dateStart: datetimeLocalToApi(this.nonFixedForm.dateStart.trim()),
      dateEnd: datetimeLocalToApi(this.nonFixedForm.dateEnd.trim()),
      program: this.itemsToArray(this.programItems),
      practicalInfos: this.itemsToArray(this.practicalInfoItems),
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
          this.message = isEdit ? 'Action association mise à jour.' : 'Action association créée.';
          this.closeForm();
          this.reload();
        },
        error: (err) => {
          this.saving = false;
          this.message = this.readErrorMessage(err, 'Échec de l’enregistrement.');
        },
      });
  }

  deactivateFixed(item: ActionFixe): void {
    if (!this.canDeactivateFixed(item)) {
      return;
    }
    if (!confirm(`Désactiver « ${item.titre} » ?`)) {
      return;
    }
    this.admin.deactivateActionFixe(item.id).subscribe({
      next: () => {
        this.message = 'Action fixe désactivée.';
        this.reload();
      },
      error: () => {
        this.message = 'Échec de la désactivation.';
      },
    });
  }

  activateFixed(item: ActionFixe): void {
    if (!this.canActivateFixed(item)) {
      return;
    }
    if (!confirm(`Réactiver « ${item.titre} » ?`)) {
      return;
    }
    this.admin.activateActionFixe(item.id).subscribe({
      next: () => {
        this.message = 'Action fixe réactivée.';
        this.reload();
      },
      error: () => {
        this.message = 'Échec de la réactivation.';
      },
    });
  }

  deactivateNonFixed(item: ActionNonFixe): void {
    if (!this.canDeactivateNonFixed(item)) {
      return;
    }
    if (!confirm(`Désactiver « ${item.title} » ?`)) {
      return;
    }
    this.admin.deactivateActionNonFixe(item.id).subscribe({
      next: () => {
        this.message = 'Action association désactivée.';
        this.reload();
      },
      error: () => {
        this.message = 'Échec de la désactivation.';
      },
    });
  }

  activateNonFixed(item: ActionNonFixe): void {
    if (!this.canActivateNonFixed(item)) {
      return;
    }
    if (!confirm(`Réactiver « ${item.title} » ?`)) {
      return;
    }
    this.admin.activateActionNonFixe(item.id).subscribe({
      next: () => {
        this.message = 'Action association réactivée.';
        this.reload();
      },
      error: () => {
        this.message = 'Échec de la réactivation.';
      },
    });
  }

  statusLabel(item: ActionFixe): string {
    return item.active ? 'Active' : 'Désactivée';
  }

  statusClass(item: ActionFixe): string {
    return item.active ? 'status-pill--active' : 'status-pill--cancelled';
  }

  private applyNonFixedDetail(detail: ActionNonFixeDetail): void {
    this.nonFixedForm = {
      titre: detail.title ?? '',
      categorie: detail.categoryName ?? '',
      description: detail.description ?? '',
      points: detail.points ?? 10,
      associationId: detail.associationId ?? 0,
      associationName: detail.associationName ?? '',
      latitude: detail.latitude ?? (undefined as unknown as number),
      longitude: detail.longitude ?? (undefined as unknown as number),
      address: detail.address ?? '',
      city: detail.city ?? '',
      lieu: detail.city ?? '',
      placesTotal: detail.maxParticipants ?? 20,
      dateStart: this.toDatetimeLocal(detail.dateStart),
      dateEnd: this.toDatetimeLocal(detail.dateEnd),
    };
    this.programItems = detail.program?.length ? [...detail.program] : [];
    this.practicalInfoItems = detail.practicalInfos?.length ? [...detail.practicalInfos] : [];
    this.postalCode = '';
    this.selectedAssociationId = detail.associationId ?? null;
    this.existingPhotoUrl = detail.photoUrls?.[0] ?? null;
    this.geocodeSuccess = this.isLocationReady;
    this.scheduleMapInit();
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
      latitude: undefined as unknown as number,
      longitude: undefined as unknown as number,
      points: 10,
      placesTotal: 10,
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

  private itemsToArray(items: string[]): string[] | undefined {
    const lines = items.map((line) => line.trim()).filter(Boolean);
    return lines.length ? lines : undefined;
  }

  private hasValidDateRange(): boolean {
    const start = this.nonFixedForm.dateStart?.trim();
    const end = this.nonFixedForm.dateEnd?.trim();
    if (!start || !end) {
      return true;
    }
    return new Date(end).getTime() > new Date(start).getTime();
  }

  private scheduleMapInit(): void {
    if (this.mapInitScheduled) {
      return;
    }
    this.mapInitScheduled = true;
    setTimeout(() => {
      this.mapInitScheduled = false;
      if (this.formVisible && this.formKind === 'non-fixed') {
        this.initMap();
      }
    }, 320);
  }

  private initMap(): void {
    const container = document.getElementById('adminLocationMap');
    if (!container) {
      return;
    }

    this.destroyMap();

    const defaultLat = 33.5731;
    const defaultLng = -7.5898;
    const hasCoords = this.nonFixedForm.latitude != null && this.nonFixedForm.longitude != null;
    const lat = hasCoords ? Number(this.nonFixedForm.latitude) : defaultLat;
    const lng = hasCoords ? Number(this.nonFixedForm.longitude) : defaultLng;
    const zoom = hasCoords ? 15 : 6;

    this.map = L.map('adminLocationMap').setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    const iconDefault = L.icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    if (hasCoords) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
      this.marker.bindPopup('Position de l’action').openPopup();
    }

    if (!this.isFormReadonly) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        this.nonFixedForm.latitude = clickLat;
        this.nonFixedForm.longitude = clickLng;
        this.geocodeSuccess = true;
        this.geocodeError = null;

        if (this.marker) {
          this.map?.removeLayer(this.marker);
        }
        this.marker = L.marker([clickLat, clickLng]).addTo(this.map!);
        this.marker
          .bindPopup(
            `Position définie<br><small>Lat: ${clickLat.toFixed(6)}<br>Lng: ${clickLng.toFixed(6)}</small>`
          )
          .openPopup();
      });
    }

    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private destroyMap(): void {
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
    }
    this.marker = undefined;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  private tryGeocodeWithQueries(queries: string[], index: number): void {
    if (index >= queries.length) {
      this.isGeocoding = false;
      this.geocodeError =
        'Adresse non reconnue. Cliquez directement sur la carte pour placer le marqueur.';
      this.geocodeSuccess = false;
      return;
    }

    const query = queries[index];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ma`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          const goodMatch = data.find((result: { type?: string; addresstype?: string }) => {
            const type = result.type?.toLowerCase() || '';
            const addressType = result.addresstype?.toLowerCase() || '';
            return (
              !['country', 'state', 'region', 'province'].includes(type) &&
              !['country', 'state', 'region', 'province'].includes(addressType)
            );
          });

          if (goodMatch && this.map) {
            const lat = parseFloat(goodMatch.lat);
            const lng = parseFloat(goodMatch.lon);
            const displayName = goodMatch.display_name;

            this.map.setView([lat, lng], 13);
            if (this.marker) {
              this.map.removeLayer(this.marker);
            }
            this.marker = L.marker([lat, lng]).addTo(this.map);
            this.marker
              .bindPopup(`${displayName}<br><small>Ajustez en cliquant sur la carte</small>`)
              .openPopup();

            this.nonFixedForm.latitude = lat;
            this.nonFixedForm.longitude = lng;
            this.geocodeSuccess = true;
            this.geocodeError = null;
            this.isGeocoding = false;
          } else {
            setTimeout(() => this.tryGeocodeWithQueries(queries, index + 1), 500);
          }
        } else {
          setTimeout(() => this.tryGeocodeWithQueries(queries, index + 1), 500);
        }
      })
      .catch(() => {
        setTimeout(() => this.tryGeocodeWithQueries(queries, index + 1), 500);
      });
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
