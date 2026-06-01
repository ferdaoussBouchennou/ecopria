# Développement local — microservices hors Docker

En phase de dev, seules **MySQL**, **Kafka** et les outils (phpMyAdmin, Kafka UI) tournent dans Docker.  
Les microservices, l’**API Gateway** et le **frontend Angular** tournent sur votre machine.

## 1. Prérequis

- Docker Desktop
- Java 17+ et Maven
- Node.js + Angular CLI (`ng`)

Copiez les variables d’environnement :

```powershell
copy .env.example .env
```

## 2. Démarrer l’infra (Docker)

```powershell
docker compose -f docker-compose.infra.yml up -d
```

| Service | URL / port hôte |
|---------|------------------|
| Kafka (depuis Windows) | `localhost:29092` |
| Kafka UI | http://localhost:8090 |
| phpMyAdmin | http://localhost:8888 |
| MySQL auth | `localhost:3316` |
| MySQL utilisateur | `localhost:3307` |
| MySQL action | `localhost:3308` |
| MySQL inscription | `localhost:3309` |
| MySQL présence | `localhost:3310` |
| MySQL récompense | `localhost:3311` |
| MySQL admin | `localhost:3312` |
| MySQL notification | `localhost:3313` |

Arrêter l’infra :

```powershell
docker compose -f docker-compose.infra.yml down
```

> **Ne pas** lancer `docker compose up -d` (fichier complet) si vous développez en local — cela démarre aussi tous les microservices en conteneurs.

## 3. Démarrer les microservices (local)

Ordre recommandé (chaque service dans un terminal ou via l’IDE) :

| Service | Dossier | Port | Commande |
|---------|---------|------|----------|
| Auth | `backend/auth-service` | 8081 | `mvn spring-boot:run` |
| Utilisateur | `backend/service-utilisateur` | 8082 | `mvn spring-boot:run` |
| Action | `backend/service-action` | 9090 | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| Utilisateur | `backend/service-utilisateur` | 8082 | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| Inscription | `backend/service-inscription` | 8084 | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| Présence | `backend/service-presence` | 8085 | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| Récompense | `backend/service-recompense` | 9093 | `mvn spring-boot:run` |
| Notification | `backend/service-notification` | 8086 | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| Admin | `backend/admin-service` | 8087 | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| **API Gateway** | `backend/api-gateway` | **8080** | `mvn spring-boot:run` |

Le profil `local` :

- active **Kafka** (`localhost:29092`) pour la communication entre microservices ;
- crée automatiquement l’association de démo et une action **PUBLISHED** (service-action + service-utilisateur) si la base est vide ;
- **aucun mock** côté Angular : si un service est arrêté, une erreur s’affiche.

## 4. Frontend

```powershell
cd frontend
ng serve
```

Le proxy (`proxy.conf.json`) envoie tout `/api` et `/admin` vers **http://localhost:8080** (gateway locale).

## 5. Schéma

```
Angular :4200  ──proxy──►  API Gateway :8080  ──►  microservices locaux
                              │
                              ├── 8081 auth
                              ├── 8082 utilisateur
                              ├── 9090 action
                              ├── 8084 inscription
                              └── …

Microservices  ──►  MySQL :3307-3316  (Docker)
              ──►  Kafka :29092       (Docker)
```

## 6. Stack minimale (un seul microservice)

Ex. vous travaillez sur **service-action** :

```powershell
docker compose -f docker-compose.infra.yml up -d mysql-action kafka
cd backend/service-action
mvn spring-boot:run -Dspring-boot.run.profiles=local
cd backend/api-gateway
mvn spring-boot:run
cd frontend
ng serve
```

## 7. Kafka en local

Par défaut, le profil `local` met `spring.kafka.listener.auto-startup: true` pour inscription, présence, action et utilisateur.  
Si Kafka n’est pas démarré, repassez à `false` ou ne lancez pas le profil `local`.

## 8. Données de test (association + participant)

Sans données en base, le profil association affiche une erreur (`Association non trouvée`).

Exécutez le script SQL dans phpMyAdmin (http://localhost:8888) :

`scripts/seed-dev-data.sql`

| Rôle | auth_id / user_id | Usage |
|------|-------------------|--------|
| Association | `auth_id = 1`, `user_id = 1` (db_action) | Espace `/association/*` |
| Participant | `auth_id = 2` | `/mes-inscriptions`, inscription |

IDs modifiables dans le navigateur :

```javascript
localStorage.setItem('ecopria.dev.associationAuthId', '1');
localStorage.setItem('ecopria.dev.participantUserId', '2');
```

## 9. Tout en Docker (CI / démo)

```powershell
docker compose up -d
```

Utilise le `docker-compose.yml` complet (microservices + gateway + frontend).

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| API Gateway | http://localhost:8088 (8080 souvent occupé par Jenkins) |
| Kafka UI | http://localhost:8090 |
| phpMyAdmin | http://localhost:8888 |

> Si vous utilisez `ng serve` avec les backends Docker, le proxy (`proxy.conf.json`) pointe déjà vers **8088**.
