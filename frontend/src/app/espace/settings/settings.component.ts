import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationPreferences } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { UiService } from '../../core/services/ui.user.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  readonly userId = 1;

  firstName = '';
  lastName = '';
  city = '';
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

  constructor(
    private readonly userService: UserService,
    private readonly uiSvc: UiService
  ) {}

  ngOnInit(): void {
    this.uiSvc.setPageHeader('Mon profil', 'PARAMÈTRES');

    this.userService.getProfile(this.userId).subscribe({
      next: (profile) => {
        this.firstName = profile.firstName;
        this.lastName = profile.lastName;
        this.city = profile.city || '';
        this.photo = profile.photo;
      },
      error: () => {
        this.firstName = '';
        this.lastName = '';
        this.city = '';
        this.photo = undefined;
      }
    });

    this.userService.getPreferences(this.userId).subscribe((prefs) => {
      this.prefs = prefs;
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerPhotoEdit() {
    this.isEditingPhoto = !this.isEditingPhoto;
  }

  saveProfile(): void {
    this.userService.updateProfile(this.userId, {
      firstName: this.firstName,
      lastName: this.lastName,
      city: this.city,
      photo: `assets/upload/user/profil/${this.userId}.png`
    } as any).subscribe(() => {
      this.message = 'Profil enregistré avec succès.';
      this.isEditingPhoto = false;
    });
  }

  savePreferences(): void {
    this.userService.updatePreferences(this.userId, this.prefs).subscribe(() => {
      this.message = 'Préférences enregistrées avec succès.';
    });
  }
}