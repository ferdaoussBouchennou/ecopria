# ⚡ Action Rapide : Corriger les Commissions

## 🎯 Problème Identifié

Les commissions dans la base de données sont **mal calculées** :

**Exemple :**
- Commission ID 1 :
  - Valeur base : 150 DH
  - Taux : 15%
  - Commission stockée : **10 DH** ❌
  - **Devrait être : 150 × 15 / 100 = 22.5 DH**

## ✅ Solution en 3 Minutes

### Étape 1 : Ouvrir phpMyAdmin

```
1. Aller sur : http://localhost/phpmyadmin
2. Se connecter (root + mot de passe)
3. Cliquer sur la base : ecopria_recompense (à gauche)
4. Cliquer sur l'onglet "SQL" (en haut)
```

### Étape 2 : Exécuter le Script de Correction

**Copier-coller ce code dans la zone SQL et cliquer "Exécuter" :**

```sql
USE ecopria_recompense;

-- 1. Voir les commissions incorrectes
SELECT 
    c.id,
    p.name AS partenaire,
    c.valeur_dh AS base,
    c.taux_commission AS taux,
    c.montant_commission AS actuelle,
    ROUND(c.valeur_dh * c.taux_commission / 100, 2) AS correcte,
    CASE 
        WHEN ABS(c.montant_commission - (c.valeur_dh * c.taux_commission / 100)) > 0.01
        THEN '❌ À CORRIGER'
        ELSE '✅ OK'
    END AS status
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
ORDER BY c.id;

-- 2. CORRIGER TOUTES LES COMMISSIONS
UPDATE commissions
SET montant_commission = ROUND(valeur_dh * taux_commission / 100, 2)
WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) > 0.01;

-- 3. Vérifier le résultat
SELECT 
    c.id,
    p.name AS partenaire,
    c.valeur_dh AS base,
    c.taux_commission AS taux,
    c.montant_commission AS commission,
    CONCAT(c.valeur_dh, ' × ', c.taux_commission, '% = ', c.montant_commission, ' DH') AS calcul
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
ORDER BY c.id;

-- 4. Résumé par mois
SELECT 
    p.name AS partenaire,
    c.mois_facturation AS mois,
    COUNT(c.id) AS coupons,
    SUM(c.valeur_dh) AS ca_dh,
    SUM(c.montant_commission) AS commission_dh
FROM commissions c
JOIN partenaire p ON c.partenaire_id = p.id
GROUP BY p.name, c.mois_facturation
ORDER BY c.mois_facturation DESC;
```

### Étape 3 : Vérifier le Résultat

**Résultats attendus après la correction :**

| ID | Partenaire | Base | Taux | Commission | Calcul |
|----|------------|------|------|------------|--------|
| 1  | Café Botanique | 150 | 15 | **22.5** | 150 × 15% = 22.5 DH ✅ |
| 2  | ? | 35 | 15 | **5.25** | 35 × 15% = 5.25 DH ✅ |
| 3  | ? | 8 | 10 | **0.8** | 8 × 10% = 0.8 DH ✅ |
| 4  | ? | 0 | 10 | **0** | 0 × 10% = 0 DH ✅ |
| 5  | ? | 0 | 10 | **0** | 0 × 10% = 0 DH ✅ |

### Étape 4 : Recharger le Frontend

```
1. Aller sur : http://localhost:4200/partenaire/commissions
2. Appuyer sur F5 pour recharger
3. Vérifier que les montants sont corrects
```

## 📊 Vérification Visuelle

**AVANT la correction :**
```
Commission Juin 2026 : 10 DH ❌
```

**APRÈS la correction :**
```
Commission Juin 2026 : 22.5 DH ✅
(ou le total correct selon tous les coupons validés)
```

## 🔢 Formule de Calcul

```
Commission (DH) = Valeur de base (DH) × Taux (%) / 100

Exemples :
- 150 DH × 15% / 100 = 22.5 DH
- 35 DH × 15% / 100 = 5.25 DH
- 8 DH × 10% / 100 = 0.8 DH
- 0 DH × 10% / 100 = 0 DH
```

## ✅ Checklist Finale

- [ ] Script SQL exécuté dans phpMyAdmin
- [ ] Commissions recalculées (voir la requête UPDATE)
- [ ] Vérification : toutes les commissions sont "✅ OK"
- [ ] Frontend rechargé (F5)
- [ ] Montants corrects affichés dans /partenaire/commissions
- [ ] Banner "X DH à payer pour Juin 2026" correct
- [ ] Carte en évidence affiche le bon montant

## 🎯 Résultat Attendu dans le Frontend

**Résumé mensuel :**
```
┌─────────────────────────────────────────────┐
│ 💰 22.50 DH à payer pour Juin 2026         │
└─────────────────────────────────────────────┘

┌═══════════════════════════════════════════════┐
║  ✨ 22.50 DH                                  ║
║     Commission Juin 2026                      ║
╚═══════════════════════════════════════════════╝

Tableau :
| Mois      | Coupons | CA (DH) | Commission (DH) |
|-----------|---------|---------|-----------------|
| Juin 2026 | 3       | 150.00  | 22.50           |
```

*Note : Les valeurs exactes dépendent de tous les coupons validés*

## 🐛 Si Ça Ne Fonctionne Toujours Pas

1. **Vérifier que le script a bien été exécuté :**
   ```sql
   SELECT COUNT(*) AS nb_commissions_corrigees
   FROM commissions
   WHERE ABS(montant_commission - (valeur_dh * taux_commission / 100)) < 0.01;
   ```
   → Devrait afficher le nombre total de commissions

2. **Vider le cache du backend :**
   ```
   Redémarrer le service-recompense
   ```

3. **Vérifier les logs backend :**
   ```
   Regarder les logs de service-recompense pour les erreurs
   ```

4. **Vider le cache du frontend :**
   ```
   Ctrl + Shift + R (Windows) ou Cmd + Shift + R (Mac)
   ```

---

**Temps estimé :** 3 minutes  
**Difficulté :** Facile  
**Résultat :** ✅ Commissions correctement calculées
