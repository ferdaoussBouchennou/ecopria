/** Images locales — frontend/src/assets/images (maquettes Ecopria) */
export const SITE_IMAGES = {
  /** Hero accueil — bénévoles en pleine nature */
  heroPlanting: '/assets/images/hero-planting.jpg',
  communityGroup: '/assets/images/community-group.jpg',
  loginPlanting: '/assets/images/login-planting.jpg',
  registerCommunity: '/assets/images/community-group.jpg',
  howItWorks: '/assets/images/how-qr.jpg',
  recompensesCatalogue: '/assets/images/event-affiche-1.jpg',
  mystereBox: '/assets/images/event-affiche-2.jpg',
  /** Illustrations page Comment ça marche (palette Ecopria) */
  howSteps: {
    choisir: '/assets/images/how-steps/how-step-01-choisir.jpg',
    inscrire: '/assets/images/how-steps/how-step-02-inscrire.jpg',
    scanner: '/assets/images/how-steps/how-step-03-scanner.jpg',
    echanger: '/assets/images/how-steps/how-step-04-echanger.jpg',
    mystere: '/assets/images/how-steps/how-step-05-mystere.jpg',
  },
  /** Visuels distincts pour les cartes « À l'affiche » */
  featured: {
    nettoyage: '/assets/images/hero-planting.jpg',
    reboisement: '/assets/images/cat-reboisement.jpg',
    sensibilisation: '/assets/images/how-qr.jpg',
    recyclage: '/assets/images/how-qr.jpg',
    compostage: '/assets/images/cat-reboisement.jpg',
  },
  /** Fallback par index si la catégorie n'est pas reconnue */
  featuredFallback: [
    '/assets/images/hero-planting.jpg',
    '/assets/images/cat-reboisement.jpg',
    '/assets/images/how-qr.jpg',
  ] as const,
  categories: {
    nettoyage: '/assets/images/hero-planting.jpg',
    reboisement: '/assets/images/cat-reboisement.jpg',
    sensibilisation: '/assets/images/how-qr.jpg',
    recyclage: '/assets/images/how-qr.jpg',
    compostage: '/assets/images/cat-reboisement.jpg',
  },
} as const;
