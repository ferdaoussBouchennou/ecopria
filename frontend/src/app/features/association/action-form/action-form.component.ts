import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssociationService, CreateActionDTO } from '../services/association.service';
import { ActionService } from '../../action/services/action.service';
import { ActionDetail } from '../../action/models/action.model';

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
export class ActionFormComponent implements OnInit {
  actionForm!: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  actionId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private associationService: AssociationService,
    private actionService: ActionService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.actionId = Number(id);
      this.loadAction(this.actionId);
    }
  }

  initForm(): void {
    this.actionForm = this.fb.group({
      titre: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.required],
      categoryId: [null, Validators.required],
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
    const dateStart = new Date(action.dateStart).toISOString().slice(0, 16);
    const dateEnd = new Date(action.dateEnd).toISOString().slice(0, 16);

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
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.submitting = true;
    this.error = null;

    const formValue = this.actionForm.value;

    // Filtrer les éléments vides des tableaux
    const program = formValue.program.filter((item: string) => item.trim() !== '');
    const practicalInfos = formValue.practicalInfos.filter((info: string) => info.trim() !== '');

    const actionData: CreateActionDTO = {
      titre: formValue.titre,
      description: formValue.description,
      categoryId: formValue.categoryId,
      dateStart: new Date(formValue.dateStart).toISOString(),
      dateEnd: new Date(formValue.dateEnd).toISOString(),
      address: formValue.address,
      city: formValue.city,
      postalCode: formValue.postalCode || undefined,
      latitude: formValue.latitude || undefined,
      longitude: formValue.longitude || undefined,
      maxParticipants: formValue.maxParticipants,
      points: formValue.points,
      program: program.length > 0 ? program : undefined,
      practicalInfos: practicalInfos.length > 0 ? practicalInfos : undefined,
      isFixed: false,
      statut: publier ? 'PUBLISHED' : 'DRAFT'
    };

    if (this.isEditMode && this.actionId) {
      this.associationService.modifierAction(this.actionId, actionData).subscribe({
        next: () => {
          alert(publier ? 'Action publiée avec succès !' : 'Action modifiée avec succès !');
          this.router.navigate(['/association/mes-actions']);
        },
        error: (err) => {
          console.error('Erreur modification:', err);
          this.error = 'Erreur lors de la modification de l\'action';
          this.submitting = false;
        }
      });
    } else {
      this.associationService.creerAction(actionData).subscribe({
        next: () => {
          alert(publier ? 'Action créée et publiée !' : 'Action enregistrée en brouillon !');
          this.router.navigate(['/association/mes-actions']);
        },
        error: (err) => {
          console.error('Erreur création:', err);
          this.error = 'Erreur lors de la création de l\'action';
          this.submitting = false;
        }
      });
    }
  }

  enregistrerBrouillon(): void {
    this.onSubmit(false);
  }

  publier(): void {
    if (confirm('Voulez-vous publier cette action ? Elle sera visible par tous les utilisateurs.')) {
      this.onSubmit(true);
    }
  }

  annuler(): void {
    if (confirm('Voulez-vous annuler ? Les modifications non enregistrées seront perdues.')) {
      this.router.navigate(['/association/mes-actions']);
    }
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
      if (field.errors['required']) return 'Ce champ est obligatoire';
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      if (field.errors['min']) return `Minimum ${field.errors['min'].min}`;
    }
    return '';
  }
}
