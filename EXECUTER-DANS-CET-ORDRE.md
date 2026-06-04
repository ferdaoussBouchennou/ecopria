# 🔧 RÉSOLUTION PROBLÈME COMMISSIONS - ORDRE D'EXÉCUTION

## ⚠️ IMPORTANT: Exécuter dans cet ordre!

### Étape 1: Diagnostic 🔍
**Fichier:** `diagnostic-commissions.sql`  
**But:** Comprendre l'état actuel de la base de données

1. Ouvrir phpMyAdmin: http://localhost:8080
2. Sélectionner: `db_recompense`
3. Onglet SQL
4. Copier/coller le contenu de `diagnostic-commissions.sql`
5. Exécuter
6. **NOTER les résultats**, surtout:
   - Structure de la table `commissions` (noms des colonnes)
   - Coupons sans commission + la raison

### Étape 2: Correction des Données 🛠️
**Fichier:** `corriger-commissions-simple.sql`  
**But:** Corriger les partenaires, récompenses et recalculer les commissions

1. Rester dans phpMyAdmin (db_recompense)
2. Onglet SQL
3. Copier/coller le contenu de `corriger-commissions-simple.sql`
4. Exécuter **TOUT LE SCRIPT EN UNE FOIS**
5. Vérifier le résumé à la fin

### Étape 3: Test en Temps Réel 🧪

**A. Redémarrer le service-recompense**

```powershell
# Arrêter le service
# Ctrl+C dans le terminal où il tourne

# Relancer
cd C:\Users\user\Desktop\ecopria\backend\service-recompense
mvn spring-boot:run
```

**B. Tester la validation d'un coupon**

1. Espace citoyen: Échanger une récompense
2. Noter le code coupon (ex: ABC123)
3. Espace partenaire: Valider ce coupon
4. **REGARDER LES LOGS** dans le terminal service-recompense

Vous devriez voir:
```
Commission X DH calculée pour coupon ABC123 (base=Y DH)
```

**C. Vérifier dans phpMyAdmin**

```sql
SELECT * FROM commissions 
ORDER BY created_at DESC 
LIMIT 1;
```

### Étape 4: Vérification Finale ✅

Dans phpMyAdmin:

```sql
-- Tous les coupons doivent avoir leur commission
SELECT 
    c.code,
    r.title,
    CASE 
        WHEN com.id IS NOT NULL THEN '✅ Commission OK'
        ELSE '❌ PAS DE COMMISSION'
    END as Status,
    com.montant_commission as 'Commission DH'
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
LEFT JOIN commissions com ON com.coupon_id = c.id
WHERE c.status = 'UTILISE'
ORDER BY c.valide_le DESC;
```

---

## 🐛 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Problème: Erreur SQL dans corriger-commissions-simple.sql

**Erreur de colonne `mois`:**

Si vous voyez une erreur comme:
```
Unknown column 'mois' in 'field list'
```

La colonne s'appelle probablement `mois_facturation`. Modifiez le script:

Remplacer TOUTES les occurrences de:
```sql
mois
```

Par:
```sql
mois_facturation
```

### Problème: "Aucune commission calculée" dans les logs

**1. Vérifier le partenaire:**
```sql
SELECT id, name, commission_rate 
FROM partenaires 
WHERE user_id = <ID_DU_USER>;
```

Si `commission_rate` = 0 ou NULL:
```sql
UPDATE partenaires 
SET commission_rate = 10.0 
WHERE id = <ID>;
```

**2. Vérifier la récompense:**
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

**3. Redémarrer le service-recompense après modification**

### Problème: Commission = 0 DH

C'est normal si:
- L'offre est 100% gratuite (valeur_dh existe mais pas de réduction monétaire)
- Le taux du partenaire = 0%

Sinon, vérifier les calculs manuellement:

```sql
SELECT 
    r.type,
    r.valeur_dh,
    r.discount_percentage,
    p.commission_rate,
    -- Pour REDUCTION
    CASE WHEN r.type = 'REDUCTION' 
    THEN r.valeur_dh * p.commission_rate / 100.0 
    ELSE NULL END as commission_reduction,
    -- Pour autres types
    CASE WHEN r.type != 'REDUCTION' 
    THEN (r.valeur_dh * r.discount_percentage / 100.0) * p.commission_rate / 100.0
    ELSE NULL END as commission_autre
FROM recompenses r
JOIN partenaires p ON r.partenaire_id = p.id
WHERE r.id = <ID>;
```

---

## 📞 INFORMATION À FOURNIR SI LE PROBLÈME PERSISTE

1. **Résultat de diagnostic-commissions.sql** (surtout la structure de la table)
2. **Logs du service-recompense** lors de la validation
3. **Copie d'écran** de la récompense concernée dans phpMyAdmin
4. **Copie d'écran** du partenaire concerné dans phpMyAdmin

---

## ✅ CHECKLIST

- [ ] Étape 1: diagnostic-commissions.sql exécuté
- [ ] Vérifier: La colonne s'appelle `mois` ou `mois_facturation` ?
- [ ] Étape 2: corriger-commissions-simple.sql exécuté (adapté si besoin)
- [ ] Vérifier: Tous les partenaires ont commission_rate = 10.0
- [ ] Vérifier: Toutes les récompenses ont valeur_dh remplie
- [ ] Étape 3: Service-recompense redémarré
- [ ] Étape 3: Nouveau coupon validé
- [ ] Étape 3: Log "Commission X DH calculée" visible
- [ ] Étape 4: Commission visible dans phpMyAdmin
- [ ] Étape 4: Dashboard partenaire affiche le total

---

**DÉBUT PAR L'ÉTAPE 1 (DIAGNOSTIC) !**
