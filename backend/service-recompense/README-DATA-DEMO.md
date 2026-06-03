# 🎨 Données de Démonstration - Service Récompense

Ce fichier contient des données de démonstration professionnelles pour présenter l'application Ecopria avec des partenaires et offres réalistes.

## 📊 Contenu du Script `data-demo.sql`

### 7 Partenaires Créés

1. **Café Botanique** 🌿
   - Catégorie: Restauration
   - Ville: Casablanca
   - Description: Restaurant bio et local avec cuisine végétarienne
   - Image: Restaurant moderne avec plantes

2. **Zara Maroc** 👗
   - Catégorie: Mode & Textile
   - Ville: Casablanca
   - Description: Mode durable et collections éco-responsables
   - Image: Intérieur magasin de mode

3. **Le Jardin Secret** 🍽️
   - Catégorie: Restauration
   - Ville: Rabat
   - Description: Restaurant gastronomique zéro déchet
   - Image: Restaurant élégant

4. **Carrefour Bio** 🛒
   - Catégorie: Alimentation
   - Ville: Casablanca
   - Description: Supermarché bio avec rayon zéro déchet
   - Image: Rayon de produits bio

5. **Vélo Vert Maroc** 🚴
   - Catégorie: Mobilité
   - Ville: Marrakech
   - Description: Location et vente de vélos électriques
   - Image: Vélo électrique

6. **Spa Nature & Sens** 💆
   - Catégorie: Bien-être
   - Ville: Casablanca
   - Description: Spa éco-responsable avec produits naturels
   - Image: Spa relaxant

7. **Librairie Papier Recyclé** 📚
   - Catégorie: Culture & Loisirs
   - Ville: Rabat
   - Description: Librairie éco-responsable et papeterie recyclée
   - Image: Librairie chaleureuse

### 17+ Offres Diversifiées

Chaque partenaire possède 2-3 offres variées :

#### Types d'offres :
- **REDUCTION** : Pourcentages de réduction (10%, 15%, 20%, 25%, 30%)
- **STOCK** : Produits ou services en quantité limitée
- **SERVICE** : Prestations sans stock (location vélo, massage, révision)
- **EXPERIENCE** : Expériences uniques (dîner gastronomique)

#### Exemples d'offres :
- Menu Déjeuner Bio Complet (120 pts)
- 20% sur Collection Join Life Zara (150 pts)
- Dîner Gastronomique 2 Personnes (300 pts)
- Location Vélo Électrique 3 Jours (180 pts)
- Massage Relaxant 60min (220 pts)
- Bon d'achat Papeterie 100 DH (80 pts)

### Avis Clients

6 avis positifs répartis sur différents partenaires pour donner de la crédibilité.

## 🚀 Utilisation

### 1. Exécuter le script SQL

**Via Docker (recommandé) :**

```powershell
# PowerShell
Get-Content backend/service-recompense/data-demo.sql | docker exec -i mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense
```

**Via MySQL client direct :**

```bash
mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense < backend/service-recompense/data-demo.sql
```

### 2. Vérifier les données

**Lister les partenaires :**

```powershell
docker exec -i mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "SELECT name, category, city FROM partenaires;"
```

**Compter les offres actives :**

```powershell
docker exec -i mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "SELECT COUNT(*) as total_offres FROM recompenses WHERE is_active = 1;"
```

**Voir les offres par partenaire :**

```powershell
docker exec -i mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "SELECT p.name, COUNT(r.id) as nb_offres FROM partenaires p LEFT JOIN recompenses r ON p.id = r.partenaire_id WHERE r.is_active = 1 GROUP BY p.id;"
```

## 📸 Sources des Images

Toutes les images proviennent de **Unsplash** (libres de droits) :
- Images de haute qualité et professionnelles
- Thématiques : restaurants, mode, spa, vélos, produits bio, librairie
- Format optimisé pour l'affichage web (600x400px)

## 🔄 Mise à jour des données

Le script utilise `ON DUPLICATE KEY UPDATE` pour :
- Créer les partenaires s'ils n'existent pas
- Mettre à jour leurs informations s'ils existent déjà
- Éviter les doublons

**Pour nettoyer et recommencer :**

Décommentez les lignes `DELETE` au début du script.

## 🎯 User IDs des Partenaires

Les partenaires utilisent les `user_id` suivants :
- 101: Café Botanique
- 102: Zara Maroc
- 103: Le Jardin Secret
- 104: Carrefour Bio
- 105: Vélo Vert Maroc
- 106: Spa Nature & Sens
- 107: Librairie Papier Recyclé

**Important:** Ces `user_id` doivent correspondre à des utilisateurs existants dans la table `users` du service-auth avec le rôle `PARTENAIRE` et statut validé.

## 🔗 API Endpoints pour Tester

Une fois les données insérées, testez via :

```bash
# Liste publique des partenaires
GET http://localhost:8080/api/recompenses/public/partenaires

# Profil public d'un partenaire
GET http://localhost:8080/api/recompenses/public/partenaire/101

# Catalogue des offres
GET http://localhost:8080/api/recompenses

# Offres d'un partenaire spécifique (à implémenter côté backend si besoin)
GET http://localhost:8080/api/recompenses?partenaireUserId=101
```

## 📱 Frontend

Les données s'affichent automatiquement dans :
- `/partenaires` : Liste complète avec filtres
- `/partenaires/:userId` : Profil public avec offres
- Page d'accueil : Section "Nos Partenaires"

## 🎨 Personnalisation

Pour ajouter vos propres partenaires et offres, modifiez le fichier `data-demo.sql` en suivant la même structure SQL.

---

**Note:** Ce script est conçu pour la démonstration. Pour la production, utilisez des données réelles et des images hébergées sur votre propre CDN.
