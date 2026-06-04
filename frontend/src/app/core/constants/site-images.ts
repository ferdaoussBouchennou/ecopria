/** Images locales — frontend/src/assets/images (maquettes Ecopria) */
export const SITE_IMAGES = {
  /** Hero accueil — bénévoles en pleine nature */
  heroPlanting: '/assets/images/hero-planting.jpg',
  communityGroup: '/assets/images/community-group.jpg',
  loginPlanting: '/assets/images/login-planting.jpg',
  registerCommunity: '/assets/images/community-group.jpg',
  howItWorks: '/assets/images/how-qr.jpg',
  /** Visuels distincts pour les cartes « À l'affiche » */
  featured: {
    nettoyage: '/assets/images/cat-nettoyage.jpg',
    reboisement: '/assets/images/cat-reboisement.jpg',
    sensibilisation: '/assets/images/cat-sensibilisation.jpg',
    recyclage: '/assets/images/cat-recyclage.jpg',
    compostage: '/assets/images/cat-compostage.jpg',
  },
  /** Fallback par index si la catégorie n'est pas reconnue */
  featuredFallback: [
    '/assets/images/hero-planting.jpg',
    '/assets/images/cat-reboisement.jpg',
    '/assets/images/how-qr.jpg',
  ] as const,
  categories: {
    nettoyage: '/assets/images/cat-nettoyage.jpg',
    reboisement: '/assets/images/cat-reboisement.jpg',
    sensibilisation: '/assets/images/cat-sensibilisation.jpg',
    recyclage: '/assets/images/cat-recyclage.jpg',
    compostage: '/assets/images/cat-compostage.jpg',
  },
} as const;
