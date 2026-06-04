# Images Ecopria — prompts Gemini

Dossier : `frontend/src/assets/images/`

**Style commun** (à ajouter à chaque prompt) :

> Photo éditoriale réaliste, lumière naturelle douce, palette **vert sauge (#acb087), beige crème (#faf8f5), marron terre (#95714f)** — **pas de violet, pas de néon**. Ambiance Ecopria : éco-citoyenneté élégante, locale, humaine. **Pas de texte lisible, pas de logo, pas de watermark.**

---

## Page d'accueil

Les **3 chiffres du hero** (actions réalisées, participants inscrits, actions à venir) viennent de l’API `GET /api/public/stats` — pas de valeurs fixes dans le code.

| Fichier | Section |
|---------|---------|
| `hero-planting.jpg` | Hero (grande image à droite) |
| `community-group.jpg` | Bloc « Communauté » |
| `how-qr.jpg` | Aperçu « Comment ça marche » sur l'accueil |

### `hero-planting.jpg` — Hero (ratio **4:5**, min. 1200×1500 px)

```
Photo éditoriale réaliste : bénévoles de tous âges plantant des arbustes ou jeunes plants en pleine nature (lisière de forêt ou colline verdoyante), outils simples, gants, sourires discrets. Lumière matinale dorée, profondeur de champ. Évoque l'éco-action concrète et collective. Palette vert sauge, beige, marron terre — pas de violet. Pas de texte, pas de logo. Format portrait 4:5, haute résolution.
```

### `community-group.jpg` — Communauté (ratio **4:5**)

```
Photo éditoriale réaliste : groupe divers et chaleureux (familles, jeunes, seniors) dans un jardin partagé ou jardin citoyen, conversation et rires, vêtements naturels lin (vert sauge, crème). Ambiance « maison commune », inclusive, optimiste. Fin d'après-midi. Pas de texte, pas de logo. Format portrait 4:5.
```

### `how-qr.jpg` — Comment ça marche (aperçu accueil, ratio **4:5**)

```
Photo éditoriale réaliste : participant tenant un smartphone orienté vers un QR code imprimé sur un chevalet d'association lors d'une action écologique en plein air (le QR est flou, non lisible). Évoque validation de présence sur le terrain. Tons vert, beige, terre. Pas de UI lisible, pas de logo. Format portrait 4:5.
```

---

## Catégories d'actions (images dynamiques)

Les visuels des catégories ne sont **plus** des fichiers fixes dans ce dossier. L’admin les définit via **Espace admin → Catégories** (`imageUrl` synchronisé vers `service-action`).

- **API** : `GET /api/categories` → `{ id, name, description, imageUrl }`
- **Accueil** et **liste actions** : affichent `imageUrl` de l’API
- **Repli** si pas d’`imageUrl` ou URL invalide : `assets/logo.png`

Pour chaque catégorie, l’admin renseigne l’URL de l’image à la création ou la modification.

---

## Autres (hors accueil mais même dossier)

| Fichier | Usage |
|---------|--------|
| `login-planting.jpg` | Page connexion |
| `event-affiche-1.jpg` / `event-affiche-2.jpg` | Fallbacks récompenses (optionnel) |

### `login-planting.jpg` (optionnel, paysage **16:9** ou **4:5**)

```
Photo éditoriale réaliste : mains plantant une jeune pousse, gouttes de rosée, macro douce, fond verdoyant flou. Symbolise engagement et reprise. Vert sauge, beige. Pas de texte, pas de logo.
```

---

## Comment ça marche (page dédiée)

Voir `how-steps/README.md`.
