// Modèle aligné sur com.ecopria.utilisateur.model.Association
export interface AssociationProfile {
  id: number;
  authId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  logo: string;
  createdAt: string;
}

export interface UpdateAssociationProfileDTO {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  logo?: string;
}

export interface ProfileFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  logo?: string;
}
