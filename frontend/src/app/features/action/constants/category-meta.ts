export interface CategoryMeta {
  slug: string;
  icon: string;
  color: string;
  subtitle: string;
}

/** Métadonnées UI — le backend ne fournit pas couleur / icône */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  Nettoyage: {
    slug: 'nettoyage',
    icon: '🧹',
    color: '#2D6A4F',
    subtitle: 'Plages, forêts & oueds',
  },
  Reboisement: {
    slug: 'reboisement',
    icon: '🌳',
    color: '#40916C',
    subtitle: 'Plantation & vergers',
  },
  Sensibilisation: {
    slug: 'sensibilisation',
    icon: '📚',
    color: '#52796F',
    subtitle: 'Ateliers & écoles',
  },
  Recyclage: {
    slug: 'recyclage',
    icon: '♻️',
    color: '#74A57F',
    subtitle: 'Collecte & repair café',
  },
  Compostage: {
    slug: 'compostage',
    icon: '🪱',
    color: '#1B4332',
    subtitle: 'Lombri & biodéchets',
  },
};

export function getCategoryMeta(name: string): CategoryMeta {
  return (
    CATEGORY_META[name] ?? {
      slug: name.toLowerCase(),
      icon: '🌱',
      color: '#2D6A4F',
      subtitle: '',
    }
  );
}
