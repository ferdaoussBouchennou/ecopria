# 🌿 Fonctionnalité Partenaires - Ecopria

## 🎯 Vue d'Ensemble

La fonctionnalité **Partenaires** permet aux utilisateurs d'Ecopria de :
- 📋 Voir la liste complète des partenaires éco-responsables
- 🔍 Rechercher et filtrer par catégorie
- 👤 Consulter le profil public de chaque partenaire
- 🎁 Découvrir les offres et récompenses disponibles

---

## ✨ Fonctionnalités Implémentées

### 1. Liste des Partenaires (`/partenaires`)
- Affichage de tous les partenaires de la base de données
- Barre de recherche en temps réel
- Filtre par catégorie
- Grille responsive avec cartes professionnelles
- Compteur de résultats

### 2. Profil Public Partenaire (`/partenaires/:userId`)
- Informations complètes (description, horaires, contact)
- **Offres actives du partenaire**
- Galerie photos (3-4 images)
- Liens réseaux sociaux
- Navigation retour

---

## 🚀 Démarrage Rapide

### Étape 1 : Charger les Données Démo

**Option A : Commande directe**
```powershell
# Partenaires et offres
Get-Content backend/service-recompense/data-demo.sql | docker exec -i mysql-recompense mysql -u root -proot db_recompense

# Galeries photos
Get-Content backend/service-recompense/update-galleries.sql | docker exec -i mysql-recompense mysql -u root -proot db_recompense
```

**Option B : Script PowerShell**
```powershell
cd backend/service-recompense
.\load-demo-data.ps1
```

### Étape 2 : Lancer l'Application

```bash
# Backend (Docker Compose)
docker-compose up -d

# Frontend
cd frontend
npm start
```

### Étape 3 : Ouvrir dans le Navigateur

- **Liste :** http://localhost:4200/partenaires
- **Exemple profil :** http://localhost:4200/partenaires/101

---

## 📊 Données de Démonstration

### 7 Partenaires

| Nom | Catégorie | Ville | Offres |
|-----|-----------|-------|--------|
| Café Botanique | Restauration | Casablanca | 3 |
| Zara Maroc | Mode & Textile | Casablanca | 2 |
| Le Jardin Secret | Restauration | Rabat | 2 |
| Carrefour Bio | Alimentation | Casablanca | 2 |
| Vélo Vert Maroc | Mobilité | Marrakech | 2 |
| Spa Nature & Sens | Bien-être | Casablanca | 2 |
| Librairie Papier Recyclé | Culture & Loisirs | Rabat | 2 |

### 4 Types d'Offres

- **STOCK** : Produits en quantité limitée
- **REDUCTION** : Pourcentages de réduction (10% à 30%)
- **SERVICE** : Prestations (massage, location, révision)
- **EXPERIENCE** : Expériences uniques (dîner gastronomique)

---

## 🎨 Captures d'Écran

### Liste des Partenaires
![Liste Partenaires](https://via.placeholder.com/800x400/4a9b7f/ffffff?text=Liste+Partenaires+-+Recherche+%26+Filtres)

**Fonctionnalités visibles :**
- Header vert avec titre "Nos Partenaires"
- Barre de recherche
- Menu déroulant catégories
- Grille de cartes avec images
- Badges de catégorie

### Profil Public Partenaire
![Profil Partenaire](https://via.placeholder.com/800x400/4a9b7f/ffffff?text=Profil+Partenaire+-+Info+%26+Offres)

**Sections visibles :**
- Hero avec grande image
- À propos (description, contact)
- Grille d'offres avec types
- Galerie photos
- Liens réseaux sociaux

---

## 🔧 Architecture Technique

### Frontend (Angular 18)
```
frontend/src/app/features/recompense/
├── liste-partenaires/          → Liste avec filtres
│   ├── *.component.ts
│   ├── *.component.html
│   └── *.component.scss
├── profil-partenaire-public/   → Profil avec offres
│   └── ...
├── partenaire.service.ts       → API calls partenaires
└── recompense.service.ts       → API calls offres
```

### Backend (Spring Boot + MySQL)
```
backend/service-recompense/
├── data-demo.sql               → Données partenaires/offres
├── update-galleries.sql        → Galeries photos
└── src/main/java/.../
    ├── controller/
    │   ├── PartenaireController.java
    │   └── RecompenseController.java
    ├── model/
    │   ├── Partenaire.java
    │   └── Recompense.java
    └── service/
        └── RecompenseService.java
```

### Base de Données
```sql
-- Table partenaires
partenaires (
  id, user_id, name, category, address, city,
  description, image_url, gallery_images,
  phone, website, instagram_url, facebook_url,
  opening_hours, vues_profil, clics_offres
)

-- Table recompenses
recompenses (
  id, partenaire_id, title, description,
  image_url, points_necessaires, type,
  discount_percentage, valeur_dh, is_active
)
```

---

## 🔗 API Endpoints

### Publics (sans authentification)

```http
# Liste tous les partenaires
GET /api/recompenses/public/partenaires
Response: PartenaireProfil[]

# Profil d'un partenaire
GET /api/recompenses/public/partenaire/{userId}
Response: PartenaireProfil

# Catalogue des offres
GET /api/recompenses
Response: RecompenseItemDto[]

# Offres d'un partenaire
GET /api/recompenses?partenaireUserId={userId}
Response: RecompenseItemDto[]
```

---

## 🧪 Tests

### Vérifier les Données
```powershell
# Compter partenaires
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT COUNT(*) FROM partenaires;"

# Compter offres actives
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT COUNT(*) FROM recompenses WHERE is_active = 1;"

# Voir partenaires
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT name, category, city FROM partenaires;"
```

### Tester l'API
```bash
# Liste partenaires
curl http://localhost:8080/api/recompenses/public/partenaires

# Profil Café Botanique (user_id=101)
curl http://localhost:8080/api/recompenses/public/partenaire/101

# Offres
curl http://localhost:8080/api/recompenses
```

### Tester le Frontend
1. **Liste :** Aller sur http://localhost:4200/partenaires
2. **Recherche :** Taper "Café" → voit uniquement Café Botanique
3. **Filtre :** Sélectionner "Restauration" → voit 2 restaurants
4. **Clic :** Cliquer sur "Café Botanique" → voir profil avec 3 offres

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **QUICK-START.md** | Démarrage en 5 minutes |
| **README-PRESENTATION.md** | Guide complet de présentation |
| **DEMO-DATA-SUMMARY.md** | Détails des données démo |
| **WHAT-WAS-DONE.md** | Récapitulatif technique complet |
| **SUMMARY.md** | Résumé exécutif |
| **README-PARTENAIRES.md** | Ce fichier (vue d'ensemble) |

---

## 🐛 Dépannage

### Les données ne s'affichent pas
**Cause :** Base de données vide  
**Solution :** Charger les données avec `data-demo.sql`

### Erreur 404 sur /partenaires
**Cause :** Frontend pas compilé  
**Solution :** `npm run build` dans le dossier frontend

### Images ne chargent pas
**Cause :** Pas de connexion Internet  
**Solution :** Les images viennent d'Unsplash, vérifier la connexion

### Erreur "Access denied"
**Cause :** Mauvais mot de passe MySQL  
**Solution :** Utiliser `-u root -proot` au lieu de `-u ecopria`

---

## 🎯 Prochaines Étapes (Optionnel)

- [ ] Ajouter plus de partenaires (10+)
- [ ] Implémenter tri (par nom, par ville, par note)
- [ ] Ajouter badges "Partenaire Premium"
- [ ] Implémenter système de favoris
- [ ] Ajouter carte interactive avec localisation
- [ ] Permettre aux partenaires de mettre à jour leur profil
- [ ] Ajouter statistiques de vues sur le profil

---

## 📞 Support

Pour toute question sur cette fonctionnalité :
1. Consultez la documentation (dossier racine)
2. Vérifiez les logs Docker : `docker logs mysql-recompense`
3. Vérifiez les logs backend : `docker logs service-recompense`
4. Vérifiez la console du navigateur (F12)

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [ ] Remplacer les URLs Unsplash par un CDN propre
- [ ] Configurer les user_id des partenaires (101-107)
- [ ] Valider les données en base
- [ ] Tester sur mobile/tablette
- [ ] Vérifier les temps de chargement
- [ ] Optimiser les images
- [ ] Configurer le cache API
- [ ] Tester les cas d'erreur (API down, réseau lent)

---

**🎉 Fonctionnalité Partenaires : Prête à l'emploi !**

Développé avec ❤️ pour Ecopria
