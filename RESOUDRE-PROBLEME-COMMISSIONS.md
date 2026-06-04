# 🔧 Résoudre le Problème des Commissions

**Problème:** Les commissions ne sont pas calculées lors de la validation des coupons

**Causes possibles:**
1. ❌ Partenaires sans `commission_rate` (NULL ou 0)
2. ❌ Récompenses sans `valeur_dh` ou `discount_percentage`
3. ❌ Coupons validés avant l'implémentation (pas de calcul rétroactif)

---

## ✅ SOLUTION RAPIDE

### Étape 1: Exécuter le Script SQL de Correction

1. Ouvrir phpMyAdmin: http://localhost:8080
2. Sélectionner la base de données: **db_recompense**
3. Aller dans l'onglet **SQL**
4. Copier tout le contenu de: `verifier-et-corriger-commissions.sql`
5. Cliquer sur **Exécuter**

✅ Le script va:
- ✅ Définir un taux de commission de 10% pour tous les partenaires
- ✅ Corriger les valeurs manquantes des récompenses
- ✅ Recalculer les commissions pour tous les coupons validés
- ✅ Afficher un résumé complet

### Étape 2: Vérifier que ça Fonctionne

**Test 1: Valider un nouveau coupon**

1. Aller dans l'espace partenaire
2. Scanner ou saisir un code coupon
3. Valider le coupon
4. Vérifier dans phpMyAdmin:

```sql
SELECT 
    p.name as Partenaire,
    c.code as Coupon,
    com.montant_commission as 'Commission DH',
    com.created_at as Date
FROM commissions com
JOIN partenaires p ON com.partenaire_id = p.id
JOIN coupons c ON com.coupon_id = c.id
ORDER BY com.created_at DESC
LIMIT 5;
```

**Vous devriez voir la nouvelle commission! ✅**

**Test 2: Vérifier le Dashboard**

1. Aller dans le dashboard partenaire
2. Vérifier la section "Commissions à régler"
3. Le montant devrait être affiché

---

## 📊 COMMENT ÇA MARCHE

### Logique de Calcul (dans `RecompenseService.validerCoupon()`)

```java
// 1. Déterminer la base de commission
Double baseCommission = null;

if (recompense.getType() == REDUCTION) {
    // Pour REDUCTION: valeur_dh est déjà la valeur de la remise
    baseCommission = recompense.getValeurDh();
    // Exemple: Réduction 15% sur une facture (valeur_dh = 50 DH)
    // → base = 50 DH
}
else if (recompense.getDiscountPercentage() != null && recompense.getValeurDh() != null) {
    // Pour STOCK/SERVICE/EXPERIENCE avec réduction
    baseCommission = recompense.getValeurDh() * recompense.getDiscountPercentage() / 100.0;
    // Exemple: T-shirt 150 DH à -50%
    // → base = 150 * 50 / 100 = 75 DH
}

// 2. Calculer la commission
if (baseCommission != null) {
    double montant = baseCommission * partenaire.getCommissionRate() / 100;
    // Exemple: base = 75 DH, taux = 10%
    // → commission = 75 * 10 / 100 = 7.5 DH
    
    // 3. Enregistrer dans la table commissions
    Commission commission = Commission.builder()
        .partenaire(partenaire)
        .coupon(coupon)
        .valeurDh(baseCommission)
        .montantCommission(montant)
        .tauxCommission(partenaire.getCommissionRate())
        .build();
    
    commissionRepository.save(commission);
}
```

### Exemples Concrets

| Type | Valeur DH | Remise % | Base Commission | Taux | Commission |
|------|-----------|----------|-----------------|------|------------|
| STOCK (T-shirt gratuit) | 150 | 100 | 150 | 10% | **15 DH** |
| STOCK (T-shirt -50%) | 150 | 50 | 75 | 10% | **7.5 DH** |
| REDUCTION (15% facture) | 50 | 15 | 50 | 10% | **5 DH** |
| SERVICE (Spa gratuit) | 200 | 100 | 200 | 10% | **20 DH** |

---

## 🐛 DÉPANNAGE

### Problème 1: "Aucune commission calculée"

**Vérifier dans les logs du service-recompense:**

```
Aucune commission calculée pour coupon ABC123 (offre gratuite sans remise monétaire)
```

**Causes:**
- `valeur_dh` = NULL → Exécuter le script SQL
- `discount_percentage` = NULL ET type ≠ REDUCTION → Définir une valeur

**Solution:**
```sql
-- Définir valeur_dh pour une récompense
UPDATE recompenses 
SET valeur_dh = 150.0, 
    discount_percentage = 100
WHERE id = 1;
```

### Problème 2: "Commission = 0 DH"

**Vérifier le taux de commission du partenaire:**

```sql
SELECT name, commission_rate 
FROM partenaires 
WHERE id = 1;
```

**Si `commission_rate` = NULL ou 0:**

```sql
UPDATE partenaires 
SET commission_rate = 10.0 
WHERE id = 1;
```

### Problème 3: "Les anciennes commissions manquent"

**C'est normal!** Les commissions ne sont calculées que lors de la validation.

**Solution:** Exécuter la section 8 du script SQL:

```sql
-- RECALCULER LES COMMISSIONS MANQUANTES
INSERT INTO commissions (...)
SELECT ...
FROM coupons c
...
WHERE c.status = 'UTILISE'
  AND com.id IS NULL  -- Pas encore de commission
```

---

## 📈 REQUÊTES UTILES

### Voir les commissions d'un partenaire

```sql
SELECT 
    DATE_FORMAT(com.created_at, '%Y-%m-%d') as Date,
    c.code as Coupon,
    r.title as Récompense,
    com.valeur_dh as 'Base DH',
    com.montant_commission as 'Commission DH'
FROM commissions com
JOIN coupons c ON com.coupon_id = c.id
JOIN recompenses r ON c.recompense_id = r.id
WHERE com.partenaire_id = 1
ORDER BY com.created_at DESC;
```

### Résumé mensuel

```sql
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as Mois,
    COUNT(*) as 'Nb Coupons',
    SUM(valeur_dh) as 'CA Total',
    SUM(montant_commission) as 'Commission Totale'
FROM commissions
WHERE partenaire_id = 1
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY Mois DESC;
```

### Voir les coupons sans commission

```sql
SELECT 
    c.code,
    r.title,
    c.valide_le
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
  AND com.id IS NULL
  AND r.partenaire_id = 1;
```

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de valider un coupon, vérifier:

- [ ] Le partenaire a un `commission_rate` > 0
- [ ] La récompense a une `valeur_dh` définie
- [ ] Si c'est une réduction partielle, `discount_percentage` est défini
- [ ] Le service-recompense est bien démarré
- [ ] Les logs ne montrent pas d'erreur

Après validation d'un coupon:

- [ ] La commission apparaît dans la table `commissions`
- [ ] Le montant est correct (base × taux %)
- [ ] Le dashboard affiche le bon total
- [ ] Les logs confirment: "Commission X DH calculée pour coupon Y"

---

## 🎯 RÉSUMÉ

1. **Exécuter `verifier-et-corriger-commissions.sql`** → Corrige toutes les données
2. **Valider un nouveau coupon** → Vérifier qu'une commission est créée
3. **Vérifier le dashboard** → Le montant doit s'afficher

**Si ça ne fonctionne toujours pas:**
- Vérifier les logs du service-recompense
- Chercher: "Commission" ou "validerCoupon"
- Envoyer les logs pour diagnostic

---

## 📞 AIDE SUPPLÉMENTAIRE

**Script SQL:** `verifier-et-corriger-commissions.sql`  
**Code source:** `backend/service-recompense/.../RecompenseService.java` (ligne 450-530)  
**Table:** `commissions` dans `db_recompense`

**Structure de la table commissions:**
```sql
CREATE TABLE commissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    partenaire_id BIGINT NOT NULL,
    coupon_id BIGINT NOT NULL,
    valeur_dh DECIMAL(10,2),      -- Base de calcul
    montant_commission DECIMAL(10,2), -- Commission calculée
    taux_commission DECIMAL(5,2),    -- Taux appliqué (%)
    mois VARCHAR(7),                 -- Format: 2026-06
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

