# 🧪 Guide de Test - Modifications Espace Partenaire

## 🎯 Objectif

Tester les deux modifications apportées à l'espace partenaire :
1. Scanner de coupons (mode upload par défaut)
2. Affichage de la commission du mois en cours

---

## ⚙️ Prérequis

### Services à démarrer

```bash
# 1. Base de données MySQL
# Vérifier qu'elle tourne sur localhost:3306

# 2. Service Gateway
cd backend/gateway
mvn spring-boot:run

# 3. Service Utilisateur
cd backend/service-utilisateur
mvn spring-boot:run

# 4. Service Récompense
cd backend/service-recompense
mvn spring-boot:run

# 5. Frontend Angular
cd frontend
npm start
# Accès : http://localhost:4200
```

### Données de Test

Utiliser le compte partenaire de test :
- **Email :** partenaire@test.com
- **Mot de passe :** test123
- **Nom :** Coffee Botanique

---

## 📋 Test 1 : Scanner de Coupons

### Étape 1 : Accéder au scanner

```
1. Ouvrir : http://localhost:4200
2. Se connecter avec le compte partenaire
3. Aller à : Espace Partenaire > Scanner coupon
   URL : http://localhost:4200/partenaire/scanner
```

### Étape 2 : Vérifier l'interface

✅ **Vérifications visuelles :**

| Vérification | Attendu | ✓ |
|-------------|---------|---|
| Mode par défaut | "📄 Importer image" actif (bouton surligné) | [ ] |
| Bouton caméra | N'existe PLUS (doit être invisible) | [ ] |
| Zone de drop | Visible avec texte "Glissez-déposez une image ici" | [ ] |
| Icône | 📄 (document) visible | [ ] |
| Bouton saisie manuelle | Visible mais non actif | [ ] |

### Étape 3 : Tester l'upload d'image

**Option A : Glisser-déposer**

```
1. Préparer une image contenant un QR code de coupon
   (ou utiliser une image de test avec QR code)
2. Glisser l'image dans la zone de drop
3. Vérifier :
   ✓ Prévisualisation de l'image s'affiche
   ✓ Message "Lecture QR en cours…" apparaît
   ✓ Code détecté s'affiche (ex: "ECO-2026-XXXX")
   ✓ Bouton "✔ Valider" devient actif
```

**Option B : Sélection fichier**

```
1. Cliquer sur la zone de drop
2. Sélectionner une image depuis l'explorateur
3. Vérifier les mêmes éléments que l'Option A
```

### Étape 4 : Valider le coupon

```
1. Une fois le code détecté, cliquer "✔ Valider"
2. Vérifier :
   ✓ Message de succès : "✅ Coupon validé !"
   ✓ Détails du coupon affichés (code, offre, points)
   ✓ Historique de session mis à jour
   ✓ Le formulaire est réinitialisé pour un nouveau scan
```

### Étape 5 : Tester la saisie manuelle

```
1. Cliquer sur "⌨️ Saisie manuelle"
2. Saisir un code coupon valide : ECO-2026-XXXX
3. Appuyer sur "Entrée" ou cliquer "✔ Valider"
4. Vérifier la validation fonctionne
```

### 🐛 Cas d'erreur à tester

| Cas | Action | Résultat attendu |
|-----|--------|------------------|
| Image sans QR | Upload image normale | Message : "Aucun QR code détecté" |
| Mauvais format | Upload PDF/Word | Message : "Format non supporté" |
| Code invalide | Saisir code inexistant | Message : "Coupon introuvable" |
| Code déjà utilisé | Valider coupon utilisé | Message : "Coupon déjà utilisé" |

---

## 📊 Test 2 : Commissions du Mois

### Étape 1 : Accéder aux commissions

```
1. Dans l'espace partenaire
2. Aller à : Commissions
   URL : http://localhost:4200/partenaire/commissions
```

### Étape 2 : Vérifier le banner

✅ **Banner en haut de page :**

| Vérification | Attendu | ✓ |
|-------------|---------|---|
| Icône | 💰 visible | [ ] |
| Texte principal | "X DH à payer pour Juin 2026" | [ ] |
| Montant | Nombre correct (voir étape 5) | [ ] |
| Sous-texte | Description des commissions | [ ] |
| Style | Fond vert menthe | [ ] |

### Étape 3 : Vérifier la grille de totaux

✅ **4 cartes visibles :**

| Carte | Contenu | Style | ✓ |
|-------|---------|-------|---|
| 1 | "Commission Juin 2026" + montant | **En évidence** (dégradé vert, bordure épaisse) | [ ] |
| 2 | "Total coupons utilisés" + nombre | Normal | [ ] |
| 3 | "CA total généré" + montant DH | Normal | [ ] |
| 4 | "Total commissions (historique)" + montant | Fond menthe | [ ] |

**Carte 1 (Commission mois en cours) - Détails :**
```
✓ Police plus grande que les autres
✓ Bordure : 2px solid (couleur sage dark)
✓ Dégradé : vert menthe → #e8f5f0
✓ Ombre portée visible
✓ Texte en gras
```

### Étape 4 : Vérifier le tableau historique

✅ **Tableau mensuel :**

| Colonne | Contenu | ✓ |
|---------|---------|---|
| Mois | Format : "Juin 2026", "Mai 2026", etc. | [ ] |
| Coupons utilisés | Nombre entier | [ ] |
| CA généré (DH) | Nombre avec décimales | [ ] |
| Commission (DH) | Nombre avec décimales, en gras | [ ] |

✅ **Ligne de total en bas :**
```
✓ Fond crème
✓ Texte en gras
✓ Somme de toutes les colonnes
```

✅ **Ligne du mois en cours :**
```
✓ "Juin 2026" doit être présente
✓ Les valeurs correspondent à la carte en haut
```

### Étape 5 : Vérifier la cohérence des données

**Calcul manuel :**

```sql
-- Exécuter dans MySQL
USE ecopria_recompense;

SELECT 
    DATE_FORMAT(NOW(), '%Y-%m') AS mois_actuel,
    COUNT(c.id) AS coupons_valides,
    SUM(
        CASE 
            WHEN r.type = 'REDUCTION' AND r.discount_percentage IS NOT NULL THEN
                (r.valeur_dh * r.discount_percentage / 100.0 * p.commission_taux / 100.0)
            WHEN r.type = 'REDUCTION' AND r.valeur_dh IS NOT NULL THEN
                (r.valeur_dh * p.commission_taux / 100.0)
            ELSE 0
        END
    ) AS commission_calculee
FROM coupon c
JOIN recompense r ON c.recompense_id = r.id
JOIN partenaire p ON r.partenaire_id = p.id
WHERE c.status = 'UTILISE'
  AND DATE_FORMAT(c.valide_le, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
  AND p.name = 'Coffee Botanique';
```

**Comparer :**
```
Résultat SQL = Montant affiché dans l'interface
```

### Étape 6 : Tester l'état vide

```
1. Se connecter avec un partenaire sans coupons validés
2. Vérifier :
   ✓ Banner ne s'affiche pas (ou montant = 0)
   ✓ Carte "Commission Juin 2026" affiche 0.00 DH
   ✓ Message "Aucune commission enregistrée" visible
```

---

## 🔍 Tests de Cohérence

### Test 1 : Valider un coupon puis vérifier les commissions

```
1. Aller au scanner
2. Valider un nouveau coupon (ex: 30 DH, réduction 100%)
3. Aller aux commissions
4. Vérifier que :
   ✓ Le montant du mois a augmenté
   ✓ Le nombre de coupons a augmenté
   ✓ Le CA a augmenté
   
Calcul attendu (exemple) :
- Offre : 30 DH × 100% = 30 DH CA
- Taux partenaire : 15%
- Commission : 30 × 15% = 4.5 DH
```

### Test 2 : Changement de mois

```
Si on est en fin de mois :

1. Noter le montant du mois actuel
2. Attendre le changement de mois (1er jour du mois suivant)
3. Vérifier :
   ✓ Banner affiche le nouveau mois
   ✓ Carte affiche le nouveau mois
   ✓ Montant = 0 (nouveau mois sans coupons)
   ✓ Tableau contient une nouvelle ligne pour le mois précédent
```

---

## 📸 Screenshots à Prendre

Pour documentation :

1. **Scanner - Mode upload actif**
   - Capture avant upload
   - Capture avec prévisualisation
   - Capture après validation

2. **Commissions - Vue complète**
   - Banner
   - Grille de 4 cartes
   - Tableau historique

3. **Commissions - Carte en évidence**
   - Zoom sur la carte "Commission Juin 2026"
   - Montrer le dégradé et la bordure

---

## ✅ Checklist Complète

### Scanner de Coupons

- [ ] Mode "Importer image" par défaut
- [ ] Bouton "Scanner QR" n'existe plus
- [ ] Zone de drop visible et fonctionnelle
- [ ] Upload par glisser-déposer fonctionne
- [ ] Upload par clic fonctionne
- [ ] Prévisualisation de l'image s'affiche
- [ ] Détection QR automatique
- [ ] Code détecté s'affiche correctement
- [ ] Validation du coupon fonctionne
- [ ] Message de succès s'affiche
- [ ] Détails du coupon affichés
- [ ] Historique mis à jour
- [ ] Erreurs gérées correctement
- [ ] Mode saisie manuelle fonctionne toujours

### Commissions

- [ ] Banner s'affiche avec le bon mois
- [ ] Montant dans banner correct
- [ ] Carte "Commission mois en cours" en évidence
- [ ] Style de la carte appliqué (dégradé, bordure)
- [ ] 4 cartes visibles dans la grille
- [ ] Tableau historique s'affiche
- [ ] Ligne du mois en cours présente
- [ ] Totaux calculés correctement
- [ ] Format des montants correct (2 décimales)
- [ ] Format des mois correct (français)
- [ ] Cohérence entre banner et tableau
- [ ] État vide géré correctement

### Tests Backend

- [ ] Endpoint `/api/partenaire/commissions` fonctionne
- [ ] Données retournées au format correct
- [ ] Script SQL s'exécute sans erreur
- [ ] Comparaison données DB vs interface OK

### Tests de Bout en Bout

- [ ] Valider coupon → Voir commission augmenter
- [ ] Pas d'erreurs console navigateur
- [ ] Pas d'erreurs console backend
- [ ] Performance acceptable (<2s chargement)

---

## 🐛 Problèmes Connus & Solutions

| Problème | Solution |
|----------|----------|
| QR code non détecté | Vérifier que html5-qrcode est chargé dans index.html |
| Commission = 0 malgré coupons | Vérifier la table commission_mensuelle est à jour |
| Carte pas en évidence | Vider le cache navigateur (Ctrl+Shift+R) |
| Banner ne s'affiche pas | Vérifier qu'il y a des coupons validés ce mois |

---

## 📞 Support

En cas de problème :

1. **Console navigateur** : F12 → onglet Console
2. **Logs backend** : Vérifier les logs Spring Boot
3. **Base de données** : Exécuter `verifier-commissions-mois-courant.sql`
4. **Documentation** : Lire `MODIFICATIONS-ESPACE-PARTENAIRE.md`

---

**Durée estimée du test :** 20-30 minutes  
**Testeur :** _________________  
**Date :** _________________  
**Résultat :** ✅ PASS / ❌ FAIL
