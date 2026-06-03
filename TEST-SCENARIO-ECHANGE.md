# 🧪 GUIDE DE TEST: Scénario d'échange d'offres

## ✅ Prérequis

Avant de tester, assurez-vous que:
- [ ] Docker est lancé
- [ ] L'infrastructure est démarrée
- [ ] Le backend service-recompense fonctionne
- [ ] Le backend api-gateway fonctionne
- [ ] Le frontend est compilé

---

## 🚀 Démarrage rapide

### 1. Infrastructure

```powershell
docker compose -f docker-compose.infra.yml up -d
```

**Vérifier:**
```powershell
docker ps
```
Vous devriez voir: `mysql-recompense`, `kafka`, `phpmyadmin`, etc.

### 2. Backend service-recompense

```powershell
cd backend/service-recompense
mvn spring-boot:run
```

**Vérifier:** http://localhost:9093/actuator/health → `{"status":"UP"}`

### 3. Backend api-gateway

```powershell
cd backend/api-gateway
mvn spring-boot:run
```

**Vérifier:** http://localhost:8080/actuator/health → `{"status":"UP"}`

### 4. Frontend

```powershell
cd frontend
npm start
```

**Attendre:** "Compiled successfully"

**Accéder:** http://localhost:4200

---

## 📋 SCÉNARIO DE TEST COMPLET

### TEST 1: Voir la liste des partenaires ✅

**Action:**
1. Ouvrir http://localhost:4200
2. Cliquer sur "Partenaires" dans la navbar

**Résultat attendu:**
- Page `/partenaires` s'affiche
- Liste de 7 partenaires (Café Botanique, Zara, etc.)
- Chaque carte partenaire a: nom, catégorie, ville, badge

**Vérification:**
- [ ] La liste s'affiche correctement
- [ ] Les images des partenaires sont visibles
- [ ] Les cartes sont cliquables

---

### TEST 2: Accéder à la page d'un partenaire ✅

**Action:**
1. Sur `/partenaires`, cliquer sur "Café Botanique"

**Résultat attendu:**
- Page `/partenaires/101` s'affiche
- Header avec image du partenaire
- Section "À propos"
- Section "Offres disponibles" avec 3 offres

**Vérification:**
- [ ] URL = `/partenaires/101`
- [ ] Nom du partenaire visible: "Café Botanique"
- [ ] 3 offres affichées (pas celles de Zara!)
- [ ] Chaque offre a un bouton "Échanger"

---

### TEST 3: Tentative d'échange SANS connexion ❌→✅

**Action:**
1. Sur `/partenaires/101`
2. Cliquer sur "Échanger" sur une offre
3. **Sans être connecté**

**Résultat attendu:**
1. Alert: "Vous devez être connecté pour échanger des points."
2. Redirection vers `/connexion`
3. URL conserve le returnUrl: `/connexion?returnUrl=/partenaires/101`

**Vérification:**
- [ ] Alert s'affiche
- [ ] Redirection vers `/connexion`
- [ ] returnUrl présent dans l'URL

---

### TEST 4: Connexion utilisateur 🔐

**Action:**
1. Sur `/connexion`
2. Entrer identifiants:
   - Email: `test@example.com` (ou autre utilisateur test)
   - Mot de passe: votre mot de passe test
3. Cliquer sur "Se connecter"

**Résultat attendu:**
- Connexion réussie
- Redirection vers l'URL de retour `/partenaires/101`

**Vérification:**
- [ ] Message de succès
- [ ] Retour sur `/partenaires/101`
- [ ] Bouton "Mon espace" visible dans navbar (= connecté)

---

### TEST 5: Échange d'offre AVEC connexion ✅

**Action:**
1. Sur `/partenaires/101` (connecté)
2. Cliquer sur "Échanger" sur l'offre "Café & pâtisserie"
3. Lire la confirmation
4. Cliquer sur "OK"

**Résultat attendu:**
1. Popup de confirmation: "Voulez-vous échanger 150 points..."
2. Après OK: Bouton affiche "⏳"
3. Appel API vers backend
4. **Modal de succès s'affiche** 🎉

**Vérification:**
- [ ] Confirmation s'affiche
- [ ] État de chargement visible
- [ ] Modal de succès s'affiche

---

### TEST 6: Vérifier le modal de succès 🎉

**Sur le modal qui vient de s'afficher:**

**Résultat attendu:**
- Header vert avec gradient
- Icône 🎉
- Titre: "Félicitations !"
- Message: "Votre échange a été effectué avec succès !"
- **Code coupon affiché** (ex: `ECO-A1B2-C3D4`)
- Nom de l'offre
- Nom du partenaire
- Instructions d'utilisation
- Date d'expiration
- 2 boutons: "Voir mes coupons" | "Continuer"

**Vérification:**
- [ ] Modal visible avec animations
- [ ] Code coupon présent (format ECO-XXXX-XXXX)
- [ ] Texte "Chez Café Botanique"
- [ ] Instructions claires
- [ ] Boutons fonctionnels

---

### TEST 7: Vérifier la mise à jour du stock 📦

**Action:**
1. Noter le stock avant échange (ex: STOCK 42)
2. Après échange réussi, cliquer sur "Continuer"
3. Observer la carte de l'offre

**Résultat attendu:**
- Stock diminué de 1 (ex: STOCK 41)
- Badge toujours visible

**Vérification:**
- [ ] Stock mis à jour
- [ ] Badge de stock toujours vert (si > 5)

---

### TEST 8: Vérifier dans la base de données 🗄️

**Action:**
1. Ouvrir phpMyAdmin: http://localhost:8888
2. Se connecter avec `root` / `root`
3. Sélectionner base `db_recompense`
4. Table `coupon`

**Résultat attendu:**
- Nouveau coupon créé
- Colonnes:
  - `code`: ECO-XXXX-XXXX
  - `user_id`: ID de l'utilisateur connecté
  - `recompense_id`: ID de l'offre
  - `status`: DISTRIBUE
  - `points_utilises`: 150
  - `expire_le`: Date + 30 jours

**Vérification:**
- [ ] Coupon existe dans la table
- [ ] Status = DISTRIBUE
- [ ] Code correspond à celui affiché

---

### TEST 9: Vérifier la table recompense

**Dans phpMyAdmin:**
1. Table `recompense`
2. Chercher l'offre échangée

**Résultat attendu:**
- Colonne `stock` diminuée de 1

**Vérification:**
- [ ] Stock mis à jour en base

---

### TEST 10: Test avec stock faible ⚠️

**Préparation:**
1. Dans phpMyAdmin, mettre le stock d'une offre à 3
2. Rafraîchir la page partenaire

**Résultat attendu:**
- Badge "STOCK 3" en **rouge**
- Bouton "Échanger" toujours actif

**Vérification:**
- [ ] Badge rouge visible
- [ ] Texte lisible

---

### TEST 11: Test avec stock épuisé ❌

**Préparation:**
1. Mettre le stock à 0 en base
2. Rafraîchir

**Résultat attendu:**
- Badge "STOCK 0" rouge
- Bouton "Échanger" **désactivé** (grisé)

**Vérification:**
- [ ] Bouton grisé
- [ ] Cursor: not-allowed
- [ ] Clic ne fait rien

---

### TEST 12: Vérifier le filtrage par partenaire 🔍

**Action:**
1. Aller sur `/partenaires/101` (Café Botanique)
2. Noter les 3 offres
3. Aller sur `/partenaires/102` (Zara Maroc)
4. Noter les 2 offres

**Résultat attendu:**
- Café Botanique: 3 offres restaurant
- Zara: 2 offres mode
- **Aucun mélange** entre partenaires

**Vérification:**
- [ ] Café Botanique affiche UNIQUEMENT ses offres
- [ ] Zara affiche UNIQUEMENT ses offres
- [ ] Pas d'offres de restaurant chez Zara
- [ ] Pas d'offres de mode chez Café Botanique

---

## 🎯 CHECKLIST GLOBALE

### Fonctionnel:
- [ ] Liste des partenaires fonctionne
- [ ] Page partenaire s'affiche
- [ ] Offres filtrées par partenaire
- [ ] Bouton "Échanger" visible
- [ ] Vérification de connexion fonctionne
- [ ] Redirection login si non connecté
- [ ] Échange avec confirmation
- [ ] Appel API réussit
- [ ] Modal de succès s'affiche
- [ ] Code coupon généré
- [ ] Stock mis à jour

### Visual/UX:
- [ ] Design responsive
- [ ] Animations fluides
- [ ] Badges colorés (stock, type, réduction)
- [ ] Modal élégant
- [ ] Boutons avec hover effects
- [ ] Loading states (⏳)

### Backend:
- [ ] Coupon créé en base
- [ ] Stock décrémenté
- [ ] Points déduits (vérifier table utilisateur)
- [ ] Commission calculée (table commission)

---

## 🐛 DÉPANNAGE

### Problème: "Cannot GET /partenaires/101"

**Solution:**
- Vérifier que le frontend tourne sur port 4200
- Rafraîchir la page
- Vérifier les routes dans `app.routes.ts`

### Problème: Offres ne s'affichent pas

**Solution:**
1. Vérifier console navigateur (F12)
2. Vérifier que service-recompense tourne (port 9093)
3. Tester endpoint: `curl http://localhost:9093/api/recompenses/public/partenaire/101/offres`

### Problème: Erreur lors de l'échange

**Solution:**
1. Vérifier console backend
2. Vérifier que l'utilisateur a assez de points
3. Vérifier que l'offre a du stock

### Problème: Modal ne s'affiche pas

**Solution:**
1. Console navigateur: chercher erreurs
2. Vérifier que `showSuccessModal` = true
3. Vérifier que `couponGenere` contient les données

---

## ✅ RÉSULTATS ATTENDUS

Si tous les tests passent:
- ✅ Scénario complet fonctionnel
- ✅ UI/UX conforme à la maquette
- ✅ Backend intégré correctement
- ✅ Authentification gérée
- ✅ Données persistées en base

**STATUS: PRÊT POUR DÉMONSTRATION! 🎉**

---

**Guide créé le:** 03 Juin 2026  
**Version:** 1.0.0
