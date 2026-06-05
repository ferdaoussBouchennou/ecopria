/** Profil association exposé publiquement (sans email / téléphone). */
export interface AssociationPublicProfil {
  id: number;
  authId: number;
  name: string;
  city?: string;
  address?: string;
  description?: string;
  logo?: string;
}
