# ⚡ COMMANDES ESSENTIELLES

**Guide ultra-rapide des commandes importantes**

---

## 🚀 DÉMARRAGE

### Compiler les Services Backend

```powershell
# Service-Utilisateur
cd backend\service-utilisateur
mvn clean package -DskipTests

# Service-Recompense
cd backend\service-recompense
mvn clean package -DskipTests
```

### Démarrer les Services

```powershell
# Terminal 1 - Service-Utilisateur
.\START-SERVICE-UTILISATEUR-LOCAL.ps1

# OU manuellement:
cd backend\service-utilisateur
mvn spring-boot:run
```

```powershell
# Terminal 2 - Service-Recompense
.\START-SERVICE-RECOMPENSE-LOCAL.ps1

# OU manuellement:
cd backend\service-recompense
mvn spring-boot:run
```

```powershell
# Terminal 3 - Frontend
cd frontend
npm run start
```

---

## 🧪 TESTS

### Test Automatique de la Déduction

```powershell
.\test-deduction-points.ps1
```

### Test du Flux Complet

```powershell
.\test-qr-code-flow.ps1
```

### Vérifier les Données

```powershell
.\verifier-donnees.ps1
```

---

## 🔍 VÉRIFICATIONS

### Vérifier que les Services Tournent

```powershell
# Service-Utilisateur
curl http://localhost:8082/actuator/health

# Service-Recompense
curl http://localhost:9093/actuator/health
```

### Vérifier le Solde d'un Citoyen

```powershell
curl http://localhost:8082/api/users/1/points
```

### Vérifier MySQL

```powershell
# MySQL Utilisateur (port 3307)
mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026 db_utilisateur

# MySQL Recompense (port 3311)
mysql -h localhost -P 3311 -u ecopria -pecopria_pass_2026 db_recompense
```

---

## 🗄️ REQUÊTES SQL UTILES

### Solde des Points

```sql
-- Voir le solde d'un citoyen
SELECT auth_id, first_name, last_name, total_points 
FROM citizens 
WHERE auth_id = 1;

-- Historique des points
SELECT * 
FROM point_history 
WHERE citizen_auth_id = 1 
ORDER BY date DESC 
LIMIT 10;
```

### Coupons

```sql
-- Voir les coupons d'un citoyen
SELECT code, status, points_utilises, created_at, expire_le
FROM coupons
WHERE user_id = 1
ORDER BY created_at DESC;

-- Vérifier un coupon spécifique
SELECT * FROM coupons WHERE code = 'ECO-2026-XXXXX';
```

### Récompenses

```sql
-- Voir les récompenses disponibles
SELECT id, title, points_necessaires, stock, is_active
FROM recompenses
WHERE is_active = 1;
```

---

## 🐛 DÉPANNAGE

### Arrêter un Processus sur un Port

```powershell
# Trouver le processus
netstat -ano | findstr "8082"

# Noter le PID, puis tuer:
taskkill /PID <PID> /F
```

### Redémarrer MySQL (Docker)

```powershell
docker restart <mysql-container-id>

# Ou si docker-compose:
docker-compose restart mysql-utilisateur
docker-compose restart mysql-recompense
```

### Réinstaller les Dépendances Frontend

```powershell
cd frontend
rmdir /s /q node_modules
npm install
```

### Nettoyer et Recompiler

```powershell
# Backend
cd backend\service-utilisateur
mvn clean
mvn package -DskipTests

# Frontend
cd frontend
rmdir /s /q dist
npm run build
```

---

## 📊 LOGS ET MONITORING

### Voir les Logs en Direct

```powershell
# Service-Utilisateur (si démarré avec le script)
# Les logs s'affichent dans le terminal

# Service-Recompense (si démarré avec le script)
# Les logs s'affichent dans le terminal
```

### Vérifier les Erreurs dans les Logs

Cherchez dans les logs:
- `ERROR` - Erreurs critiques
- `WARN` - Avertissements
- `Appel API` - Appels entre services
- `Points déduits` - Confirmation de déduction

---

## 🔧 UTILITAIRES

### Vérifier Java

```powershell
java -version
# Devrait afficher: Java 21+
```

### Vérifier Maven

```powershell
mvn -version
```

### Vérifier Node/npm

```powershell
node --version
npm --version
```

### Vérifier les Ports Utilisés

```powershell
netstat -ano | findstr "8082 9093 4200 3307 3311"
```

---

## 📦 BUILD PRODUCTION

### Frontend

```powershell
cd frontend
npm run build -- --configuration production
```

### Backend (JAR)

```powershell
# Service-Utilisateur
cd backend\service-utilisateur
mvn clean package

# Le JAR sera dans: target\service-utilisateur-*.jar

# Service-Recompense
cd backend\service-recompense
mvn clean package

# Le JAR sera dans: target\service-recompense-*.jar
```

### Exécuter les JARs

```powershell
# Service-Utilisateur
java -jar backend\service-utilisateur\target\service-utilisateur-*.jar

# Service-Recompense
java -jar backend\service-recompense\target\service-recompense-*.jar
```

---

## 🔄 WORKFLOW QUOTIDIEN

### Démarrage le Matin

```powershell
# 1. Démarrer MySQL (si Docker)
docker-compose up -d mysql-utilisateur mysql-recompense

# 2. Démarrer les services backend (2 terminaux)
.\START-SERVICE-UTILISATEUR-LOCAL.ps1
.\START-SERVICE-RECOMPENSE-LOCAL.ps1

# 3. Démarrer le frontend (terminal 3)
cd frontend
npm run start
```

### Arrêt le Soir

```powershell
# 1. Arrêter le frontend (Ctrl+C dans le terminal)

# 2. Arrêter les services backend (Ctrl+C dans chaque terminal)

# 3. Arrêter MySQL (si Docker)
docker-compose stop
```

---

## ⚡ RACCOURCIS

### Test Rapide Complet

```powershell
# Tester tout en une commande
.\test-deduction-points.ps1 ; .\test-qr-code-flow.ps1
```

### Vérification Rapide des Services

```powershell
curl http://localhost:8082/api/users/1/points ; curl http://localhost:9093/api/recompenses
```

### Rebuild Complet

```powershell
# Backend
cd backend\service-utilisateur ; mvn clean package -DskipTests ; cd ..\..
cd backend\service-recompense ; mvn clean package -DskipTests ; cd ..\..

# Frontend
cd frontend ; npm run build ; cd ..
```

---

## 📱 TESTS FRONTEND

### Ouvrir la Console du Navigateur

```
F12
```

### Vérifier le localStorage

```javascript
// Dans la console (F12)
console.log(localStorage.getItem('ecopria_user_id'));
console.log(localStorage.getItem('ecopria_role'));
```

### Tester une API depuis la Console

```javascript
// Dans la console (F12)
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 🎯 POINTS DE VÉRIFICATION

### Avant de Commencer à Coder

- [ ] MySQL tourne (ports 3307 et 3311)
- [ ] Service-Utilisateur compilé
- [ ] Service-Recompense compilé
- [ ] Frontend avec dépendances installées

### Avant de Tester

- [ ] Service-Utilisateur démarré (8082)
- [ ] Service-Recompense démarré (9093)
- [ ] Frontend démarré (4200)
- [ ] Navigateur ouvert sur http://localhost:4200

### Après Modification du Code

- [ ] Backend recompilé (`mvn package`)
- [ ] Services redémarrés
- [ ] Frontend recompilé (`npm run build`)
- [ ] Navigateur rafraîchi (Ctrl+Shift+R)

---

**🔖 GARDEZ CE FICHIER OUVERT PENDANT LE DÉVELOPPEMENT!**

