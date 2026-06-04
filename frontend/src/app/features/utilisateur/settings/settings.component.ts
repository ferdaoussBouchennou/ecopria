import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationPreferences } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { UiService } from '../../../core/services/ui.user.service';
import { AuthService } from '../../../core/services/auth.service';

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

  prefs: NotificationPreferences = {
    nearbyActions: true,
    reminders: true,
    catalogNews: false,
    newsletter: true
  };

  message = '';
  errorMessage = '';
  loading = true;

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.photo = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
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

    this.userService.updateProfile(userId, {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || undefined,
      city: this.city.trim() || undefined,
      address: this.address.trim() || undefined,
      photo: this.photo
    }).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.profileSvc.setProfile(profile);
        this.message = 'Profil enregistré avec succès.';
        this.isEditingPhoto = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Impossible d’enregistrer le profil.';
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
    this.photo = profile.photo;
  }
}
