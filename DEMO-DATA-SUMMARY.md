# 🎉 Résumé des Données de Démonstration - Ecopria

## ✅ Ce qui a été fait

### 1. **Création du script SQL**
Fichier : `backend/service-recompense/data-demo.sql`

**Contenu :**
- 7 partenaires professionnels avec informations complètes
- 17+ offres variées (REDUCTION, STOCK, SERVICE, EXPERIENCE)
- 6 avis clients positifs
- Images haute qualité depuis Unsplash

### 2. **Partenaires ajoutés**

| Partenaire | Catégorie | Ville | User ID | Offres |
|-----------|-----------|-------|---------|--------|
| **Café Botanique** 🌿 | Restauration | Casablanca | 101 | 3 |
| **Zara Maroc** 👗 | Mode & Textile | Casablanca | 102 | 2 |
| **Le Jardin Secret** 🍽️ | Restauration | Rabat | 103 | 2 |
| **Carrefour Bio** 🛒 | Alimentation | Casablanca | 104 | 2 |
| **Vélo Vert Maroc** 🚴 | Mobilité | Marrakech | 105 | 2 |
| **Spa Nature & Sens** 💆 | Bien-être | Casablanca | 106 | 2 |
| **Librairie Papier Recyclé** 📚 | Culture & Loisirs | Rabat | 107 | 2 |

### 3. **Exemples d'offres créées**

#### 🍽️ Restauration
- Menu Déjeuner Bio Complet (120 pts) - STOCK
- 15% sur toute la carte (80 pts) - REDUCTION
- Café & Pâtisserie Maison (50 pts) - STOCK
- Dîner Gastronomique 2 Personnes (300 pts) - EXPERIENCE
- 25% sur Menu du Jour (100 pts) - REDUCTION

#### 👗 Mode
- 20% sur Collection Join Life (150 pts) - REDUCTION
- Bon d'achat 250 DH (200 pts) - REDUCTION

#### 🛒 Alimentation
- 10% sur Rayon Bio (60 pts) - REDUCTION
- Panier de Légumes Bio (90 pts) - STOCK

#### 🚴 Mobilité
- Location Vélo Électrique 3 Jours (180 pts) - SERVICE
- Révision Complète Gratuite (70 pts) - SERVICE

#### 💆 Bien-être
- Massage Relaxant 60min (220 pts) - SERVICE
- 30% sur Soins Visage (130 pts) - REDUCTION

#### 📚 Culture
- 20% sur Livres d'Occasion (40 pts) - REDUCTION
- Bon d'achat Papeterie 100 DH (80 pts) - STOCK

## 🖼️ Images utilisées

Toutes les images proviennent de **Unsplash** (libres de droits) :

### Partenaires
- Restaurant moderne avec plantes vertes
- Intérieur de magasin de mode élégant
- Restaurant gastronomique raffiné
- Rayon de supermarché bio
- Vélo électrique moderne
- Spa avec ambiance zen
- Librairie chaleureuse

### Offres
- Plats cuisinés appétissants
- Vêtements tendance
- Produits bio et légumes frais
- Vélos et équipements
- Soins de spa et massages
- Livres et papeterie

**Format optimisé :** 600x400px ou 800x600px

## 📊 Statistiques actuelles

```
✅ Partenaires : 11
✅ Offres actives : 30+
✅ Avis clients : 6+
✅ Catégories : 6
```

## 🚀 Comment utiliser les données

### Option 1 : Via Docker (Recommandé)

```powershell
# Dans le dossier backend/service-recompense
Get-Content data-demo.sql | docker exec -i mysql-recompense mysql -u root -proot db_recompense
```

### Option 2 : Via Script PowerShell

```powershell
# Dans le dossier backend/service-recompense
.\load-demo-data.ps1
```

### Vérification

```powershell
# Vérifier les partenaires
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT name, category, city FROM partenaires;"

# Vérifier les offres
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT COUNT(*) FROM recompenses WHERE is_active = 1;"
```

## 🌐 Tester dans l'application

### Frontend Angular
1. **Liste des partenaires :** http://localhost:4200/partenaires
   - Affiche tous les partenaires avec filtres
   - Recherche par nom/ville
   - Filtre par catégorie

2. **Profil d'un partenaire :** http://localhost:4200/partenaires/101
   - Infos complètes du partenaire
   - Ses offres actives
   - Galerie photos
   - Réseaux sociaux

3. **Accueil :** http://localhost:4200/
   - Section "Nos Partenaires" en bas de page

### API Backend
```bash
# Liste publique des partenaires
GET http://localhost:8080/api/recompenses/public/partenaires

# Profil public d'un partenaire
GET http://localhost:8080/api/recompenses/public/partenaire/101

# Catalogue des offres
GET http://localhost:8080/api/recompenses

# Offres par type
GET http://localhost:8080/api/recompenses?type=REDUCTION
```

## 🎨 Capture d'écran attendue

### Page Liste Partenaires
- Header vert avec titre "Nos Partenaires"
- Barre de recherche
- Filtre par catégorie
- Grille de cartes avec :
  - Image du partenaire
  - Badge catégorie
  - Nom et ville
  - Description courte
  - Hover effect avec élévation

### Page Profil Partenaire
- Hero avec image en grand format
- Badge catégorie
- Nom et description
- Section "À propos"
- Section "Offres disponibles" avec cartes d'offres
- Galerie photos
- Liens réseaux sociaux
- Bouton retour

## 📝 Notes importantes

1. **User IDs :** Les partenaires utilisent les user_id 101-107. Assurez-vous que ces utilisateurs existent dans la table `users` du service-auth avec le rôle `PARTENAIRE`.

2. **Images :** Les URLs pointent vers Unsplash. En production, hébergez les images sur votre propre CDN.

3. **Mise à jour :** Le script utilise `ON DUPLICATE KEY UPDATE`, vous pouvez le ré-exécuter sans créer de doublons.

4. **Nettoyage :** Pour recommencer à zéro, décommentez les lignes `DELETE` au début du script SQL.

## 🔧 Dépannage

### Problème : "Access denied for user 'ecopria'"
**Solution :** Utilisez l'utilisateur root au lieu de ecopria
```powershell
docker exec -i mysql-recompense mysql -u root -proot db_recompense < data-demo.sql
```

### Problème : "Le conteneur n'existe pas"
**Solution :** Lancez Docker Compose
```bash
docker-compose up -d
```

### Problème : "Les offres ne s'affichent pas"
**Solution :** Vérifiez que le service-recompense est démarré sur le port 9093
```bash
curl http://localhost:9093/api/recompenses
```

## ✨ Prochaines étapes

1. ✅ **Données démo chargées**
2. ⏭️ Créer des users correspondants dans service-auth (user_id 101-107)
3. ⏭️ Tester l'échange de récompenses
4. ⏭️ Tester le scan de coupons
5. ⏭️ Ajouter plus d'avis clients
6. ⏭️ Ajouter des galeries photos pour chaque partenaire

---

**🎉 Votre application Ecopria est maintenant prête à être démontrée avec des données professionnelles !**
