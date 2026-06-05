import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService } from '../../../core/services/admin.service';
import {
  AccountValidationItem,
  AdminUser,
  UtilisateurAssociationProfile,
  UtilisateurCitizenProfile,
  UtilisateurPartnerProfile,
} from '../../../core/models/admin.model';

type AccountTab = 'associations' | 'partenaires' | 'participants';
type SectionFilter = 'all' | 'pending' | 'active' | 'inactive';

interface SectionState {
  filter: SectionFilter;
  page: number;
  search: string;
}

interface DetailField {
  label: string;
  value: string;
}

type DetailKind = 'association' | 'partenaire' | 'participant';

@Component({
  selector: 'app-admin-comptes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-comptes.component.html',
  styleUrl: './admin-comptes.component.scss',
})
export class AdminComptesComponent implements OnInit, OnDestroy {
  readonly pageSize = 8;

  loading = true;
  actionLoading = false;
  detailLoading = false;
  error = '';
  actionMessage = '';
  rejectReason = '';
  deactivateReason = '';

  activeTab: AccountTab = 'associations';

  allOrgItems: AccountValidationItem[] = [];
  allParticipants: AdminUser[] = [];

  associationsState: SectionState = this.emptySectionState();
  partenairesState: SectionState = this.emptySectionState();
  participantsState: SectionState = this.emptySectionState();

  selectedItem: AccountValidationItem | null = null;
  selectedParticipant: AdminUser | null = null;
  detailVisible = false;
  detailKind: DetailKind | null = null;
  detailFields: DetailField[] = [];
  detailProfileError = '';
  showDeactivateForm = false;

  documentLoading = false;
  documentError = '';
  documentPreviewUrl: string | null = null;
  documentSafeUrl: SafeResourceUrl | null = null;
  documentMimeType = '';
  documentIsPdf = false;
  documentIsImage = false;

  constructor(
    private admin: AdminService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.clearDocumentPreview();
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.actionLoading) {
      return;
    }
    if (this.detailVisible) {
      this.closeDetail();
    }
  }

  switchTab(tab: AccountTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.closeDetail();
  }

  get currentState(): SectionState {
    return this.getSectionState(this.activeTab);
  }

  get associations(): AccountValidationItem[] {
    return this.filterOrgItems('ASSOCIATION', this.associationsState);
  }

  get partenaires(): AccountValidationItem[] {
    return this.filterOrgItems('PARTNER', this.partenairesState);
  }

  get participants(): AdminUser[] {
    return this.filterParticipants(this.participantsState);
  }

  currentOrgItems(): AccountValidationItem[] {
    return this.activeTab === 'associations' ? this.associations : this.partenaires;
  }

  paginatedOrgItems(): AccountValidationItem[] {
    const state = this.currentState;
    return this.paginate(this.currentOrgItems(), state.page);
  }

  paginatedParticipants(): AdminUser[] {
    return this.paginate(this.participants, this.participantsState.page);
  }

  totalPagesOrg(): number {
    return Math.max(1, Math.ceil(this.currentOrgItems().length / this.pageSize));
  }

  totalPagesParticipants(): number {
    return Math.max(1, Math.ceil(this.participants.length / this.pageSize));
  }

  paginationLabel(count: number, page: number): string {
    if (count === 0) {
      return 'Aucun résultat';
    }
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(page * this.pageSize, count);
    return `${start}–${end} sur ${count}`;
  }

  setSectionFilter(filter: SectionFilter): void {
    const state = this.currentState;
    if (state.filter === filter) {
      return;
    }
    state.filter = filter;
    state.page = 1;
  }

  onSectionSearch(): void {
    this.currentState.page = 1;
  }

  changePage(page: number): void {
    const state = this.currentState;
    const total = this.activeTab === 'participants' ? this.totalPagesParticipants() : this.totalPagesOrg();
    if (page >= 1 && page <= total) {
      state.page = page;
    }
  }

  countOrg(tab: 'associations' | 'partenaires', filter: SectionFilter): number {
    const role = tab === 'associations' ? 'ASSOCIATION' : 'PARTNER';
    const state = { ...(tab === 'associations' ? this.associationsState : this.partenairesState), filter, page: 1 };
    return this.filterOrgItems(role, state).length;
  }

  countParticipants(filter: SectionFilter): number {
    const state = { ...this.participantsState, filter, page: 1 };
    return this.filterParticipants(state).length;
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.actionMessage = '';

    forkJoin({
      orgs: this.admin.getAccountValidations('all'),
      users: this.admin.getUsers({ role: 'USER' }),
    }).subscribe({
      next: ({ orgs, users }) => {
        this.allOrgItems = (orgs.items ?? []).map((item) => ({
          ...item,
          role: item.role === 'PARTNER' ? 'PARTNER' : 'ASSOCIATION',
        }));
        this.allParticipants = users ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les comptes.';
      },
    });
  }

  viewItem(item: AccountValidationItem, mode: 'view' | 'reject' | 'deactivate' = 'view'): void {
    this.selectedItem = item;
    this.selectedParticipant = null;
    this.detailKind = item.role === 'ASSOCIATION' ? 'association' : 'partenaire';
    this.rejectReason = '';
    this.deactivateReason = '';
    this.showDeactivateForm = mode === 'deactivate';
    this.detailProfileError = '';
    this.detailFields = [];
    this.clearDocumentPreview();
    this.detailVisible = true;
    this.loadOrgProfile(item);
    if (this.hasDocument(item)) {
      this.loadDocumentPreview(item.userId);
    }
    document.body.style.overflow = 'hidden';
  }

  viewParticipant(user: AdminUser, openDeactivate = false): void {
    this.selectedParticipant = user;
    this.selectedItem = null;
    this.detailKind = 'participant';
    this.deactivateReason = '';
    this.showDeactivateForm = openDeactivate;
    this.clearDocumentPreview();
    this.detailProfileError = '';
    this.detailFields = [];
    this.detailVisible = true;
    this.loadParticipantProfile(user);
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.detailVisible = false;
    this.selectedItem = null;
    this.selectedParticipant = null;
    this.detailKind = null;
    this.detailFields = [];
    this.rejectReason = '';
    this.deactivateReason = '';
    this.showDeactivateForm = false;
    this.detailProfileError = '';
    this.clearDocumentPreview();
    document.body.style.overflow = '';
  }

  approveItem(item: AccountValidationItem): void {
    this.selectedItem = item;
    this.approveSelected();
  }

  isPending(item: AccountValidationItem | null): boolean {
    return item?.status === 'En attente';
  }

  orgDisplayStatus(item: AccountValidationItem): string {
    if (item.status === 'Validé' && item.isActive === false) {
      return 'Désactivé';
    }
    return item.status;
  }

  canDeactivateOrg(item: AccountValidationItem): boolean {
    return item.status === 'Validé' && item.isActive !== false;
  }

  canActivateOrg(item: AccountValidationItem): boolean {
    return item.status === 'Validé' && item.isActive === false;
  }

  canDeactivateParticipant(user: AdminUser): boolean {
    return !!user.isVerified && !!user.isActive;
  }

  canActivateParticipant(user: AdminUser): boolean {
    return !!user.isVerified && user.isActive === false;
  }

  approveSelected(): void {
    if (!this.selectedItem || !this.isPending(this.selectedItem)) {
      return;
    }
    this.actionLoading = true;
    const call =
      this.selectedItem.role === 'ASSOCIATION'
        ? this.admin.approveAssociation(this.selectedItem.userId)
        : this.admin.approvePartenaire(this.selectedItem.userId);

    call.subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte validé.';
        this.closeDetail();
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec de la validation.';
      },
    });
  }

  hasDocument(item: AccountValidationItem | null): boolean {
    return !!item?.hasStoredDocument || !!item?.documentPath;
  }

  openDocumentInNewTab(): void {
    if (!this.documentPreviewUrl) {
      return;
    }
    window.open(this.documentPreviewUrl, '_blank', 'noopener');
  }

  private loadDocumentPreview(userId: number): void {
    if (this.documentPreviewUrl) {
      URL.revokeObjectURL(this.documentPreviewUrl);
      this.documentPreviewUrl = null;
    }
    this.documentLoading = true;
    this.documentError = '';
    this.documentMimeType = '';
    this.documentIsPdf = false;
    this.documentIsImage = false;

    this.admin.getAccountVerificationDocument(userId).subscribe({
      next: (blob) => {
        this.documentLoading = false;
        const mime = blob.type || 'application/octet-stream';
        this.documentMimeType = mime;
        this.documentIsImage = mime.startsWith('image/');
        this.documentIsPdf = mime === 'application/pdf' || mime.includes('pdf');
        this.documentPreviewUrl = URL.createObjectURL(blob);
        this.documentSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.documentPreviewUrl);
      },
      error: () => {
        this.documentLoading = false;
        this.documentError = 'Impossible de charger le document de vérification.';
      },
    });
  }

  private clearDocumentPreview(): void {
    if (this.documentPreviewUrl) {
      URL.revokeObjectURL(this.documentPreviewUrl);
    }
    this.documentPreviewUrl = null;
    this.documentSafeUrl = null;
    this.documentMimeType = '';
    this.documentIsPdf = false;
    this.documentIsImage = false;
    this.documentError = '';
    this.documentLoading = false;
  }

  rejectSelected(): void {
    if (!this.selectedItem || !this.isPending(this.selectedItem)) {
      return;
    }
    const reason = this.rejectReason.trim();
    if (!reason) {
      this.actionMessage = 'Indiquez un motif de refus.';
      return;
    }
    this.actionLoading = true;
    const call =
      this.selectedItem.role === 'ASSOCIATION'
        ? this.admin.rejectAssociation(this.selectedItem.userId, reason)
        : this.admin.rejectPartenaire(this.selectedItem.userId, reason);

    call.subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Demande refusée (le compte reste connectable).';
        this.closeDetail();
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec du refus.';
      },
    });
  }

  deactivateOrg(item: AccountValidationItem): void {
    const reason = this.deactivateReason.trim();
    if (!reason) {
      this.actionMessage = 'Indiquez un motif de désactivation.';
      return;
    }
    this.actionLoading = true;
    const call =
      item.role === 'ASSOCIATION'
        ? this.admin.deactivateAssociation(item.userId, reason)
        : this.admin.deactivatePartenaire(item.userId, reason);

    call.subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte désactivé.';
        this.closeDetail();
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec de la désactivation.';
      },
    });
  }

  activateOrg(item: AccountValidationItem): void {
    if (!confirm(`Réactiver le compte « ${item.name} » ?`)) {
      return;
    }
    this.actionLoading = true;
    this.admin.reactivateUser(item.userId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte réactivé.';
        this.closeDetail();
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec de la réactivation.';
      },
    });
  }

  deactivateParticipant(user: AdminUser): void {
    const reason = this.deactivateReason.trim();
    if (!reason) {
      this.actionMessage = 'Indiquez un motif de désactivation.';
      return;
    }
    this.actionLoading = true;
    this.admin.banUser(user.userId, reason).subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte désactivé.';
        this.closeDetail();
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec de la désactivation.';
      },
    });
  }

  activateParticipant(user: AdminUser): void {
    if (!confirm(`Réactiver le compte « ${user.email} » ?`)) {
      return;
    }
    this.actionLoading = true;
    this.admin.reactivateUser(user.userId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionMessage = 'Compte réactivé.';
        this.closeDetail();
        this.reload();
      },
      error: () => {
        this.actionLoading = false;
        this.actionMessage = 'Échec de la réactivation.';
      },
    });
  }

  orgStatusClass(item: AccountValidationItem): string {
    const label = this.orgDisplayStatus(item);
    switch (label) {
      case 'Validé':
        return 'status-pill--ok';
      case 'Rejeté':
        return 'status-pill--warn';
      case 'Désactivé':
        return 'status-pill--inactive';
      default:
        return 'status-pill--pending';
    }
  }

  participantStatusLabel(user: AdminUser): string {
    if (!user.isVerified) {
      return 'En attente e-mail';
    }
    if (!user.isActive) {
      return 'Désactivé';
    }
    return 'Actif';
  }

  participantStatusClass(user: AdminUser): string {
    if (!user.isVerified) {
      return 'status-pill--pending';
    }
    if (!user.isActive) {
      return 'status-pill--inactive';
    }
    return 'status-pill--ok';
  }

  displayName(user: AdminUser): string {
    return user.displayName?.trim() || user.email;
  }

  formatDate(value?: string): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  detailTitle(): string {
    if (this.detailKind === 'participant' && this.selectedParticipant) {
      return this.displayName(this.selectedParticipant);
    }
    if (this.selectedItem) {
      return this.selectedItem.name;
    }
    return 'Détail du compte';
  }

  private loadOrgProfile(item: AccountValidationItem): void {
    this.detailLoading = true;
    const profile$ =
      item.role === 'ASSOCIATION'
        ? this.admin.getUtilisateurAssociationProfile(item.userId)
        : this.admin.getUtilisateurPartnerProfile(item.userId);

    profile$
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: (profile) => {
          this.detailLoading = false;
          if (!profile) {
            this.detailProfileError =
              'Profil non trouvé dans service-utilisateur (8082). Le compte auth existe peut-être sans profil encore.';
          }
          this.detailFields = this.buildOrgDetailFields(item, profile);
        },
        error: () => {
          this.detailLoading = false;
          this.detailProfileError = 'Impossible de charger le profil utilisateur.';
          this.detailFields = this.buildOrgDetailFields(item, null);
        },
      });
  }

  private loadParticipantProfile(user: AdminUser): void {
    this.detailLoading = true;
    this.admin
      .getUtilisateurCitizenProfile(user.userId)
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: (profile) => {
          this.detailLoading = false;
          if (!profile) {
            this.detailProfileError = 'Profil citoyen non trouvé dans service-utilisateur.';
          }
          this.detailFields = this.buildParticipantDetailFields(user, profile);
        },
        error: () => {
          this.detailLoading = false;
          this.detailProfileError = 'Impossible de charger le profil citoyen.';
          this.detailFields = this.buildParticipantDetailFields(user, null);
        },
      });
  }

  private buildOrgDetailFields(
    item: AccountValidationItem,
    profile: UtilisateurAssociationProfile | UtilisateurPartnerProfile | null
  ): DetailField[] {
    const fields: DetailField[] = [
      { label: 'Rôle', value: item.role === 'ASSOCIATION' ? 'Association' : 'Partenaire' },
      { label: 'E-mail', value: profile?.email || item.email || '—' },
      { label: 'Nom', value: profile?.name || item.name || '—' },
      { label: 'Statut validation', value: this.orgDisplayStatus(item) },
      { label: 'Compte actif', value: item.isActive === false ? 'Non' : 'Oui' },
      { label: 'Inscription', value: this.formatDateTime(item.createdAt) },
    ];

    if (profile) {
      fields.push(
        { label: 'Téléphone', value: profile.phone || '—' },
        { label: 'Ville', value: profile.city || '—' },
        { label: 'Adresse', value: profile.address || '—' },
        { label: 'Description', value: profile.description || '—' }
      );
      if ('category' in profile && profile.category) {
        fields.push({ label: 'Catégorie', value: profile.category });
      }
      if (profile.logo) {
        fields.push({ label: 'Logo', value: profile.logo });
      }
      if (profile.createdAt) {
        fields.push({ label: 'Profil créé le', value: this.formatDateTime(profile.createdAt) });
      }
    }

    if (item.rejectionReason) {
      fields.push({ label: 'Motif de refus', value: item.rejectionReason });
    }

    return fields;
  }

  private buildParticipantDetailFields(
    user: AdminUser,
    profile: UtilisateurCitizenProfile | null
  ): DetailField[] {
    const fields: DetailField[] = [
      { label: 'Rôle', value: 'Citoyen' },
      { label: 'E-mail', value: profile?.email || user.email },
      {
        label: 'Nom complet',
        value:
          profile?.firstName || profile?.lastName
            ? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
            : user.displayName?.trim() || '—',
      },
      { label: 'Statut', value: this.participantStatusLabel(user) },
      { label: 'E-mail vérifié', value: user.isVerified ? 'Oui' : 'Non' },
      { label: 'Compte actif', value: user.isActive ? 'Oui' : 'Non' },
      { label: 'Inscription', value: this.formatDateTime(user.createdAt) },
    ];

    if (profile) {
      fields.push(
        { label: 'Téléphone', value: profile.phone || '—' },
        { label: 'Ville', value: profile.city || '—' },
        { label: 'Adresse', value: profile.address || '—' },
        { label: 'Points totaux', value: profile.totalPoints != null ? String(profile.totalPoints) : '—' },
        { label: 'Score confiance', value: profile.trustScore != null ? String(profile.trustScore) : '—' },
        { label: 'Niveau', value: profile.level != null ? String(profile.level) : '—' }
      );
      if (profile.photo) {
        fields.push({ label: 'Photo', value: profile.photo });
      }
      if (profile.createdAt) {
        fields.push({ label: 'Profil créé le', value: this.formatDateTime(profile.createdAt) });
      }
    }

    return fields;
  }

  private filterOrgItems(role: 'ASSOCIATION' | 'PARTNER', state: SectionState): AccountValidationItem[] {
    let list = this.allOrgItems.filter((item) => item.role === role);

    switch (state.filter) {
      case 'pending':
        list = list.filter((item) => item.status === 'En attente');
        break;
      case 'active':
        list = list.filter((item) => item.status === 'Validé' && item.isActive !== false);
        break;
      case 'inactive':
        list = list.filter(
          (item) => item.status === 'Rejeté' || (item.status === 'Validé' && item.isActive === false)
        );
        break;
      default:
        break;
    }

    const q = state.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          (item.rejectionReason ?? '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }

  private filterParticipants(state: SectionState): AdminUser[] {
    let list = [...this.allParticipants];

    switch (state.filter) {
      case 'pending':
        list = list.filter((user) => !user.isVerified);
        break;
      case 'active':
        list = list.filter((user) => user.isVerified && user.isActive);
        break;
      case 'inactive':
        list = list.filter((user) => user.isActive === false);
        break;
      default:
        break;
    }

    const q = state.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (user) =>
          user.email.toLowerCase().includes(q) ||
          this.displayName(user).toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private getSectionState(tab: AccountTab): SectionState {
    switch (tab) {
      case 'associations':
        return this.associationsState;
      case 'partenaires':
        return this.partenairesState;
      default:
        return this.participantsState;
    }
  }

  private emptySectionState(): SectionState {
    return { filter: 'all', page: 1, search: '' };
  }
}
