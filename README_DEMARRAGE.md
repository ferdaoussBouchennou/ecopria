# 🌿 Ecopria - Guide de Démarrage Rapide

## 📦 Architecture

Ecopria est une plateforme de gestion d'actions écologiques composée de :
- **9 microservices** Spring Boot
- **1 API Gateway** Spring Cloud Gateway
- **8 bases de données** MySQL (une par service)
- **Kafka** pour la communication asynchrone
- **Frontend** Angular

---

## 🚀 Démarrage Rapide

### Option 1 : Tout dans Docker (Recommandé pour la production)

```bash
# 1. Créer le fichier .env
cp .env.example .env
# Éditez .env avec vos valeurs

# 2. Démarrer tous les services
docker-compose up -d

# 3. Vérifier les logs
docker-compose logs -f

# 4. Accéder aux services
# Frontend: http://localhost:4200
# API Gateway: http://localhost:8080
# Kafka UI: http://localhost:8090
# phpMyAdmin: http://localhost:8888
```

### Option 2 : Microservices en Local + BD/Kafka dans Docker (Développement)

**Avantages :**
- ✅ Rechargement rapide des microservices
- ✅ Debugging facile avec IDE
- ✅ Pas besoin de rebuild Docker à chaque changement
- ✅ Logs directement dans le terminal

**Étapes :**

```bash
# 1. Créer le fichier .env
cp .env.example .env
# Éditez .env avec vos valeurs

# 2. Démarrer UNIQUEMENT les bases de données et Kafka dans Docker
docker-compose up -d kafka mysql-auth mysql-utilisateur mysql-action mysql-inscription mysql-presence mysql-recompense mysql-admin mysql-notification kafka-ui phpmyadmin

# 3. Vérifier que Docker tourne
docker ps

# 4. Démarrer tous les microservices en local
.\start-all-services.ps1

# OU démarrer un service individuellement
cd backend/service-action
mvn spring-boot:run
```

**Arrêter les services :**
```bash
# Arrêter tous les microservices Java
.\stop-all-services.ps1

# Arrêter Docker
docker-compose down
```

---

## 📋 Ports et Services

### Microservices
| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8080 | Point d'entrée unique |
| auth-service | 8081 | Authentification |
| utilisateur-service | 8082 | Gestion utilisateurs |
| inscription-service | 8084 | Inscriptions aux actions |
| presence-service | 8085 | Gestion des présences |
| notification-service | 8086 | Notifications email |
| admin-service | 8087 | Administration |
| action-service | 9090 | Gestion des actions |
| recompense-service | 9093 | Récompenses |

### Infrastructure
| Service | Port | URL |
|---------|------|-----|
| Frontend | 4200 | http://localhost:4200 |
| Kafka | 29092 | localhost:29092 |
| Kafka UI | 8090 | http://localhost:8090 |
| phpMyAdmin | 8888 | http://localhost:8888 |

### Bases de données MySQL
| Service | Port | Base |
|---------|------|------|
| mysql-auth | 3316 | db_auth |
| mysql-utilisateur | 3307 | db_utilisateur |
| mysql-action | 3308 | db_action |
| mysql-inscription | 3309 | db_inscription |
| mysql-presence | 3310 | db_presence |
| mysql-recompense | 3311 | db_recompense |
| mysql-admin | 3312 | db_admin |
| mysql-notification | 3313 | db_notification |

**Credentials MySQL :**
- Username: `ecopria`
- Password: (défini dans `.env`)

---

## 🔧 Configuration

### Fichier .env

Le fichier `.env` contient les variables d'environnement sensibles :

```env
MYSQL_ROOT_PASSWORD=root_password_secure_2026
MYSQL_PASSWORD=ecopria_pass_2026
EMAIL_USERNAME=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application
```

### Configuration Gmail pour les notifications

1. Allez sur https://myaccount.google.com/apppasswords
2. Créez un mot de passe d'application
3. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

---

## 🧪 Tests et Vérification

### Vérifier la santé des services

```bash
# API Gateway
curl http://localhost:8080/actuator/health

# Service Action
curl http://localhost:9090/actuator/health

# Tous les services
curl http://localhost:8081/actuator/health  # auth
curl http://localhost:8082/actuator/health  # utilisateur
curl http://localhost:8084/actuator/health  # inscription
curl http://localhost:8085/actuator/health  # presence
curl http://localhost:8086/actuator/health  # notification
curl http://localhost:8087/actuator/health  # admin
curl http://localhost:9093/actuator/health  # recompense
```

### Vérifier Kafka

```bash
# Accéder à Kafka UI
http://localhost:8090

# Vérifier les topics
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### Vérifier les bases de données

```bash
# Accéder à phpMyAdmin
http://localhost:8888

# Ou via ligne de commande
docker exec -it mysql-action mysql -u ecopria -p
```

---

## 📚 Documentation Détaillée

- **[DEMARRAGE_LOCAL.md](./DEMARRAGE_LOCAL.md)** - Guide détaillé pour exécution locale
- **[docker-compose.yml](./docker-compose.yml)** - Configuration Docker complète

---

## 🐛 Dépannage

### Docker ne démarre pas
```bash
# Vérifier Docker Desktop
docker --version
docker ps

# Redémarrer Docker Desktop
```

### Port déjà utilisé
```bash
# Windows - Trouver le processus
netstat -ano | findstr :8080

# Tuer le processus
taskkill /PID <PID> /F
```

### Erreur de connexion MySQL
```bash
# Vérifier que les conteneurs MySQL sont lancés
docker ps | findstr mysql

# Voir les logs
docker logs mysql-action

# Redémarrer un conteneur
docker restart mysql-action
```

### Erreur de connexion Kafka
```bash
# Vérifier Kafka
docker ps | findstr kafka
docker logs kafka

# Redémarrer Kafka
docker restart kafka
```

### Microservice ne démarre pas
```bash
# Nettoyer et recompiler
cd backend/service-action
mvn clean install

# Vérifier les logs
mvn spring-boot:run
```

---

## 🔄 Workflow de Développement Recommandé

1. **Démarrer l'infrastructure** (une fois par session)
   ```bash
   docker-compose up -d kafka mysql-auth mysql-utilisateur mysql-action mysql-inscription mysql-presence mysql-recompense mysql-admin mysql-notification
   ```

2. **Démarrer les microservices** que vous développez
   ```bash
   cd backend/service-action
   mvn spring-boot:run
   ```

3. **Développer et tester**
   - Les changements sont rechargés automatiquement avec Spring DevTools
   - Les logs apparaissent directement dans le terminal

4. **Arrêter proprement**
   ```bash
   # Ctrl+C dans chaque terminal de microservice
   # Puis arrêter Docker
   docker-compose down
   ```

---

## 📞 Support

Pour plus d'informations, consultez :
- Documentation Spring Boot : https://spring.io/projects/spring-boot
- Documentation Kafka : https://kafka.apache.org/documentation/
- Documentation Angular : https://angular.io/docs

---

## ✅ Checklist de Démarrage

- [ ] Docker Desktop installé et lancé
- [ ] Java 17+ installé (`java -version`)
- [ ] Maven installé (`mvn -version`)
- [ ] Node.js installé pour le frontend (`node -v`)
- [ ] Fichier `.env` créé et configuré
- [ ] Kafka et MySQL lancés dans Docker
- [ ] Microservices démarrés (local ou Docker)
- [ ] Frontend accessible sur http://localhost:4200
- [ ] API Gateway accessible sur http://localhost:8080

---

**Bon développement ! 🌿**
