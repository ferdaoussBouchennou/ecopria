import { SITE_IMAGES } from '../../../core/constants/site-images';

export interface HowStep {
  num: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  ctaLink: string | string[];
  /** Lien CTA pour participant connecté (optionnel). */
  ctaLinkCitizen?: string | string[];
}

export const HOW_HERO = {
  eyebrow: 'Comment ça marche',
  title: 'Un geste simple. Une boucle vertueuse.',
  lead:
    "De l'action sur le terrain aux offres partenaires : inscription, présence, points, coupons et boîte mystère — chaque étape expliquée simplement.",
} as const;

export const HOW_STEPS: HowStep[] = [
  {
    num: '01',
    title: 'Choisir une action qui vous parle.',
    body:
      "La carte ou la liste éditoriale d'Ecopria vous présente les actions près de chez vous, classées par catégorie, distance ou date.",
    image: SITE_IMAGES.howSteps.choisir,
    imageAlt: 'Groupe de citoyens souriants dans un jardin',
    ctaLabel: 'Explorer la carte',
    ctaLink: '/carte',
  },
  {
    num: '02',
    title: 'Réserver votre place en un clic.',
    body:
      "Inscrivez-vous à l'action de votre choix. Dès la première inscription, Ecopria génère un QR code unique pour cette action — côté association, pas chez le participant — avec un code PIN de secours, à afficher sur le terrain.",
    image: SITE_IMAGES.howSteps.inscrire,
    imageAlt: 'QR code de présence affiché par une association',
    ctaLabel: 'Voir les actions',
    ctaLink: '/actions',
  },
  {
    num: '03',
    title: 'Scanner sur place, être récompensé.',
    body:
      "Le jour J, scannez le QR affiché par l'organisateur depuis votre espace (ou saisissez le code). Votre présence est validée et vos points sont crédités sur votre compte.",
    image: SITE_IMAGES.howSteps.scanner,
    imageAlt: 'Bénévoles engagés lors d\'une action écologique',
    ctaLabel: 'Mon espace participant',
    ctaLink: '/connexion',
    ctaLinkCitizen: '/espace/dashboard',
  },
  {
    num: '04',
    title: 'Échanger vos points contre une offre.',
    body:
      "Connectez-vous et parcourez le catalogue des partenaires (visible sans compte, échange réservé aux inscrits). Choisissez une offre affichée, dépensez vos points : un coupon unique est généré, valable 30 jours, envoyé par e-mail et retrouvable dans votre espace. Présentez le code chez le partenaire, qui le valide à l'accueil.",
    image: SITE_IMAGES.howSteps.echanger,
    imageAlt: 'Affiches d\'offres locales partenaires Ecopria',
    ctaLabel: 'Voir le catalogue',
    ctaLink: '/recompenses',
    ctaLinkCitizen: '/espace/recompenses',
  },
  {
    num: '05',
    title: 'Ou tenter la boîte mystère.',
    body:
      "Sur certaines offres, vous choisissez : réserver l'offre visible ou ouvrir la boîte mystère pour un nombre de points indiqué. Un tirage aléatoire parmi les surprises cachées du partenaire vous attribue un lot — parfois plus généreux, parfois plus modeste — et un coupon comme pour un échange classique.",
    image: SITE_IMAGES.howSteps.mystere,
    imageAlt: 'Offre partenaire avec option boîte mystère',
    ctaLabel: 'Découvrir les offres mystère',
    ctaLink: '/recompenses',
    ctaLinkCitizen: '/espace/recompenses',
  },
];
