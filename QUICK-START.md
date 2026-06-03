# 🚀 Quick Start - Démonstration Partenaires Ecopria

## ✅ Ce qui a été fait

1. **Page liste des partenaires** → `/partenaires`
2. **Page profil public** → `/partenaires/:userId`
3. **7 partenaires** avec images et infos complètes
4. **17+ offres** variées et réalistes
5. **Filtres et recherche** fonctionnels
6. **Galeries photos** pour chaque partenaire

## 🎯 Lancer la démo

### 1. Charger les données (une seule fois)

```powershell
# Option A : Via commande directe
Get-Content backend/service-recompense/data-demo.sql | docker exec -i mysql-recompense mysql -u root -proot db_recompense

# Option B : Via script (plus joli)
cd backend/service-recompense
.\load-demo-data.ps1
```

### 2. Ajouter les galeries photos (une seule fois)

```powershell
Get-Content backend/service-recompense/update-galleries.sql | docker exec -i mysql-recompense mysql -u root -proot db_recompense
```

### 3. Vérifier les données

```powershell
# Compter les partenaires
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT COUNT(*) FROM partenaires;"

# Compter les offres
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT COUNT(*) FROM recompenses WHERE is_active = 1;"
```

### 4. Lancer l'application

```bash
# Backend (déjà lancé avec Docker Compose)
docker-compose up -d

# Frontend
cd frontend
npm start
```

### 5. Ouvrir dans le navigateur

- **Liste des partenaires :** http://localhost:4200/partenaires
- **Profil Café Botanique :** http://localhost:4200/partenaires/101
- **Profil Zara Maroc :** http://localhost:4200/partenaires/102

## 🎨 Partenaires disponibles

| ID | Nom | Catégorie | Ville | Offres |
|----|-----|-----------|-------|--------|
| 101 | Café Botanique | Restauration | Casablanca | 3 |
| 102 | Zara Maroc | Mode & Textile | Casablanca | 2 |
| 103 | Le Jardin Secret | Restauration | Rabat | 2 |
| 104 | Carrefour Bio | Alimentation | Casablanca | 2 |
| 105 | Vélo Vert Maroc | Mobilité | Marrakech | 2 |
| 106 | Spa Nature & Sens | Bien-être | Casablanca | 2 |
| 107 | Librairie Papier Recyclé | Culture & Loisirs | Rabat | 2 |

## 🔍 Tester les fonctionnalités

### Liste des partenaires
1. Aller sur http://localhost:4200/partenaires
2. **Rechercher** : Taper "Café" dans la barre de recherche
3. **Filtrer** : Sélectionner "Restauration" dans le menu déroulant
4. **Réinitialiser** : Cliquer sur "Réinitialiser"

### Profil partenaire
1. Cliquer sur un partenaire dans la liste
2. Voir ses **informations** complètes
3. Voir ses **offres** actives
4. Voir sa **galerie** photos
5. Cliquer sur **"Retour aux partenaires"**

## 📱 API à tester

```bash
# Liste des partenaires
curl http://localhost:8080/api/recompenses/public/partenaires

# Profil d'un partenaire
curl http://localhost:8080/api/recompenses/public/partenaire/101

# Offres d'un partenaire
curl http://localhost:8080/api/recompenses
```

## 🐛 Dépannage rapide

### Les données ne s'affichent pas ?
```powershell
# Vérifier la base de données
docker exec -i mysql-recompense mysql -u root -proot db_recompense -e "SELECT name FROM partenaires LIMIT 5;"
```

### Erreur 404 sur /partenaires ?
```bash
# Vérifier que le frontend est compilé
cd frontend
npm run build
```

### Les images ne chargent pas ?
- Les images viennent d'Unsplash, vérifiez votre connexion Internet

## 📚 Documentation complète

- **Guide détaillé :** `README-PRESENTATION.md`
- **Résumé données :** `DEMO-DATA-SUMMARY.md`
- **Doc SQL :** `backend/service-recompense/README-DATA-DEMO.md`

---

**🎉 C'est prêt ! Votre démo Ecopria attend.**
