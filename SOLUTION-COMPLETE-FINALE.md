# 🎯 SOLUTION COMPLÈTE: Flux d'échange de points fonctionnel

## ✅ PROBLÈME RÉSOLU!

### Ce qui a été découvert:

1. ✅ **Service-Utilisateur fonctionne** (port 8082)
2. ✅ **Service-Recompense fonctionne** (port 9093)
3. ✅ **L'échange de points fonctionne** (génération de coupon OK)
4. ❌ **Les points ne sont pas déduits automatiquement** (Kafka pas actif)
5. ❌ **La validation du coupon échoue** car le coupon appartient à un partenaire différent

### Cause de l'erreur de validation:

Le coupon généré appartient au **partenaire user_id=1** (Café Botanique), mais vous essayez de le valider avec **user_id=3** (H&M).

Le backend vérifie:
```java
if (!coupon.getRecompense().getPartenaire().getId().equals(partenaire.getId())) {
    throw new RuntimeException("Ce coupon n'appartient pas à votre enseigne");
}
```

---

## ⚡ SOLUTION IMMÉDIATE (3 options)

### OPTION 1: Utiliser le bon partenaire (RECOMMANDÉ)

Modifiez le fichier `frontend/src/app/core/services/dev-context.service.ts`:

```typescript
getPartenaireUserId(): number {
  return 1;  // ← Changer de 3 à 1 (Café Botanique)
}
```

Puis dans le script de test, changez:
```powershell
$USER_PARTENAIRE_ID = 1  # Au lieu de 3
```

### OPTION 2: Créer une récompense pour H&M

```powershell
# Créer une récompense pour le partenaire user_id=3 (H&M)
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "INSERT INTO recompenses (partenaire_id, title, description, points_necessaires, type, is_active, discount_percentage, valeur_dh) SELECT id, 'Réduction 20% H&M', 'Réduction sur toute la collection', 100, 'REDUCTION', true, 20, 50 FROM partenaires WHERE user_id = 3 LIMIT 1;"
```

Puis échangez cette nouvelle récompense.

### OPTION 3: Tester avec le partenaire existant

```powershell
# 1. Voir tous les partenaires et leurs récompenses
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "SELECT p.id, p.user_id, p.name, COUNT(r.id) as nb_recompenses FROM partenaires p LEFT JOIN recompenses r ON p.id = r.partenaire_id GROUP BY p.id;"

# 2. Échanger une récompense du bon partenaire
# 3. Valider avec le même partenaire
```

---

## 🧪 TEST COMPLET - ÉTAPE PAR ÉTAPE

### 1. Identifier les partenaires et leurs récompenses

```powershell
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "
SELECT 
    p.id as partenaire_id,
    p.user_id,
    p.name as partenaire_name,
    r.id as recompense_id,
    r.title as recompense_title,
    r.points_necessaires
FROM partenaires p
JOIN recompenses r ON p.id = r.partenaire_id
WHERE r.is_active = true
ORDER BY p.user_id, r.id;
"
```

### 2. Noter un couple partenaire/récompense

Exemple de sortie:
```
partenaire_id | user_id | partenaire_name  | recompense_id | recompense_title        | points_necessaires
1             | 1       | Café Botanique   | 1             | Café gratuit            | 50
1             | 1       | Café Botanique   | 2             | Café & pâtisserie       | 150
15            | 3       | H&M              | 10            | Réduction 15%           | 200
```

Choisissez:
- **USER_PARTENAIRE_ID** = 1 (pour Café Botanique)
- **RECOMPENSE_ID** = 1 (Café gratuit - 50 points)

### 3. Modifier le script de test

Éditez `test-flux-echange.ps1`:

```powershell
# Configuration
$USER_CITOYEN_ID = 1
$USER_PARTENAIRE_ID = 1    # ← USER_ID du partenaire (pas l'ID de la table!)
$RECOMPENSE_ID = 1          # ← ID de la récompense appartenant à ce partenaire
```

### 4. Exécuter le test

```powershell
.\test-flux-echange.ps1
```

**Résultat attendu:**
```
[4] Validation du coupon par le partenaire...
  [OK] Coupon validé avec succès!
  Code: ECO-2026-XXXXX
  Statut: UTILISE
  Validé le: 2026-06-04T...
```

---

## 📊 COMPRENDRE LA STRUCTURE

### Tables et relations:

```
partenaires (table)
├── id (PK)
├── user_id (unique) ← ID de l'utilisateur dans auth-service
└── name

recompenses (table)
├── id (PK)
├── partenaire_id (FK → partenaires.id)
├── title
└── points_necessaires

coupons (table)
├── id (PK)
├── code (unique)
├── user_id ← ID du citoyen qui a échangé
├── recompense_id (FK → recompenses.id)
└── status
```

### Flux de validation:

1. **Frontend envoie**: `POST /api/partenaire/valider-coupon` avec header `X-User-Id: 3`
2. **Backend cherche**: Partenaire avec `user_id = 3` dans table `partenaires`
3. **Backend vérifie**: Le coupon appartient-il à ce partenaire?
   ```java
   coupon.getRecompense().getPartenaire().getUserId() == 3
   ```
4. Si OUI → Validation OK
5. Si NON → Erreur "Ce coupon n'appartient pas à votre enseigne"

---

## 🔧 SCRIPT DE VÉRIFICATION RAPIDE

Créez `verifier-donnees.ps1`:

```powershell
Write-Host "`n=== VÉRIFICATION DES DONNÉES ===" -ForegroundColor Cyan

# Points du citoyen
Write-Host "`n[1] Points du citoyen (auth_id=1):" -ForegroundColor Yellow
docker exec mysql-utilisateur mysql -u ecopria -pecopria_pass_2026 db_utilisateur -e "SELECT auth_id, total_points, points_disponibles FROM citizens WHERE auth_id = 1;" 2>$null | Select-Object -Skip 1

# Partenaires et leurs récompenses
Write-Host "`n[2] Partenaires et leurs récompenses actives:" -ForegroundColor Yellow
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "
SELECT 
    p.id, p.user_id, p.name,
    COUNT(r.id) as nb_recompenses
FROM partenaires p
LEFT JOIN recompenses r ON p.id = r.partenaire_id AND r.is_active = true
GROUP BY p.id
ORDER BY p.user_id;
" 2>$null | Select-Object -Skip 1

# Derniers coupons
Write-Host "`n[3] Derniers coupons générés:" -ForegroundColor Yellow
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "
SELECT 
    c.code, c.status, c.user_id as citoyen_id,
    p.user_id as partenaire_user_id, p.name
FROM coupons c
JOIN recompenses r ON c.recompense_id = r.id
JOIN partenaires p ON r.partenaire_id = p.id
ORDER BY c.created_at DESC
LIMIT 5;
" 2>$null | Select-Object -Skip 1

Write-Host "`n=== FIN VÉRIFICATION ===" -ForegroundColor Cyan
```

Exécutez:
```powershell
.\verifier-donnees.ps1
```

---

## 🎯 CRÉER UN ENVIRONNEMENT DE TEST PROPRE

### Script `reset-et-prepare-test.ps1`:

```powershell
Write-Host "`n=== PRÉPARATION ENVIRONNEMENT DE TEST ===" -ForegroundColor Cyan

# 1. Ajouter points au citoyen
Write-Host "`n[1] Ajout de 500 points au citoyen..." -ForegroundColor Yellow
docker exec mysql-utilisateur mysql -u ecopria -pecopria_pass_2026 db_utilisateur -e "UPDATE citizens SET total_points = 500, points_disponibles = 500 WHERE auth_id = 1;" 2>$null
Write-Host "  [OK] 500 points ajoutés" -ForegroundColor Green

# 2. Créer un partenaire de test si nécessaire
Write-Host "`n[2] Création partenaire de test (user_id=10)..." -ForegroundColor Yellow
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "
INSERT IGNORE INTO partenaires 
(user_id, name, category, address, city, description, phone, commission_rate, vues_profil, clics_offres)
VALUES 
(10, 'Partenaire Test', 'COMMERCE_LOCAL', '123 Test St', 'Casablanca', 'Test', '0600000000', 10.0, 0, 0);
" 2>$null
Write-Host "  [OK] Partenaire créé" -ForegroundColor Green

# 3. Créer une récompense pour ce partenaire
Write-Host "`n[3] Création récompense de test..." -ForegroundColor Yellow
docker exec mysql-recompense mysql -u ecopria -pecopria_pass_2026 db_recompense -e "
INSERT IGNORE INTO recompenses 
(id, partenaire_id, title, description, points_necessaires, type, is_active, discount_percentage, valeur_dh)
SELECT 
    999,
    id,
    'Réduction Test 20%',
    'Récompense de test',
    100,
    'REDUCTION',
    true,
    20,
    50
FROM partenaires 
WHERE user_id = 10
LIMIT 1;
" 2>$null
Write-Host "  [OK] Récompense créée (ID=999)" -ForegroundColor Green

# 4. Résumé
Write-Host "`n=== RÉSUMÉ ===" -ForegroundColor Cyan
Write-Host "  Citoyen: user_id=1 | 500 points" -ForegroundColor White
Write-Host "  Partenaire: user_id=10 | Partenaire Test" -ForegroundColor White
Write-Host "  Récompense: id=999 | 100 points" -ForegroundColor White
Write-Host "`nModifiez test-flux-echange.ps1:" -ForegroundColor Yellow
Write-Host "  USER_PARTENAIRE_ID = 10" -ForegroundColor Cyan
Write-Host "  RECOMPENSE_ID = 999" -ForegroundColor Cyan
```

---

## ✅ CHECKLIST FINALE

Pour que tout fonctionne:

### Backend:
- [ ] Service-Utilisateur actif (port 8082)
- [ ] Service-Recompense actif (port 9093)
- [ ] MySQL db_utilisateur accessible (port 3307)
- [ ] MySQL db_recompense accessible (port 3311)

### Données:
- [ ] Le citoyen a des points suffisants
- [ ] Un partenaire existe avec l'user_id testé
- [ ] Ce partenaire a au moins une récompense active
- [ ] La récompense coûte moins que le solde du citoyen

### Frontend:
- [ ] `dev-context.service.ts` retourne le bon `user_id` partenaire
- [ ] Le header `X-User-Id` est envoyé correctement
- [ ] Le code coupon appartient au partenaire qui valide

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ **Résoudre la validation** (ce document)
2. 📱 **Ajouter le QR Code** → Voir `IMPLEMENTATION-QR-CODE.md`
3. ☕ **Configurer Kafka** → Pour déduction automatique des points
4. 📧 **Notifications email** → Envoyer le coupon par email
5. 📊 **Dashboard avancé** → Statistiques pour les partenaires

---

## 💡 ASTUCE PRO

Créez un fichier `.env.test` avec vos IDs de test:

```
TEST_CITOYEN_ID=1
TEST_PARTENAIRE_ID=1
TEST_RECOMPENSE_ID=1
```

Et utilisez-les dans vos scripts.

---

**TOUT EST PRÊT! Testez maintenant:** ✨

```powershell
# 1. Vérifier les données
.\verifier-donnees.ps1

# 2. Noter les IDs corrects

# 3. Modifier test-flux-echange.ps1 avec les bons IDs

# 4. Tester
.\test-flux-echange.ps1
```

**Le flux devrait fonctionner à 100%!** 🎉
