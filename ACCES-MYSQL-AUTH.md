# Accès à la base de données mysql-auth

## Le problème
L'utilisateur `ecopria` ne peut pas accéder à la base `mysql-auth` via phpMyAdmin en raison de restrictions de permissions MySQL.

## Solution 1: Utiliser root (Recommandé)

Accédez à phpMyAdmin: http://localhost:8888

**Utilisez ces identifiants root:**
- **Serveur**: `mysql-auth`
- **Utilisateur**: `root`
- **Mot de passe**: `root`

✅ Avec root, vous avez accès complet à toutes les bases de données.

## Solution 2: Corriger les permissions pour ecopria

Si vous voulez utiliser l'utilisateur `ecopria`, exécutez ces commandes:

### Étape 1: Accédez au conteneur
```powershell
docker exec -it mysql-auth bash
```

### Étape 2: Connectez-vous à MySQL avec root
```bash
mysql -u root -p
# Mot de passe: root
```

### Étape 3: Donnez les permissions à ecopria
```sql
GRANT ALL PRIVILEGES ON db_auth.* TO 'ecopria'@'%';
GRANT ALL PRIVILEGES ON db_auth.* TO 'ecopria'@'localhost';  
GRANT SELECT ON mysql.* TO 'ecopria'@'%';
GRANT SELECT ON mysql.* TO 'ecopria'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Étape 4: Sortez du conteneur
```bash
exit
```

Ensuite accédez à phpMyAdmin avec:
- **Serveur**: `mysql-auth`
- **Utilisateur**: `ecopria`
- **Mot de passe**: `ecopria_pass_2026`

## Ports des bases de données

| Service | Port Local | Conteneur | Base de données |
|---------|-----------|-----------|----------------|
| mysql-auth | 3316 | mysql-auth | db_auth |
| mysql-utilisateur | 3307 | mysql-utilisateur | db_utilisateur |
| mysql-action | 3308 | mysql-action | db_action |
| mysql-inscription | 3309 | mysql-inscription | db_inscription |
| mysql-presence | 3310 | mysql-presence | db_presence |
| mysql-recompense | 3311 | mysql-recompense | db_recompense |
| mysql-admin | 3312 | mysql-admin | db_admin |
| mysql-notification | 3313 | mysql-notification | db_notification |

## Connexion directe (sans phpMyAdmin)

Vous pouvez aussi accéder directement via ligne de commande:

```powershell
docker exec -it mysql-auth mysql -u root -proot db_auth
```

Ou depuis votre machine (MySQL Workbench, DBeaver, etc.):
- **Host**: `localhost`
- **Port**: `3316`
- **User**: `root`
- **Password**: `root`
- **Database**: `db_auth`
