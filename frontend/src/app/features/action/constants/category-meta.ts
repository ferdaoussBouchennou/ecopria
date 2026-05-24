export interface CategoryMeta {
  slug: string;
  color: string;
  subtitle: string;
}

/** Métadonnées UI — le backend ne fournit pas couleur / icône */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  Nettoyage: {
    slug: 'nettoyage',
    color: '#2D6A4F',
    subtitle: 'Plages, forêts & oueds',
  },
  Reboisement: {
    slug: 'reboisement',
    color: '#40916C',
    subtitle: 'Plantation & vergers',
  },
  Sensibilisation: {
    slug: 'sensibilisation',
    color: '#52796F',
    subtitle: 'Ateliers & écoles',
  },
  Recyclage: {
    slug: 'recyclage',
    color: '#74A57F',
    subtitle: 'Collecte & repair café',
  },
  Compostage: {
    slug: 'compostage',
    color: '#1B4332',
    subtitle: 'Lombri & biodéchets',
  },
};

export function getCategoryMeta(name: string): CategoryMeta {
  return (
    CATEGORY_META[name] ?? {
      slug: name.toLowerCase(),
      color: '#2D6A4F',
      subtitle: '',
    }
  );
}
