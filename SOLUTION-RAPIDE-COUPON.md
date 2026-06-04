# ⚡ SOLUTION RAPIDE: Résoudre l'erreur de validation de coupon

## ❌ PROBLÈME

Lorsque vous entrez un code coupon dans l'espace partenaire, vous obtenez:
```
⚠️ Erreur
Une erreur inattendue est survenue.
```

## ✅ SOLUTION EN 3 ÉTAPES

### ÉTAPE 1: Préparer les données (2 minutes)

Exécutez ce script SQL:

```bash
mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026 < prepare-test-data.sql
```

OU exécutez manuellement ces commandes:

```sql
-- Connexion MySQL
mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026

-- 1. Ajouter des points au citoyen
USE db_utilisateur;
UPDATE citizens SET total_points = 500, points_disponibles = 500 WHERE auth_id = 1;

-- 2. Créer un partenaire
USE db_recompense;
INSERT IGNORE INTO partenaire (
    user_id, name, category, address, city, 
    description, phone, commission_rate,
    vues_profil, clics_offres
) VALUES (
    3, 'EcoShop Test', 'COMMERCE_LOCAL', 
    '123 Bd Mohammed V', 'Casablanca',
    'Partenaire de test', '0522123456', 10.0,
    0, 0
);

-- 3. Créer une récompense
INSERT IGNORE INTO recompense (
    id, partenaire_id, title, description,
    points_necessaires, type, is_active,
    discount_percentage, valeur_dh
) 
SELECT 
    1,
    (SELECT id FROM partenaire WHERE user_id = 3 LIMIT 1),
    'Réduction 20%',
    'Test réduction sur tout le magasin',
    100,
    'REDUCTION',
    true,
    20,
    50.0
WHERE NOT EXISTS (SELECT 1 FROM recompense WHERE id = 1);
```

### ÉTAPE 2: Tester le flux complet (1 minute)

```powershell
cd c:\Users\user\Desktop\ecopria
.\test-flux-echange.ps1
```

Ce script va:
1. ✅ Vérifier que les services fonctionnent
2. ✅ Afficher le solde de points du citoyen
3. ✅ Échanger des points contre une récompense
4. ✅ Générer un code coupon
5. ✅ Valider le coupon côté partenaire

**Résultat attendu:**
```
========================================
TEST FLUX ECHANGE DE POINTS
========================================

[0] Vérification des services...
  [OK] Service-Utilisateur (8082)
  [OK] Service-Recompense (9093)

[1] Solde initial du citoyen...
  Citoyen ID 1 : 500 points

[2] Échange de points...
  [OK] Coupon généré!
  Code: ECO-2026-ABCDE
  Offre: Réduction 20%
  Points utilisés: 100

[3] Vérification du nouveau solde...
  Solde avant: 500 points
  Solde après: 400 points
  Déduit: 100 points

[4] Validation du coupon par le partenaire...
  [OK] Coupon validé avec succès!
  Code: ECO-2026-ABCDE
  Statut: UTILISE

========================================
RÉSUMÉ DU TEST
========================================
  [OK] Échange de points
  [OK] Génération du coupon: ECO-2026-ABCDE
  [OK] Déduction des points: 500 → 400
  [OK] Validation du coupon par le partenaire

  FLUX COMPLET RÉUSSI!
========================================
```

### ÉTAPE 3: Tester dans le frontend (2 minutes)

#### A. Connexion en tant que CITOYEN

1. Allez sur: `http://localhost:4200/connexion`
2. Connectez-vous avec le citoyen (ID 1)
3. Allez sur la page d'un partenaire
4. Cliquez sur "Échanger" pour une offre (100 points)
5. **NOTEZ LE CODE COUPON GÉNÉRÉ** (ex: ECO-2026-XXXXX)

#### B. Connexion en tant que PARTENAIRE

1. Déconnectez-vous
2. Connectez-vous avec le partenaire (ID 3)
3. Allez sur: `http://localhost:4200/espace-partenaire/scanner-coupon`
4. Entrez le code coupon noté précédemment
5. Cliquez sur "Valider"

**Résultat attendu:**
```
✅ Coupon validé !
ECO-2026-XXXXX — Réduction 20%
```

---

## 🔍 SI LE PROBLÈME PERSISTE

### Erreur: "Partenaire non trouvé"

**Cause:** Le partenaire avec `user_id = 3` n'existe pas.

**Solution:**
```sql
USE db_recompense;
SELECT * FROM partenaire WHERE user_id = 3;

-- Si vide, créer le partenaire:
INSERT INTO partenaire (user_id, name, category, address, city, description, phone, commission_rate, vues_profil, clics_offres)
VALUES (3, 'EcoShop Test', 'COMMERCE_LOCAL', '123 Bd Mohammed V', 'Casablanca', 'Partenaire de test', '0522123456', 10.0, 0, 0);
```

### Erreur: "Coupon introuvable"

**Cause:** Le code coupon n'existe pas ou est mal saisi.

**Solution:**
```sql
USE db_recompense;
SELECT code, status FROM coupon ORDER BY created_at DESC LIMIT 5;

-- Vérifiez le code exact et réessayez
```

### Erreur: "Points insuffisants"

**Cause:** Le citoyen n'a pas assez de points.

**Solution:**
```sql
USE db_utilisateur;
UPDATE citizens SET total_points = 500, points_disponibles = 500 WHERE auth_id = 1;
```

### Erreur: "Ce coupon n'appartient pas à votre enseigne"

**Cause:** Le coupon a été généré pour un autre partenaire.

**Solution:**
```sql
USE db_recompense;

-- Vérifier à quel partenaire appartient le coupon
SELECT 
    c.code,
    r.partenaire_id,
    p.user_id,
    p.name
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE c.code = 'ECO-2026-XXXXX';

-- Connectez-vous avec le bon user_id du partenaire
```

### Erreur: "Ce coupon a déjà été utilisé"

**Cause:** Le coupon a déjà été validé.

**Solution (pour test seulement):**
```sql
USE db_recompense;
UPDATE coupon SET status = 'DISTRIBUE', valide_le = NULL WHERE code = 'ECO-2026-XXXXX';
```

---

## 📊 VÉRIFICATIONS RAPIDES

### Vérifier les services

```powershell
# Service-Utilisateur
curl.exe http://localhost:8082/api/users/1/points
# Doit retourner: {"totalPoints":500}

# Service-Recompense
curl.exe http://localhost:9093/api/recompenses
# Doit retourner: [liste des récompenses]
```

### Vérifier les données

```sql
-- Points du citoyen
USE db_utilisateur;
SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;

-- Partenaires
USE db_recompense;
SELECT id, user_id, name FROM partenaire;

-- Récompenses actives
SELECT id, title, points_necessaires, is_active FROM recompense WHERE is_active = true;

-- Derniers coupons
SELECT id, code, user_id, status, created_at FROM coupon ORDER BY created_at DESC LIMIT 5;
```

---

## 🎯 CHECKLIST COMPLÈTE

- [ ] MySQL tourne sur port 3307
- [ ] Service-Utilisateur tourne sur port 8082
- [ ] Service-Recompense tourne sur port 9093
- [ ] Le citoyen (auth_id=1) a au moins 100 points
- [ ] Un partenaire existe avec user_id=3
- [ ] Au moins une récompense existe et est active
- [ ] Le script de test réussit complètement
- [ ] L'échange fonctionne dans le frontend
- [ ] La validation fonctionne dans le frontend

---

## 💡 ASTUCE

Si vous voulez toujours avoir un environnement prêt, créez un script `reset-test-data.sql`:

```sql
-- Réinitialiser les données de test
USE db_utilisateur;
UPDATE citizens SET total_points = 500, points_disponibles = 500 WHERE auth_id = 1;

USE db_recompense;
DELETE FROM coupon WHERE user_id = 1;

SELECT 'Données réinitialisées - Prêt pour un nouveau test!' AS status;
```

---

## 📞 BESOIN D'AIDE?

Si le problème persiste:

1. Exécutez le script de test: `.\test-flux-echange.ps1`
2. Copiez la sortie complète (erreurs incluses)
3. Vérifiez les logs du service-recompense
4. Vérifiez la console du navigateur (F12)

---

**Créé le**: 2026-06-04  
**Temps estimé**: 5 minutes  
**Difficulté**: Facile ⭐
