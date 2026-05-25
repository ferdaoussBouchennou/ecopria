import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssociationService } from '../services/association.service';
import { 
  AssociationProfile, 
  UpdateAssociationProfileDTO,
  ProfileFormErrors 
} from '../models/association-profile.model';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent implements OnInit {
  profile: AssociationProfile | null = null;
  editedProfile: UpdateAssociationProfileDTO = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    description: '',
    logo: ''
  };

  // États
  loading = true;
  saving = false;
  editMode = false;
  error = '';
  successMessage = '';

  // Upload logo
  logoPreview: string | null = null;
  uploadingLogo = false;

  // Validation
  errors: ProfileFormErrors = {};

  // TODO: Récupérer depuis le service auth
  private readonly authId = 1;

  constructor(
    private associationService: AssociationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.associationService.getProfile(this.authId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.editedProfile = {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          description: profile.description,
          logo: profile.logo
        };
        this.logoPreview = profile.logo;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
        console.error(err);
      }
    });
  }

  toggleEditMode(): void {
    if (this.editMode) {
      // Annuler les modifications
      if (this.profile) {
        this.editedProfile = {
          name: this.profile.name,
          email: this.profile.email,
          phone: this.profile.phone,
          address: this.profile.address,
          city: this.profile.city,
          description: this.profile.description,
          logo: this.profile.logo
        };
        this.logoPreview = this.profile.logo;
      }
      this.errors = {};
      this.successMessage = '';
    }
    this.editMode = !this.editMode;
  }


  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Nom
    if (!this.editedProfile.name.trim()) {
      this.errors.name = 'Le nom est obligatoire';
      isValid = false;
    } else if (this.editedProfile.name.length < 3) {
      this.errors.name = 'Le nom doit contenir au moins 3 caractères';
      isValid = false;
    } else if (this.editedProfile.name.length > 100) {
      this.errors.name = 'Le nom ne peut pas dépasser 100 caractères';
      isValid = false;
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.editedProfile.email.trim()) {
      this.errors.email = 'L\'email est obligatoire';
      isValid = false;
    } else if (!emailRegex.test(this.editedProfile.email)) {
      this.errors.email = 'Email invalide';
      isValid = false;
    }

    // Téléphone
    const phoneRegex = /^0[1-9]\d{8}$/;
    if (this.editedProfile.phone && !phoneRegex.test(this.editedProfile.phone.replace(/\s/g, ''))) {
      this.errors.phone = 'Téléphone invalide (format: 0612345678)';
      isValid = false;
    }

    // Ville
    if (!this.editedProfile.city.trim()) {
      this.errors.city = 'La ville est obligatoire';
      isValid = false;
    }

    // Description
    if (this.editedProfile.description && this.editedProfile.description.length > 500) {
      this.errors.description = 'La description ne peut pas dépasser 500 caractères';
      isValid = false;
    }

    return isValid;
  }

  saveProfile(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    this.associationService.updateProfile(this.authId, this.editedProfile).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.editMode = false;
        this.saving = false;
        this.successMessage = 'Profil mis à jour avec succès';
        
        // Masquer le message après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors de la mise à jour du profil';
        this.saving = false;
        console.error(err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validation
    if (!file.type.startsWith('image/')) {
      this.errors.logo = 'Le fichier doit être une image';
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      this.errors.logo = 'L\'image ne doit pas dépasser 2 MB';
      return;
    }

    this.errors.logo = undefined;

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview = e.target?.result as string;
      this.editedProfile.logo = this.logoPreview;
    };
    reader.readAsDataURL(file);

    // TODO: Upload vers le serveur
    // this.uploadLogo(file);
  }

  removeLogo(): void {
    this.logoPreview = null;
    this.editedProfile.logo = '';
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('logo-input') as HTMLInputElement;
    fileInput?.click();
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getCharacterCount(text: string): string {
    return `${text.length} / 500`;
  }
}
