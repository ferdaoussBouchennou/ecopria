# 🚀 GUIDE DE DÉMARRAGE FINAL

**Configuration optimale pour votre environnement**

---

## 📋 ARCHITECTURE DE DÉMARRAGE

```
Service-Utilisateur  → Docker (Java 21)      Port 8082
Service-Recompense   → Local (Maven)         Port 9093  
Frontend Angular     → Local (npm)           Port 4200
MySQL                → Docker                Ports 3307, 3311
Kafka                → Docker (optionnel)    Port 29092
```

**Raison:** Service-Utilisateur ne compile pas en local (Java 25 + Lombok incompatibilité)

---

## ⚡ DÉMARRAGE EN 3 ÉTAPES

### ÉTAPE 1: Démarrer Service-Utilisateur (Docker)

```powershell
.\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1
```

**Ce script fait:**
1. Arrête l'ancien conteneur
2. Supprime l'ancienne image
3. **Build la nouvelle image avec vos modifications** ✅
4. Démarre le conteneur
5. Attend que le service soit prêt
6. Teste l'API

**Durée:** ~3 minutes (build) + 30 secondes (démarrage)

**Vérification:**
```powershell
curl http://localhost:8082/api/users/1/points
# Devrait retourner: {"totalPoints": 400}
```

---

### ÉTAPE 2: Démarrer Service-Recompense (Local)

**Terminal 1:**
```powershell
cd backend\service-recompense
mvn spring-boot:run
```

**Attendez le message:**
```
Started ServiceRecompenseApplication in X.XXX seconds
```

**Vérification:**
```powershell
curl http://localhost:9093/api/recompenses
# Devrait retourner la liste des récompenses
```

---

### ÉTAPE 3: Démarrer Frontend (Local)

**Terminal 2:**
```powershell
cd frontend
npm run start
```

**Attendez le message:**
```
✔ Compiled successfully
```

**Accédez à:** http://localhost:4200

---

## 🧪 TESTER LA DÉDUCTION AUTOMATIQUE

### Test Automatisé

```powershell
.\test-deduction-points.ps1
```

**Résultat attendu:**
```
[1/5] Vérification du solde AVANT échange...
  Solde AVANT: 400 points

[2/5] Vérification de la récompense...
  Récompense: Café gratuit
  Points requis: 150

[3/5] Échange de la récompense...
  ✅ Coupon généré: ECO-2026-XXXXX

[4/5] Vérification du solde APRÈS échange...
  Solde APRÈS: 250 points

[5/5] Vérification de la déduction...
  ✅ TEST RÉUSSI!
```

### Test Manuel dans le Frontend

1. **Aller sur:** http://localhost:4200
2. **Se connecter** en tant que citoyen (ID 1)
3. **Aller sur un profil partenaire**
4. **Vérifier le solde:** "400 points" (ou autre valeur)
5. **Cliquer "Échanger"** sur une offre à 150 points
6. **Observer le modal** avec le QR code
7. **Recharger la page** (F5)
8. **Vérifier le nouveau solde:** "250 points" ✅

---

## 📷 TESTER LE SCANNER QR

### Depuis l'Espace Partenaire

1. **Se déconnecter** du compte citoyen
2. **Se connecter** en tant que partenaire
3. **Aller dans "Scanner Coupon"**
4. **Cliquer sur "📷 Scanner QR"**
5. **Autoriser l'accès à la caméra** (popup)
6. **Présenter un QR code** devant la caméra
   - Utilisez le QR téléchargé depuis un échange
   - Ou affichez-le sur un autre écran/téléphone
7. **Observer:** Le code est extrait et validé automatiquement ✅

---

## 🔍 VÉRIFICATIONS

### Services en Cours d'Exécution

```powershell
# Vérifier Docker
docker ps | findstr utilisateur
# Devrait montrer: ecopria-utilisateur ... Up ... 0.0.0.0:8082->8082/tcp

# Vérifier Service-Recompense (local)
netstat -ano | findstr 9093
# Devrait montrer: TCP 0.0.0.0:9093 ... LISTENING

# Vérifier Frontend
netstat -ano | findstr 4200
# Devrait montrer: TCP 0.0.0.0:4200 ... LISTENING
```

### APIs Fonctionnelles

```powershell
# Service-Utilisateur
curl http://localhost:8082/actuator/health
curl http://localhost:8082/api/users/1/points

# Service-Recompense
curl http://localhost:9093/actuator/health
curl http://localhost:9093/api/recompenses

# Frontend
curl http://localhost:4200
```

### Base de Données

```powershell
# Vérifier les points d'un citoyen
mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026 db_utilisateur -e "SELECT auth_id, total_points FROM citizens WHERE auth_id = 1"

# Vérifier les coupons
mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense -e "SELECT code, status, points_utilises FROM coupons ORDER BY created_at DESC LIMIT 5"
```

---

## 🐛 DÉPANNAGE

### Problème: Service-Utilisateur ne démarre pas

**Solution 1: Voir les logs**
```powershell
docker logs ecopria-utilisateur
```

**Solution 2: Redémarrer MySQL**
```powershell
docker restart <mysql-container>
```

**Solution 3: Rebuild complet**
```powershell
.\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1
```

### Problème: Service-Recompense erreur de compilation

**Vérifier Java:**
```powershell
java -version
# Si > Java 21, utiliser Docker aussi
```

**Nettoyer et recompiler:**
```powershell
cd backend\service-recompense
mvn clean
mvn compile
mvn spring-boot:run
```

### Problème: Frontend erreur de build

**Réinstaller les dépendances:**
```powershell
cd frontend
rmdir /s /q node_modules
npm install
npm run start
```

### Problème: Port déjà utilisé

**Trouver et tuer le processus:**
```powershell
# Exemple pour le port 9093
netstat -ano | findstr 9093
# Noter le PID
taskkill /PID <PID> /F
```

---

## 📊 FLUX COMPLET DE TEST

### Scénario: Du Point au QR Code

**Durée:** 3 minutes

1. **Préparer les données** (si nécessaire):
   ```sql
   UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
   ```

2. **Frontend - Citoyen:**
   - Se connecter (auth_id = 1)
   - Aller sur profil partenaire
   - Voir: "400 points" en haut
   - Cliquer "Échanger" sur offre 150 pts
   - **Modal s'affiche avec QR code** ✅
   - Télécharger le QR (📥)
   - Recharger la page (F5)
   - Voir: "250 points" ✅

3. **Vérifier en BD:**
   ```sql
   SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;
   -- Résultat: 250 points ✅
   
   SELECT * FROM point_history WHERE citizen_auth_id = 1 ORDER BY date DESC LIMIT 1;
   -- Résultat: -150 points, "Échange récompense: ..." ✅
   ```

4. **Frontend - Partenaire:**
   - Se déconnecter
   - Se connecter (compte partenaire)
   - Aller dans "Scanner Coupon"
   - Cliquer "📷 Scanner QR"
   - Scanner le QR téléchargé
   - **Coupon validé automatiquement** ✅

5. **Vérifier la validation:**
   ```sql
   SELECT code, status FROM coupons ORDER BY created_at DESC LIMIT 1;
   -- Résultat: status = UTILISE ✅
   ```

✅ **FLUX COMPLET FONCTIONNEL!**

---

## 🎯 CHECKLIST DE DÉMARRAGE

### Avant de Commencer:
- [ ] MySQL est démarré (Docker)
- [ ] Ports 3307 et 3311 disponibles
- [ ] Docker Desktop est lancé
- [ ] Terminals disponibles (2 minimum)

### Démarrage:
- [ ] Service-Utilisateur démarré (Docker)
  ```powershell
  .\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1
  ```
- [ ] Service-Recompense démarré (Terminal 1)
  ```powershell
  cd backend\service-recompense
  mvn spring-boot:run
  ```
- [ ] Frontend démarré (Terminal 2)
  ```powershell
  cd frontend
  npm run start
  ```

### Vérifications:
- [ ] http://localhost:8082/actuator/health → UP
- [ ] http://localhost:9093/actuator/health → UP
- [ ] http://localhost:4200 → Page Angular
- [ ] Test automatique réussi
  ```powershell
  .\test-deduction-points.ps1
  ```

### Tests Fonctionnels:
- [ ] Connexion citoyen OK
- [ ] Affichage du solde de points OK
- [ ] Échange d'offre OK
- [ ] QR code généré et téléchargeable
- [ ] Points déduits en BD
- [ ] Scanner QR avec caméra OK
- [ ] Validation du coupon OK

---

## 💡 COMMANDES RAPIDES

### Redémarrer Tout

```powershell
# 1. Redémarrer Service-Utilisateur
docker restart ecopria-utilisateur

# 2. Redémarrer Service-Recompense
# Ctrl+C dans le terminal, puis:
cd backend\service-recompense
mvn spring-boot:run

# 3. Redémarrer Frontend
# Ctrl+C dans le terminal, puis:
cd frontend
npm run start
```

### Voir les Logs

```powershell
# Service-Utilisateur (Docker)
docker logs ecopria-utilisateur -f

# Service-Recompense (local)
# Les logs s'affichent dans le terminal

# Frontend (local)
# Les logs s'affichent dans le terminal
```

### Tests Rapides

```powershell
# Test déduction automatique
.\test-deduction-points.ps1

# Test flux complet
.\test-qr-code-flow.ps1

# Vérifier données
.\verifier-donnees.ps1
```

---

## 📚 DOCUMENTATION

- **`GUIDE-COMPLET-DEDUCTION-POINTS-ET-QR-SCANNER.md`** - Guide technique complet
- **`RESUME-FINAL-IMPLEMENTATION.md`** - Vue d'ensemble
- **`COMMANDES-ESSENTIELLES.md`** - Toutes les commandes
- **`DEMARRAGE-FINAL.md`** - Ce fichier

---

## 🎉 C'EST PARTI!

**Commande unique pour tout démarrer:**

```powershell
# Dans le dossier racine du projet
.\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1

# Puis dans Terminal 1:
cd backend\service-recompense
mvn spring-boot:run

# Puis dans Terminal 2:
cd frontend
npm run start
```

**Attendez 3-4 minutes et testez:**
```powershell
.\test-deduction-points.ps1
```

**Tout devrait être vert! ✅**

---

**BON DÉVELOPPEMENT! 🚀**

