/** Images locales — frontend/src/assets/images (maquettes Ecopria) */
export const SITE_IMAGES = {
  /** Hero accueil — communauté dans le jardin */
  heroPlanting: '/assets/images/community-group.jpg',
  communityGroup: '/assets/images/community-group.jpg',
  /** Connexion — même visuel communauté */
  loginPlanting: '/assets/images/community-group.jpg',
  /** Créer un compte / inscription compte */
  registerCommunity: '/assets/images/community-group.jpg',
  /** Comment ça marche — QR code sur smartphone */
  howItWorks: '/assets/images/how-qr.jpg',
  /** Cartes « À l'affiche » (accueil) — découpées depuis la maquette */
  eventAffiche: [
    '/assets/images/event-affiche-1.jpg',
    '/assets/images/event-affiche-2.jpg',
    '/assets/images/event-affiche-3.jpg',
  ] as const,
  categories: {
    nettoyage: '/assets/images/cat-nettoyage.jpg',
    reboisement: '/assets/images/cat-reboisement.jpg',
    sensibilisation: '/assets/images/cat-sensibilisation.jpg',
    recyclage: '/assets/images/cat-recyclage.jpg',
    compostage: '/assets/images/cat-compostage.jpg',
  },
} as const;
