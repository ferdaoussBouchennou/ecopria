import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { NotificationPreferences, UpdateProfileRequest } from '../../../core/models/user.model';
import { resolveUploadUrl } from '../../../core/utils/upload-url.util';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { UiService } from '../../../core/services/ui.user.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './settings.component.html',
  styleUrl: '../styles/user-space.scss'
})
export class SettingsComponent implements OnInit {
  firstName = '';
  lastName = '';
  city = '';
  address = '';
  phone = '';
  email = '';
  photo?: string;
  isEditingPhoto = false;
  selectedFile: File | null = null;

  prefs: NotificationPreferences = {
    nearbyActions: true,
    reminders: true,
    catalogNews: false,
    newsletter: true
  };

  message = '';
  errorMessage = '';
  loading = true;
  saving = false;

  constructor(
    private readonly userService: UserService,
    private readonly profileSvc: UserProfileService,
    private readonly uiSvc: UiService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  private get userId(): number {
    return this.auth.requireUserId();
  }

  ngOnInit(): void {
    this.uiSvc.setPageHeader('Mon profil', 'PARAMÈTRES');

    let userId: number;
    try {
      userId = this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }

    this.userService.getProfile(userId).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.profileSvc.setProfile(profile);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger le profil.';
        this.loading = false;
      }
    });

    this.userService.getPreferences(userId).subscribe({
      next: (prefs) => {
        this.prefs = prefs;
      }
    });
  }

  photoUrl(): string | undefined {
    return resolveUploadUrl(this.photo);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Veuillez sélectionner une image.';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La photo ne peut pas dépasser 5 Mo.';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.photo = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    this.message = '';
    this.errorMessage = '';

    let userId: number;
    try {
      userId = this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }

    this.saving = true;

    const save$ = this.selectedFile
      ? this.userService.uploadPhoto(userId, this.selectedFile).pipe(
          switchMap((response) => {
            this.photo = resolveUploadUrl(response.photoUrl) ?? response.photoUrl;
            this.selectedFile = null;
            return this.userService.updateProfile(userId, this.buildProfilePayload());
          })
        )
      : this.userService.updateProfile(userId, this.buildProfilePayload());

    save$.subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.profileSvc.setProfile(profile);
        this.message = 'Profil enregistré avec succès.';
        this.isEditingPhoto = false;
        this.saving = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Impossible d’enregistrer le profil.';
        this.saving = false;
      }
    });
  }

  savePreferences(): void {
    let userId: number;
    try {
      userId = this.auth.requireUserId();
    } catch {
      void this.router.navigate(['/connexion']);
      return;
    }

    this.userService.updatePreferences(userId, this.prefs).subscribe({
      next: () => {
        this.message = 'Préférences enregistrées avec succès.';
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Impossible d’enregistrer les préférences.';
      }
    });
  }

  private buildProfilePayload(): UpdateProfileRequest {
    const payload: UpdateProfileRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || undefined,
      city: this.city.trim() || undefined,
      address: this.address.trim() || undefined,
    };

    if (this.photo && !this.photo.startsWith('data:')) {
      payload.photo = this.photo;
    }

    return payload;
  }

  private applyProfile(profile: {
    firstName: string;
    lastName: string;
    email: string;
    city?: string;
    address?: string;
    phone?: string;
    photo?: string;
  }): void {
    this.firstName = profile.firstName;
    this.lastName = profile.lastName;
    this.email = profile.email ?? '';
    this.city = profile.city ?? '';
    this.address = profile.address ?? '';
    this.phone = profile.phone ?? '';
    this.photo = resolveUploadUrl(profile.photo);
    this.selectedFile = null;
  }
}
