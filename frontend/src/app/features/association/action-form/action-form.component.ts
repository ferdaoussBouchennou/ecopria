import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssociationService, CreateActionDTO } from '../services/association.service';
import { AssociationUiService } from '../services/association-ui.service';
import { ActionService } from '../../action/services/action.service';
import { ActionDetail } from '../../action/models/action.model';
import { Observable } from 'rxjs';
import * as L from 'leaflet';
import {
  datetimeLocalToApi,
  nowDatetimeLocalInput,
  toDatetimeLocalInput,
} from '../../../core/utils/datetime-local.util';

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-action-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './action-form.component.html',
  styleUrls: ['./action-form.component.css']
})
export class ActionFormComponent implements OnInit, AfterViewInit {
  actionForm!: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  actionId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  isGeocoding = false;
  geocodeError: string | null = null;
  geocodeSuccess = false;
  uploadedPhoto: { file: File, preview: string, name: string } | null = null;
  uploadError: string | null = null;

  // Stepper
  currentStep = 1;
  totalSteps = 6;

  minDateTime: string = '';

  private map?: L.Map;
  private marker?: L.Marker;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private associationService: AssociationService,
    private actionService: ActionService,
    private ui: AssociationUiService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.minDateTime = nowDatetimeLocalInput();

    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.actionId = Number(id);
      this.loadAction(this.actionId);
    }
  }

  ngAfterViewInit(): void {
    // Map will be initialized when user reaches step 2
    // No automatic initialization needed here
  }

  rechercherAdresse(): void {
    const address = this.actionForm.get('address')?.value;
    const city = this.actionForm.get('city')?.value;

    if (!address || !city) {
      this.geocodeError = 'Veuillez remplir l\'adresse et la ville';
      return;
    }

    this.isGeocoding = true;
    this.geocodeError = null;
    this.geocodeSuccess = false;

    // Try multiple search strategies
    const queries = [
      `${address}, ${city}, Maroc`,
      `${city}, Maroc`,
      `${address}, Maroc`
    ];

    this.tryGeocodeWithQueries(queries, 0);
  }

  private tryGeocodeWithQueries(queries: string[], index: number): void {
    if (index >= queries.length) {
      this.isGeocoding = false;
      this.geocodeError = '❌ Adresse non reconnue. Veuillez cliquer directement sur la carte pour placer le marqueur à l\'endroit exact.';
      this.geocodeSuccess = false;
      return;
    }

    const query = queries[index];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ma`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          // Check if we have a good match (not just country or region level)
          const goodMatch = data.find((result: any) => {
            const type = result.type?.toLowerCase() || '';
            const addressType = result.addresstype?.toLowerCase() || '';

            // Accept specific locations, reject vague ones
            return !['country', 'state', 'region', 'province'].includes(type) &&
              !['country', 'state', 'region', 'province'].includes(addressType);
          });

          if (goodMatch) {
            const lat = parseFloat(goodMatch.lat);
            const lng = parseFloat(goodMatch.lon);
            const displayName = goodMatch.display_name;

            // Update map view
            if (this.map) {
              this.map.setView([lat, lng], 13);

              // Remove old marker
              if (this.marker) {
                this.map.removeLayer(this.marker);
              }

              // Add new marker
              this.marker = L.marker([lat, lng]).addTo(this.map);
              this.marker.bindPopup(` ${displayName}<br><small><strong> Vérifiez et ajustez en cliquant sur la carte</strong></small>`).openPopup();

              // Update form
              this.actionForm.patchValue({
                latitude: lat,
                longitude: lng
              }, { emitEvent: false });

              this.geocodeSuccess = true;
              this.geocodeError = null;
              this.isGeocoding = false;
            }
          } else {
            // No good match, try next query
            setTimeout(() => {
              this.tryGeocodeWithQueries(queries, index + 1);
            }, 500);
          }
        } else {
          // Try next query
          setTimeout(() => {
            this.tryGeocodeWithQueries(queries, index + 1);
          }, 500);
        }
      })
      .catch(error => {
        console.error('Erreur de géocodage:', error);
        // Try next query
        setTimeout(() => {
          this.tryGeocodeWithQueries(queries, index + 1);
        }, 500);
      });
  }

  initForm(): void {
    this.actionForm = this.fb.group({
      titre: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      categoryId: ['', Validators.required], // Changed from null to empty string
      dateStart: ['', Validators.required],
      dateEnd: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: [''],
      latitude: [null],
      longitude: [null],
      maxParticipants: [10, [Validators.required, Validators.min(1)]],
      points: [10, [Validators.required, Validators.min(1)]],
      program: this.fb.array([]),
      practicalInfos: this.fb.array([]),
      statut: ['DRAFT']
    });
  }

  get programArray(): FormArray {
    return this.actionForm.get('program') as FormArray;
  }

  get practicalInfosArray(): FormArray {
    return this.actionForm.get('practicalInfos') as FormArray;
  }

  get isLocationReady(): boolean {
    return !!(this.actionForm.get('latitude')?.value && this.actionForm.get('longitude')?.value);
  }

  get estimatedImpactPoints(): number {
    const maxParticipants = Number(this.actionForm.get('maxParticipants')?.value || 0);
    const points = Number(this.actionForm.get('points')?.value || 0);
    return maxParticipants * points;
  }

  get actionDurationLabel(): string {
    const start = this.actionForm.get('dateStart')?.value;
    const end = this.actionForm.get('dateEnd')?.value;

    if (!start || !end) {
      return 'À définir';
    }

    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    if (durationMs <= 0) {
      return 'Dates invalides';
    }

    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.round((durationMs % 3600000) / 60000);

    if (hours === 0) {
      return `${minutes} min`;
    }
    if (minutes === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${minutes} min`;
  }

  get currentCategoryName(): string {
    return this.getCategoryName(this.actionForm.get('categoryId')?.value);
  }

  addProgramItem(): void {
    this.programArray.push(this.fb.control(''));
  }

  removeProgramItem(index: number): void {
    this.programArray.removeAt(index);
  }

  addPracticalInfo(): void {
    this.practicalInfosArray.push(this.fb.control(''));
  }

  removePracticalInfo(index: number): void {
    this.practicalInfosArray.removeAt(index);
  }

  loadCategories(): void {
    this.actionService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
        this.error = 'Erreur lors du chargement des catégories';
      }
    });
  }

  loadAction(id: number): void {
    this.loading = true;

    // Load categories first, then load the action
    this.actionService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;

        // Now load the action
        this.actionService.getActionById(id).subscribe({
          next: (action: ActionDetail) => {
            this.populateForm(action);
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur chargement action:', err);
            this.error = "Cette action n'existe pas ou vous n'y avez pas accès.";
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
        this.error = 'Erreur lors du chargement des catégories';
        this.loading = false;
      }
    });
  }

  populateForm(action: ActionDetail): void {
    // Convertir les dates au format datetime-local
    const dateStart = toDatetimeLocalInput(action.dateStart);
    const dateEnd = toDatetimeLocalInput(action.dateEnd);

    this.actionForm.patchValue({
      titre: action.title,
      description: action.description,
      categoryId: null, // Will need to be set manually or fetched from category name
      dateStart: dateStart,
      dateEnd: dateEnd,
      address: action.address,
      city: action.city,
      postalCode: '', // Not available in ActionDetail
      latitude: action.latitude,
      longitude: action.longitude,
      maxParticipants: action.maxParticipants,
      points: action.points,
      statut: action.status
    });

    // Charger le programme
    if (action.program && action.program.length > 0) {
      action.program.forEach(item => {
        this.programArray.push(this.fb.control(item));
      });
    }

    // Charger les infos pratiques
    if (action.practicalInfos && action.practicalInfos.length > 0) {
      action.practicalInfos.forEach(info => {
        this.practicalInfosArray.push(this.fb.control(info));
      });
    }

    // Find and set the categoryId from the category name
    const category = this.categories.find(c => c.name === action.categoryName);
    if (category) {
      this.actionForm.patchValue({ categoryId: category.id });
    }
  }

  onSubmit(publier: boolean = false): void {
    if (this.actionForm.invalid) {
      this.markFormGroupTouched(this.actionForm);

      // Debug: Log all invalid fields
      console.log('=== FORMULAIRE INVALIDE ===');
      Object.keys(this.actionForm.controls).forEach(key => {
        const control = this.actionForm.get(key);
        if (control && control.invalid) {
          console.log(`Champ invalide: ${key}`, control.errors);
        }
      });

      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (!this.hasValidDateRange()) {
      this.error = 'La date de fin doit être postérieure à la date de début';
      return;
    }

    this.submitting = true;
    this.error = null;

    const formValue = this.actionForm.value;

    // Filtrer les éléments vides des tableaux
    const program = formValue.program.filter((item: string) => item.trim() !== '');
    const practicalInfos = formValue.practicalInfos.filter((info: string) => info.trim() !== '');

    // Validation: latitude et longitude sont obligatoires
    if (!formValue.latitude || !formValue.longitude) {
      this.error = 'Veuillez définir la position sur la carte';
      this.submitting = false;
      return;
    }

    const actionData: CreateActionDTO = {
      title: formValue.titre,
      description: formValue.description,
      categoryId: Number(formValue.categoryId),
      dateStart: datetimeLocalToApi(formValue.dateStart),
      dateEnd: datetimeLocalToApi(formValue.dateEnd),
      address: formValue.address,
      city: formValue.city,
      latitude: formValue.latitude,  // Now required
      longitude: formValue.longitude,  // Now required
      maxParticipants: formValue.maxParticipants,
      points: formValue.points,
      program: program.length > 0 ? program : undefined,
      practicalInfos: practicalInfos.length > 0 ? practicalInfos : undefined
    };

    if (this.isEditMode && this.actionId) {
      this.associationService.modifierAction(this.actionId, actionData).subscribe({
        next: (action) => {
          // Si on veut publier, appeler l'endpoint publier
          if (publier && action.status !== 'PUBLISHED') {
            this.associationService.publierAction(action.id).subscribe({
              next: () => {
                this.handlePhotoUploadAndRedirect(action.id, true);
              },
              error: (err) => {
                console.error('Erreur publication:', err);
                this.error = 'Action modifiée mais erreur lors de la publication';
                this.submitting = false;
              }
            });
          } else {
            this.handlePhotoUploadAndRedirect(action.id, publier);
          }
        },
        error: (err) => {
          console.error('Erreur modification:', err);
          const msg = err?.error?.message || err?.error || err?.message;
          this.error = typeof msg === 'string' && msg.length > 0
            ? msg
            : 'Erreur lors de la modification de l\'action';
          this.submitting = false;
        }
      });
    } else {
      this.associationService.creerAction(actionData).subscribe({
        next: (action) => {
          // Si on veut publier, appeler l'endpoint publier
          if (publier) {
            this.associationService.publierAction(action.id).subscribe({
              next: () => {
                this.handlePhotoUploadAndRedirect(action.id, true);
              },
              error: (err) => {
                console.error('Erreur publication:', err);
                this.error = 'Action créée mais erreur lors de la publication';
                this.submitting = false;
              }
            });
          } else {
            this.handlePhotoUploadAndRedirect(action.id, false);
          }
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.error = 'Erreur lors de la création de l\'action';
          this.submitting = false;
        }
      });
    }
  }

  private handlePhotoUploadAndRedirect(actionId: number, wasPublished: boolean): void {
    if (this.uploadedPhoto) {
      this.uploadPhoto(actionId).subscribe({
        next: () => {
          const message = wasPublished ?
            (this.isEditMode ? 'Action publiée avec succès !' : 'Action créée et publiée !') :
            (this.isEditMode ? 'Action modifiée avec succès !' : 'Action enregistrée en brouillon !');
          this.ui.toast(message, 'success');
          this.router.navigate(['/association/mes-actions']);
        },
        error: (err) => {
          console.error('Erreur upload photo:', err);
          const message = this.isEditMode ?
            'Action modifiée mais erreur lors de l\'upload de la photo' :
            'Action créée mais erreur lors de l\'upload de la photo';
          this.ui.toast(message, 'error');
          this.router.navigate(['/association/mes-actions']);
        }
      });
    } else {
      const message = wasPublished ?
        (this.isEditMode ? 'Action publiée avec succès !' : 'Action créée et publiée !') :
        (this.isEditMode ? 'Action modifiée avec succès !' : 'Action enregistrée en brouillon !');
      this.ui.toast(message, 'success');
      this.router.navigate(['/association/mes-actions']);
    }
  }

  private uploadPhoto(actionId: number): Observable<any> {
    if (!this.uploadedPhoto) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    const formData = new FormData();
    formData.append('photo', this.uploadedPhoto.file);

    return this.associationService.uploadActionPhoto(actionId, formData);
  }

  getCategoryName(categoryId: any): string {
    if (!categoryId) return 'Non spécifiée';
    const category = this.categories.find(c => c.id === Number(categoryId));
    return category ? category.name : 'Non spécifiée';
  }

  enregistrerBrouillon(): void {
    this.onSubmit(false);
  }

  publier(): void {
    this.ui.confirm({
      title: 'Publier l\'action',
      message: 'Elle sera visible par tous les utilisateurs.',
      confirmLabel: 'Publier'
    }).subscribe((ok) => {
      if (ok) this.onSubmit(true);
    });
  }

  annuler(): void {
    this.ui.confirm({
      title: 'Abandonner les modifications',
      message: 'Les modifications non enregistrées seront perdues.',
      confirmLabel: 'Quitter',
      danger: true
    }).subscribe((ok) => {
      if (ok) this.router.navigate(['/association/mes-actions']);
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.actionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.actionForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        if (fieldName === 'address' || fieldName === 'city') return 'Ce lieu est obligatoire';
        if (fieldName === 'categoryId') return 'Veuillez sélectionner une catégorie';
        if (fieldName === 'dateStart' || fieldName === 'dateEnd') return 'La date et l\'heure sont requises';
        return 'Ce champ est obligatoire';
      }
      if (field.errors['maxlength']) {
        return `La longueur maximale est de ${field.errors['maxlength'].requiredLength} caractères`;
      }
      if (field.errors['min']) {
        if (fieldName === 'dateStart' || fieldName === 'dateEnd') {
          return 'La date et l\'heure ne peuvent pas être dans le passé';
        }
        return `La valeur minimale autorisée est ${field.errors['min'].min}`;
      }
    }
    return 'Valeur invalide';
  }

  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    Object.keys(this.actionForm.controls).forEach(key => {
      const control = this.actionForm.get(key);
      if (control && control.invalid) {
        invalidFields.push(key);
      }
    });
    return invalidFields;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'titre': 'Titre de l\'action',
      'description': 'Description',
      'categoryId': 'Catégorie',
      'dateStart': 'Date et heure de début',
      'dateEnd': 'Date et heure de fin',
      'address': 'Adresse',
      'city': 'Ville',
      'postalCode': 'Code postal',
      'latitude': 'Latitude',
      'longitude': 'Longitude',
      'maxParticipants': 'Nombre maximum de participants',
      'points': 'Points attribués'
    };
    return labels[fieldName] || fieldName;
  }

  initMap(): void {
    // Default center (France - centre approximatif)
    const defaultLat = 46.603354;
    const defaultLng = 1.888334;
    const defaultZoom = 6; // Zoom sur la France

    // Get existing coordinates if any
    const lat = this.actionForm.get('latitude')?.value || defaultLat;
    const lng = this.actionForm.get('longitude')?.value || defaultLng;
    const zoom = (lat !== defaultLat && lng !== defaultLng) ? 15 : defaultZoom;

    // Initialize map
    this.map = L.map('locationMap').setView([lat, lng], zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Configure default icon
    const iconDefault = L.icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Add existing marker if coordinates exist
    if (lat !== defaultLat && lng !== defaultLng) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
      this.marker.bindPopup('Position de l\'action').openPopup();
    }

    // Add click event to set location
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Update form
      this.actionForm.patchValue({
        latitude: lat,
        longitude: lng
      }, { emitEvent: false });

      // Remove old marker
      if (this.marker) {
        this.map?.removeLayer(this.marker);
      }

      // Add new marker
      this.marker = L.marker([lat, lng]).addTo(this.map!);
      this.marker.bindPopup('✅ Position définie<br><small>Latitude: ' + lat.toFixed(6) + '<br>Longitude: ' + lng.toFixed(6) + '</small>').openPopup();

      // Show success message
      this.geocodeSuccess = true;
      this.geocodeError = null;
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    // Clean up photo preview
    if (this.uploadedPhoto) {
      URL.revokeObjectURL(this.uploadedPhoto.preview);
    }
  }

  // Photo upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File): void {
    this.uploadError = null;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.uploadError = `Format non supporté. Utilisez JPG, PNG ou WEBP`;
      return;
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = `Fichier trop volumineux (maximum 5 Mo)`;
      return;
    }

    // Clean up old preview if exists
    if (this.uploadedPhoto) {
      URL.revokeObjectURL(this.uploadedPhoto.preview);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.uploadedPhoto = {
          file: file,
          preview: e.target.result as string,
          name: file.name
        };
      }
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    if (this.uploadedPhoto) {
      URL.revokeObjectURL(this.uploadedPhoto.preview);
      this.uploadedPhoto = null;
      this.uploadError = null;
    }
  }

  // Stepper navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validate current step before moving forward
      if (this.validateCurrentStep()) {
        this.currentStep++;

        // Initialize or refresh map when reaching step 2
        if (this.currentStep === 2) {
          if (!this.map) {
            setTimeout(() => this.initMap(), 100);
          } else {
            // Refresh map size in case container was hidden
            setTimeout(() => {
              this.map?.invalidateSize();
            }, 100);
          }
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;

      // Initialize or refresh map when reaching step 2
      if (this.currentStep === 2) {
        if (!this.map) {
          setTimeout(() => this.initMap(), 100);
        } else {
          // Refresh map size in case container was hidden
          setTimeout(() => {
            this.map?.invalidateSize();
          }, 100);
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateCurrentStep(): boolean {
    this.error = null;

    switch (this.currentStep) {
      case 1: // Informations de base
        const step1Fields = ['titre', 'description', 'categoryId'];
        return this.validateFields(step1Fields, 'Veuillez remplir tous les champs obligatoires');

      case 2: // Date et localisation
        const step2Fields = ['dateStart', 'dateEnd', 'address', 'city'];
        if (!this.validateFields(step2Fields, 'Veuillez remplir tous les champs obligatoires')) {
          return false;
        }
        if (!this.hasValidDateRange()) {
          this.error = 'La date de fin doit être postérieure à la date de début';
          return false;
        }
        return true;

      case 3: // Participants et récompenses
        const step3Fields = ['maxParticipants', 'points'];
        return this.validateFields(step3Fields, 'Veuillez remplir tous les champs obligatoires');

      case 4: // Programme et infos (optionnel)
      case 5: // Photos (optionnel)
        return true;

      default:
        return true;
    }
  }

  private validateFields(fields: string[], errorMessage: string): boolean {
    for (const field of fields) {
      const control = this.actionForm.get(field);
      if (control && control.invalid) {
        control.markAsTouched();
        this.error = errorMessage;
        return false;
      }
    }
    return true;
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return ['titre', 'description', 'categoryId'].every(field =>
          this.actionForm.get(field)?.valid
        );
      case 2:
        return ['dateStart', 'dateEnd', 'address', 'city'].every(field =>
          this.actionForm.get(field)?.valid
        ) && this.hasValidDateRange();
      case 3:
        return ['maxParticipants', 'points'].every(field =>
          this.actionForm.get(field)?.valid
        );
      default:
        return true;
    }
  }

  getStepTitle(step: number): string {
    const titles = [
      '',
      'Informations de base',
      'Date et localisation',
      'Participants et récompenses',
      'Programme et infos pratiques',
      'Photos',
      'Révision et publication'
    ];
    return titles[step] || '';
  }

  private hasValidDateRange(): boolean {
    const start = this.actionForm.get('dateStart')?.value;
    const end = this.actionForm.get('dateEnd')?.value;

    if (!start || !end) {
      return true;
    }

    return new Date(end).getTime() > new Date(start).getTime();
  }

  /** Aperçu étape récap (évite le pipe date Angular qui interprète en UTC). */
  formatPreviewDateTime(value: string): string {
    if (!value || value.length < 16) {
      return '—';
    }
    const [datePart, timePart] = value.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y} ${timePart}`;
  }
}
