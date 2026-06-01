# 🚀 DÉMARRAGE RAPIDE - ESPACE PARTENAIRE

## 📋 PRÉREQUIS

- Docker & Docker Compose installés
- Node.js 18+ installé
- Java 21+ installé
- Maven 3.8+ installé

---

## 🎯 DÉMARRAGE EN 5 MINUTES

### 1️⃣ Démarrer les services Docker

```bash
cd c:\Users\user\Desktop\ecopria

# Démarrer tous les services
docker-compose up -d

# Vérifier que tous les services sont actifs
docker-compose ps

# Attendre ~30 secondes que les services se stabilisent
```

**Services clés:**
- ✅ service-recompense (port 9093)
- ✅ mysql-recompense (port 3311)
- ✅ api-gateway (port 8080)

---

### 2️⃣ Démarrer le frontend

```bash
# Terminal 2
cd c:\Users\user\Desktop\ecopria\frontend

# Installer les dépendances (si nécessaire)
npm install

# Démarrer le serveur de développement
npm start

# Vérifier: http://localhost:4200
```

---

### 3️⃣ Accéder à l'espace partenaire

```
http://localhost:4200/partenaire/dashboard
```

**Utilisateur par défaut:** userId = 1

---

## 🧪 TESTS RAPIDES

### Test 1: Créer une offre

```bash
# 1. Aller à: http://localhost:4200/partenaire/dashboard
# 2. Cliquer sur "Mes Offres"
# 3. Cliquer sur "Créer une offre"
# 4. Remplir le formulaire:
#    - Titre: "Test Offre"
#    - Points: 100
#    - Type: STOCK
#    - Stock: 50
#    - Valeur DH: 150
#    - Discount: 20%
# 5. Cliquer sur "Créer"
```

**Résultat attendu:** ✅ Offre créée et affichée dans la liste

---

### Test 2: Vérifier en base de données

```bash
# Ouvrir PhpMyAdmin
# URL: http://localhost:8888
# Utilisateur: root
# Mot de passe: root

# Aller à: db_recompense → recompenses
# Vérifier que l'offre est présente avec partenaire_id = 1
```

**Résultat attendu:** ✅ Offre visible en base de données

---

### Test 3: Modifier l'offre

```bash
# 1. Aller à: http://localhost:4200/partenaire/dashboard
# 2. Cliquer sur "Mes Offres"
# 3. Cliquer sur l'offre créée
# 4. Modifier le stock: 40 (au lieu de 50)
# 5. Cliquer sur "Modifier"
```

**Résultat attendu:** ✅ Offre mise à jour

---

### Test 4: Vérifier la commission

```bash
# 1. Utiliser Postman ou curl pour simuler un échange:

POST http://localhost:8080/api/recompenses/echanger
Headers:
  X-User-Id: 1
Body:
{
  "recompenseId": 1
}

# 2. Récupérer le code du coupon (ex: ECO-2026-XXXXX)

# 3. Valider le coupon:

POST http://localhost:8080/api/partenaire/valider-coupon
Headers:
  X-User-Id: 1
Body:
{
  "code": "ECO-2026-XXXXX"
}

# 4. Vérifier en base de données:
# db_recompense → commissions
# Vérifier que la commission est calculée
```

**Résultat attendu:** ✅ Commission calculée correctement

---

## 📊 VÉRIFICATIONS IMPORTANTES

### ✅ Frontend compile
```bash
cd frontend
npm run build
# Résultat: ✅ BUILD SUCCESS
```

### ✅ Backend compile
```bash
cd backend/service-recompense
.\mvnw clean compile -DskipTests
# Résultat: ✅ BUILD SUCCESS
```

### ✅ Services démarrés
```bash
docker-compose ps
# Tous les services doivent être "Up"
```

### ✅ userId correct
```javascript
// Ouvrir DevTools (F12) → Console
localStorage.getItem('userId')
// Résultat: "1"
```

---

## 🔍 DÉPANNAGE RAPIDE

### Service-recompense ne démarre pas
```bash
# Vérifier les logs
docker logs service-recompense

# Redémarrer le service
docker-compose restart service-recompense

# Vérifier la base de données
docker logs mysql-recompense
```

### Frontend ne charge pas
```bash
# Vérifier les logs
npm start

# Vérifier le port 4200
netstat -ano | findstr :4200

# Tuer le processus si nécessaire
taskkill /PID <PID> /F
```

### Offre non sauvegardée
```bash
# Vérifier les logs du backend
docker logs -f service-recompense

# Vérifier la base de données
# PhpMyAdmin: http://localhost:8888
# db_recompense → recompenses
```

---

## 📈 FLUX COMPLET DE TEST

```
1. Démarrer Docker
   ↓
2. Démarrer Frontend
   ↓
3. Accéder à http://localhost:4200/partenaire/dashboard
   ↓
4. Créer une offre
   ↓
5. Vérifier en base de données
   ↓
6. Modifier l'offre
   ↓
7. Vérifier la modification
   ↓
8. Simuler un échange de coupon
   ↓
9. Valider le coupon
   ↓
10. Vérifier la commission
    ↓
11. ✅ SUCCÈS!
```

---

## 🎯 RÉSULTATS ATTENDUS

### Avant les corrections
```
❌ Offre créée avec userId=1 (hardcodé)
❌ Impossible de tester multi-utilisateur
❌ Commission non calculée pour SERVICE/EXPERIENCE
❌ Données non persistées correctement
```

### Après les corrections
```
✅ Offre créée avec userId correct
✅ Multi-utilisateur fonctionnel
✅ Commission calculée pour tous les types
✅ Données persistées correctement
```

---

## 📝 NOTES IMPORTANTES

1. **userId par défaut:** 1 (développement)
2. **localStorage:** Utilisé pour stocker le userId
3. **Commission:** Calculée lors de la validation du coupon
4. **Multi-utilisateur:** Tester en changeant le userId dans localStorage

---

## 🚀 COMMANDES UTILES

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs d'un service
docker logs -f service-recompense

# Redémarrer un service
docker-compose restart service-recompense

# Accéder à la base de données
# PhpMyAdmin: http://localhost:8888

# Compiler le frontend
npm run build

# Compiler le backend
.\mvnw clean compile -DskipTests

# Démarrer le frontend en développement
npm start
```

---

## ✅ CHECKLIST FINALE

- [ ] Docker démarré
- [ ] Frontend démarré
- [ ] Accès à http://localhost:4200/partenaire/dashboard
- [ ] Création d'offre fonctionne
- [ ] Offre visible en base de données
- [ ] Modification d'offre fonctionne
- [ ] Commission calculée correctement
- [ ] Multi-utilisateur fonctionne
- [ ] Pas d'erreurs dans la console

---

**Date:** 26 mai 2026  
**Status:** 🚀 PRÊT À DÉMARRER
