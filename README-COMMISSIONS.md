# 💰 SYSTÈME DE COMMISSIONS - GUIDE COMPLET

## 📁 FICHIERS DISPONIBLES

### 🎯 Pour Résoudre le Problème (COMMENCEZ ICI)

1. **SOLUTION-COMMISSIONS-RAPIDE.md** ⭐
   - Guide ultra-rapide (5 minutes)
   - Étapes essentielles uniquement
   - **RECOMMANDÉ POUR DÉMARRER**

2. **EXECUTER-DANS-CET-ORDRE.md**
   - Guide détaillé étape par étape
   - Explications complètes
   - Dépannage inclus

3. **RESOUDRE-PROBLEME-COMMISSIONS.md**
   - Documentation technique complète
   - Toutes les requêtes SQL utiles
   - Exemples de calcul

### 🔧 Scripts SQL

1. **diagnostic-commissions.sql**
   - À exécuter EN PREMIER
   - Affiche l'état actuel de la base
   - Identifie les problèmes

2. **corriger-commissions-simple.sql**
   - Corrige les données manquantes
   - Recalcule les commissions
   - À exécuter APRÈS le diagnostic

### 🧪 Scripts de Test

1. **tester-commissions.ps1**
   - Guide interactif
   - Vérifie la configuration
   - Aide au diagnostic

---

## ⚡ DÉMARRAGE RAPIDE (2 MINUTES)

### Option 1: Tout Automatique

```powershell
# Lance le guide interactif
.\tester-commissions.ps1
```

Puis suivez les instructions à l'écran.

### Option 2: Manuel

1. **Ouvrir:** `SOLUTION-COMMISSIONS-RAPIDE.md`
2. **Suivre** les 3 étapes
3. **Tester** avec un coupon

---

## 🎓 COMMENT ÇA MARCHE

### Principe

Quand un partenaire **valide un coupon**, une **commission** est calculée automatiquement:

```
Commission = Base × Taux / 100
```

**La base dépend du type d'offre:**

- **REDUCTION:** Base = `valeur_dh`
- **Autres types:** Base = `valeur_dh × discount_percentage / 100`

### Exemple 1: T-shirt Gratuit

```
Type: STOCK
Valeur: 150 DH
Remise: 100% (gratuit)
Taux partenaire: 10%

Base = 150 × 100 / 100 = 150 DH
Commission = 150 × 10 / 100 = 15 DH ✅
```

### Exemple 2: T-shirt -50%

```
Type: STOCK
Valeur: 150 DH
Remise: 50%
Taux partenaire: 10%

Base = 150 × 50 / 100 = 75 DH
Commission = 75 × 10 / 100 = 7.5 DH ✅
```

### Exemple 3: Réduction 15%

```
Type: REDUCTION
Valeur: 50 DH (valeur moyenne de la remise)
Taux partenaire: 10%

Base = 50 DH
Commission = 50 × 10 / 100 = 5 DH ✅
```

---

## 🐛 PROBLÈMES COURANTS

### ❌ "Aucune commission calculée"

**Causes possibles:**

1. **Partenaire sans taux**
   ```sql
   SELECT commission_rate FROM partenaires WHERE id = X;
   -- Si NULL ou 0 → Problème!
   ```

2. **Récompense sans valeur**
   ```sql
   SELECT valeur_dh FROM recompenses WHERE id = X;
   -- Si NULL → Problème!
   ```

3. **Récompense sans pourcentage** (types autres que REDUCTION)
   ```sql
   SELECT discount_percentage FROM recompenses WHERE id = X;
   -- Si NULL → Problème!
   ```

**Solution:** Exécuter `corriger-commissions-simple.sql`

### ❌ Erreur SQL "Unknown column"

**Erreur:** `Unknown column 'mois'` ou `Unknown column 'mois_facturation'`

**Cause:** Le nom de la colonne diffère selon la version

**Solution:** 
1. Vérifier avec `DESCRIBE commissions;`
2. Adapter le script SQL en conséquence

### ❌ Commission = 0 DH

**C'est normal si:**
- Taux du partenaire = 0%
- Offre sans valeur monétaire

**Sinon:** Vérifier les valeurs avec les requêtes dans `SOLUTION-COMMISSIONS-RAPIDE.md`

---

## 📊 REQUÊTES UTILES

### Voir toutes les commissions

```sql
SELECT 
    p.name as Partenaire,
    c.code as Coupon,
    r.title as Récompense,
    com.valeur_dh as Base,
    com.taux_commission as Taux,
    com.montant_commission as Commission,
    com.created_at as Date
FROM commissions com
JOIN partenaires p ON com.partenaire_id = p.id
JOIN coupons c ON com.coupon_id = c.id
JOIN recompenses r ON c.recompense_id = r.id
ORDER BY com.created_at DESC;
```

### Résumé par partenaire

```sql
SELECT 
    p.name,
    COUNT(com.id) as 'Nb Coupons',
    ROUND(SUM(com.valeur_dh), 2) as 'CA Total',
    ROUND(SUM(com.montant_commission), 2) as 'Commission'
FROM partenaires p
LEFT JOIN commissions com ON com.partenaire_id = p.id
GROUP BY p.id, p.name;
```

### Coupons sans commission

```sql
SELECT 
    c.code,
    r.title,
    p.name,
    c.valide_le
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL;
```

---

## 📍 ARCHITECTURE

### Tables Concernées

```
partenaires
├── id
├── name
└── commission_rate (%)    ← IMPORTANT

recompenses
├── id
├── title
├── type
├── valeur_dh              ← IMPORTANT
└── discount_percentage    ← IMPORTANT

coupons
├── id
├── code
├── status
├── recompense_id
└── valide_le

commissions
├── id
├── partenaire_id
├── coupon_id
├── valeur_dh              (base de calcul)
├── montant_commission     (résultat)
├── taux_commission        (taux appliqué)
└── created_at
```

### Workflow

```
1. Citoyen échange points → Coupon créé (status: DISTRIBUE)
2. Partenaire scanne coupon → validerCoupon() appelé
3. Service calcule commission → Si valeur_dh ET taux existent
4. Commission enregistrée → Table commissions
5. Dashboard mis à jour → Affiche total commissions
```

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de valider un coupon:

- [ ] Service-recompense démarré
- [ ] Partenaire a `commission_rate` > 0
- [ ] Récompense a `valeur_dh` définie
- [ ] Si type ≠ REDUCTION, `discount_percentage` défini

Après validation:

- [ ] Log "Commission X DH calculée" visible
- [ ] Entrée dans table `commissions` créée
- [ ] Dashboard affiche le bon total

---

## 🎯 OBJECTIF FINAL

**AVANT:**
```
Coupon validé → ❌ Pas de commission
Dashboard → ❌ Total = 0 DH
```

**APRÈS:**
```
Coupon validé → ✅ Commission calculée automatiquement
Dashboard → ✅ Total correct affiché
Historique → ✅ Toutes les validations visibles
```

---

## 📞 SUPPORT

### Fichiers à Lire

1. **Problème urgent:** `SOLUTION-COMMISSIONS-RAPIDE.md`
2. **Guide complet:** `EXECUTER-DANS-CET-ORDRE.md`
3. **Documentation:** `RESOUDRE-PROBLEME-COMMISSIONS.md`

### Scripts à Exécuter

1. **Diagnostic:** `diagnostic-commissions.sql` (dans phpMyAdmin)
2. **Correction:** `corriger-commissions-simple.sql` (dans phpMyAdmin)
3. **Test:** `.\tester-commissions.ps1` (dans PowerShell)

### Information à Fournir (si bloqué)

1. Résultat de `DESCRIBE commissions;`
2. Logs du service-recompense lors de la validation
3. Screenshot d'une récompense dans phpMyAdmin
4. Screenshot d'un partenaire dans phpMyAdmin

---

**COMMENCEZ PAR:** `SOLUTION-COMMISSIONS-RAPIDE.md` ⭐
