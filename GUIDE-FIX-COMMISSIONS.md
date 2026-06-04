# 🔧 Guide : Corriger le Calcul des Commissions

## 🎯 Problème

Les commissions affichées ne correspondent pas au calcul attendu basé sur le taux de commission du partenaire.

**Exemple visible dans l'image :**
- 3 coupons utilisés
- CA généré : 8 DH  
- Commission : 10 DH ❌ (ne devrait pas être supérieur au CA)

## 🔍 Causes Possibles

1. ❌ Le taux de commission du partenaire n'est pas défini (NULL ou 0)
2. ❌ Les commissions ne sont pas créées lors de la validation des coupons
3. ❌ Le calcul de la base de commission est incorrect
4. ❌ Les anciennes commissions ont été mal calculées

## ✅ Solution

### Étape 1 : Ouvrir MySQL/phpMyAdmin

**Option A : phpMyAdmin**
```
1. Ouvrir : http://localhost/phpmyadmin
2. Se connecter (user: root, password: votre mot de passe)
3. Sélectionner la base: ecopria_recompense
4. Aller dans l'onglet "SQL"
```

**Option B : MySQL Workbench**
```
1. Ouvrir MySQL Workbench
2. Se connecter à votre serveur MySQL
3. Sélectionner la base: ecopria_recompense
```

**Option C : Ligne de commande**
```bash
# Ouvrir PowerShell
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"  # Adapter selon votre installation
.\mysql.exe -u root -p

# Puis dans MySQL:
USE ecopria_recompense;
```

### Étape 2 : Exécuter le Script de Diagnostic

Copier-coller le contenu du fichier `FIX-COMMISSIONS-CALCUL.sql` dans l'interface SQL.

**Sections importantes du script :**

#### Section 3 : Vérifier les taux de commission
```sql
SELECT 
    id,
    name,
    commission_rate AS taux_commission
FROM partenaire;
```

**Résultat attendu :**
```
| id | name              | taux_commission |
|----|-------------------|-----------------|
| 1  | Coffee Botanique  | 15.0            |
```

**Si taux_commission est NULL ou 0 :**
```sql
UPDATE partenaire 
SET commission_rate = 15.0 
WHERE id = 1;  -- Remplacer 1 par l'ID du partenaire
```

#### Section 6 : Voir les commissions existantes
```sql
SELECT 
    c.id,
    p.name AS partenaire,
    co.code AS code_coupon,
    c.valeur_dh AS valeur_base_dh,
    c.taux_commission AS taux_pourcent,
    c.montant_commission AS commission_dh,
    c.mois_facturation AS mois
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
JOIN coupon co ON c.coupon_id = co.id
ORDER BY c.created_at DESC;
```

#### Section 7 : Vérifier les calculs
Cette section vérifie si les commissions stockées sont correctes :
```sql
commission_attendue = valeur_base × taux / 100
```

#### Section 9 : Trouver les coupons sans commission
Liste tous les coupons validés qui n'ont PAS de commission enregistrée.

#### Section 10 : Créer les commissions manquantes ⚠️
**ATTENTION** : Cette requête INSERT va créer automatiquement les commissions manquantes.

```sql
INSERT INTO commissions (...)
SELECT ...
FROM coupon co
WHERE co.status = 'UTILISE'
  AND co.id NOT IN (SELECT coupon_id FROM commissions);
```

### Étape 3 : Corriger le Taux de Commission

Si le partenaire n'a pas de taux défini :

```sql
-- Voir les taux actuels
SELECT id, name, commission_rate FROM partenaire;

-- Mettre à jour le taux (exemple : 15%)
UPDATE partenaire 
SET commission_rate = 15.0 
WHERE name = 'Coffee Botanique';

-- Vérifier
SELECT id, name, commission_rate FROM partenaire;
```

### Étape 4 : Recalculer les Commissions

**Option A : Supprimer et recréer toutes les commissions**

⚠️ **ATTENTION** : Cela supprime TOUTES les commissions existantes.

```sql
-- 1. Sauvegarder d'abord (optionnel)
CREATE TABLE commissions_backup AS SELECT * FROM commissions;

-- 2. Supprimer les anciennes commissions
DELETE FROM commissions;

-- 3. Recréer avec le bon calcul (Section 10 du script)
INSERT INTO commissions (
    partenaire_id,
    coupon_id,
    valeur_dh,
    montant_commission,
    taux_commission,
    mois_facturation,
    created_at
)
SELECT 
    p.id AS partenaire_id,
    co.id AS coupon_id,
    CASE 
        WHEN r.type = 'REDUCTION' THEN r.valeur_dh
        ELSE ROUND(r.valeur_dh * r.discount_percentage / 100, 2)
    END AS valeur_dh,
    CASE 
        WHEN r.type = 'REDUCTION' 
            THEN ROUND(r.valeur_dh * p.commission_rate / 100, 2)
        ELSE ROUND((r.valeur_dh * r.discount_percentage / 100) * p.commission_rate / 100, 2)
    END AS montant_commission,
    p.commission_rate AS taux_commission,
    DATE_FORMAT(COALESCE(co.valide_le, co.created_at), '%Y-%m') AS mois_facturation,
    COALESCE(co.valide_le, co.created_at) AS created_at
FROM coupon co
JOIN recompense r ON co.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE co.status = 'UTILISE'
  AND (
      (r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL)
      OR (r.discount_percentage IS NOT NULL AND r.valeur_dh IS NOT NULL)
  )
  AND p.commission_rate > 0;

-- 4. Vérifier
SELECT COUNT(*) AS nb_commissions FROM commissions;
```

**Option B : Ne créer que les commissions manquantes**

```sql
-- Exécuter la section 10 du script FIX-COMMISSIONS-CALCUL.sql
-- Cela créera uniquement les commissions pour les coupons qui n'en ont pas
```

### Étape 5 : Vérifier le Résultat

```sql
-- Résumé par mois
SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS coupons,
    SUM(c.valeur_dh) AS ca_dh,
    SUM(c.montant_commission) AS commission_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.id, c.mois_facturation
ORDER BY c.mois_facturation DESC;
```

**Résultat attendu :**
```
| partenaire        | mois    | coupons | ca_dh | commission_dh |
|-------------------|---------|---------|-------|---------------|
| Coffee Botanique  | 2026-06 | 3       | 90.00 | 13.50         |
```

Si taux = 15% et CA = 90 DH :
```
Commission = 90 × 15 / 100 = 13.50 DH ✅
```

### Étape 6 : Tester dans le Frontend

```
1. Ouvrir : http://localhost:4200/partenaire/commissions
2. Recharger la page (F5)
3. Vérifier :
   ✅ Banner affiche le bon montant
   ✅ Carte "Commission Juin 2026" correcte
   ✅ Tableau historique correct
   ✅ CA × Taux = Commission
```

## 📊 Formule de Calcul

### Type REDUCTION
```
Offre : Réduction de 20 DH
Taux partenaire : 15%

Base commission = 20 DH
Commission = 20 × 15 / 100 = 3.00 DH
```

### Type STOCK avec pourcentage
```
Offre : T-shirt 150 DH à -50%
Taux partenaire : 15%

Base commission = 150 × 50 / 100 = 75 DH
Commission = 75 × 15 / 100 = 11.25 DH
```

### Type Gratuit (100%)
```
Offre : Café gratuit (valeur 30 DH, réduction 100%)
Taux partenaire : 15%

Base commission = 30 × 100 / 100 = 30 DH
Commission = 30 × 15 / 100 = 4.50 DH
```

## 🐛 Problèmes Courants

### Problème 1 : Commission = 0
**Cause :** Taux de commission = 0 ou NULL

**Solution :**
```sql
UPDATE partenaire 
SET commission_rate = 15.0 
WHERE commission_rate IS NULL OR commission_rate = 0;
```

### Problème 2 : Pas de commission créée
**Cause :** L'offre n'a pas de `valeur_dh` ou `discount_percentage`

**Solution :**
```sql
-- Voir les offres sans valeur
SELECT id, title, type, valeur_dh, discount_percentage
FROM recompense
WHERE is_active = TRUE
  AND (
      (type = 'REDUCTION' AND valeur_dh IS NULL)
      OR (type != 'REDUCTION' AND (valeur_dh IS NULL OR discount_percentage IS NULL))
  );

-- Mettre à jour les valeurs manquantes
UPDATE recompense 
SET valeur_dh = 30.0, discount_percentage = 100 
WHERE id = 1;  -- Remplacer par l'ID de l'offre
```

### Problème 3 : Commission > CA
**Cause :** Erreur dans le calcul ou les données

**Solution :**
```sql
-- Trouver les commissions incorrectes
SELECT 
    c.id,
    p.name,
    c.valeur_dh AS base,
    c.montant_commission AS commission,
    CASE 
        WHEN c.montant_commission > c.valeur_dh 
        THEN '❌ Commission supérieure à la base!'
        ELSE '✅ OK'
    END AS validation
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
WHERE c.montant_commission > c.valeur_dh;

-- Supprimer et recréer (voir Étape 4)
```

## ✅ Checklist de Validation

- [ ] Taux de commission du partenaire défini (ex: 15%)
- [ ] Commissions créées pour tous les coupons validés
- [ ] Formule correcte : `commission = base × taux / 100`
- [ ] Commission ≤ Base (jamais supérieure)
- [ ] Résumé mensuel correct dans le frontend
- [ ] Banner affiche le bon montant pour le mois en cours
- [ ] Carte en évidence affiche le bon montant

## 🚀 Après la Correction

1. Recharger le frontend : `http://localhost:4200/partenaire/commissions`
2. Appuyer sur F5 pour rafraîchir les données
3. Vérifier que les montants sont corrects
4. Valider un nouveau coupon pour tester le calcul en temps réel

---

**Fichiers Créés :**
- `FIX-COMMISSIONS-CALCUL.sql` - Script SQL complet
- `GUIDE-FIX-COMMISSIONS.md` - Ce guide

**Temps estimé :** 10-15 minutes
