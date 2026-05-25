// Modèle pour le profil complet de l'association
export interface AssociationProfile {
  id: number;
  userId: number; // authId
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  logo: string; // URL
  createdAt: string;
}

// DTO pour la mise à jour du profil
export interface UpdateAssociationProfileDTO {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  logo?: string;
}

// Validation du formulaire
export interface ProfileFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  logo?: string;
}
