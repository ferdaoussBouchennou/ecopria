# ⚡ SOLUTION RAPIDE - PROBLÈME COMMISSIONS

## 🎯 OBJECTIF
Faire en sorte que **chaque coupon validé génère automatiquement une commission**.

---

## 📋 ÉTAPES (5 MINUTES)

### 1️⃣ Diagnostic (1 min)

**Ouvrir phpMyAdmin:** http://localhost:8080

**Sélectionner:** `db_recompense`

**Onglet SQL** → Coller et exécuter:

```sql
-- Vérifier structure
DESCRIBE commissions;

-- Vérifier taux des partenaires
SELECT id, name, commission_rate FROM partenaires;

-- Vérifier récompenses
SELECT id, title, type, valeur_dh, discount_percentage 
FROM recompenses WHERE is_active = 1;
```

**👀 NOTER:**
- Est-ce que la colonne s'appelle `mois` ou `mois_facturation` ?
- Est-ce que `commission_rate` est NULL ou 0 pour certains partenaires ?
- Est-ce que `valeur_dh` est NULL pour certaines récompenses ?

---

### 2️⃣ Correction (2 min)

**Dans phpMyAdmin** (db_recompense) → **Onglet SQL**

**Copier TOUT le contenu** de: `corriger-commissions-simple.sql`

**⚠️ IMPORTANT:** Si à l'étape 1 la colonne s'appelle `mois` (et non `mois_facturation`):
- Ouvrir `corriger-commissions-simple.sql` dans un éditeur
- Remplacer toutes les occurrences de `mois_facturation` par `mois`
- Puis copier dans phpMyAdmin

**Exécuter** → Devrait créer les commissions manquantes

---

### 3️⃣ Test en Temps Réel (2 min)

**A. Redémarrer service-recompense**

```powershell
# Ctrl+C dans le terminal service-recompense
# Puis relancer:
cd C:\Users\user\Desktop\ecopria\backend\service-recompense
mvn spring-boot:run
```

**B. Valider un coupon**

1. **Frontend citoyen:** Échanger une récompense → Noter le code
2. **Frontend partenaire:** Scanner/valider ce code
3. **Terminal service-recompense:** Chercher dans les logs:

```
✅ Commission 7.5 DH calculée pour coupon ABC123 (base=75 DH)
```

OU

```
❌ Aucune commission calculée pour coupon ABC123 (offre gratuite...)
```

**C. Vérifier dans phpMyAdmin**

```sql
-- Dernière commission créée
SELECT * FROM commissions 
ORDER BY created_at DESC 
LIMIT 1;
```

**✅ DEVRAIT MONTRER:** partenaire_id, coupon_id, valeur_dh, montant_commission, taux_commission

---

## 🐛 SI ÇA NE MARCHE PAS

### Problème A: Erreur SQL "Unknown column 'mois'"

**Solution:**  
La colonne s'appelle `mois_facturation` dans votre base.  
C'est déjà corrigé dans `corriger-commissions-simple.sql` ✅

### Problème B: Erreur SQL "Unknown column 'mois_facturation'"

**Solution:**  
La colonne s'appelle `mois` dans votre base.

**Dans `corriger-commissions-simple.sql`**, remplacer:
```sql
mois_facturation
```
Par:
```sql
mois
```

### Problème C: "Aucune commission calculée" dans les logs

**Étape 1:** Vérifier le partenaire

```sql
SELECT id, name, commission_rate 
FROM partenaires 
WHERE user_id = <USER_ID_DU_PARTENAIRE>;
```

Si `commission_rate` = NULL ou 0:

```sql
UPDATE partenaires 
SET commission_rate = 10.0 
WHERE id = <ID>;
```

**Étape 2:** Vérifier la récompense

```sql
SELECT id, title, type, valeur_dh, discount_percentage 
FROM recompenses 
WHERE id = <ID>;
```

Si `valeur_dh` = NULL:

```sql
UPDATE recompenses 
SET valeur_dh = 100.0,
    discount_percentage = 100
WHERE id = <ID>;
```

**Étape 3:** Redémarrer service-recompense et retester

### Problème D: Commission = 0.00 DH

**C'est peut-être normal** si:
- Le `taux_commission` du partenaire = 0
- L'offre est vraiment gratuite sans valeur monétaire

**Sinon, vérifier le calcul:**

```sql
SELECT 
    r.title,
    r.type,
    r.valeur_dh as base,
    r.discount_percentage as remise,
    p.commission_rate as taux,
    -- Calcul attendu
    CASE 
        WHEN r.type = 'REDUCTION' 
        THEN r.valeur_dh * p.commission_rate / 100.0
        ELSE (r.valeur_dh * r.discount_percentage / 100.0) * p.commission_rate / 100.0
    END as commission_attendue
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE r.id = <ID>;
```

---

## ✅ VÉRIFICATION FINALE

**Tous les coupons validés doivent avoir leur commission:**

```sql
SELECT 
    c.code,
    r.title,
    p.name as partenaire,
    com.montant_commission as commission,
    CASE 
        WHEN com.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ MANQUANTE'
    END as Status
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
ORDER BY c.valide_le DESC;
```

**Résultat attendu:** Tous les coupons avec Status = ✅ OK

---

## 📊 FORMULES DE CALCUL

### Type REDUCTION (ex: -15% sur facture)

```
Base Commission = valeur_dh
Commission = Base × taux_commission / 100

Exemple: valeur_dh = 50 DH, taux = 10%
→ Commission = 50 × 10 / 100 = 5 DH
```

### Autres Types (STOCK, SERVICE, EXPERIENCE)

```
Base Commission = valeur_dh × discount_percentage / 100
Commission = Base × taux_commission / 100

Exemple: T-shirt 150 DH à -50%, taux = 10%
→ Base = 150 × 50 / 100 = 75 DH
→ Commission = 75 × 10 / 100 = 7.5 DH
```

---

## 🔗 FICHIERS IMPORTANTS

1. **diagnostic-commissions.sql** → Comprendre l'état actuel
2. **corriger-commissions-simple.sql** → Corriger les données
3. **EXECUTER-DANS-CET-ORDRE.md** → Guide détaillé
4. **RESOUDRE-PROBLEME-COMMISSIONS.md** → Documentation complète

---

## 💡 RAPPEL

**Le code Java fonctionne déjà!** Le problème vient des données manquantes:
- ❌ Partenaires sans `commission_rate`
- ❌ Récompenses sans `valeur_dh`

**Après correction des données:**
- ✅ Les nouvelles validations créeront des commissions automatiquement
- ✅ Les anciennes validations auront leurs commissions recalculées

---

## 📞 BESOIN D'AIDE ?

Exécutez:
```powershell
.\tester-commissions.ps1
```

Ou fournissez:
1. Résultat de `DESCRIBE commissions;`
2. Logs du service-recompense lors de la validation
3. Screenshot d'une récompense dans phpMyAdmin
4. Screenshot d'un partenaire dans phpMyAdmin
