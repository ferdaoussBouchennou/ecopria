# ✅ SOLUTION: Accès à mysql-auth via phpMyAdmin

## Le problème rencontré
Erreur: "Access denied for user 'ecopria'@'172.18.0.1' (using password: YES)"

## 🎯 SOLUTION RAPIDE (fonctionne à 100%)

### Accédez à phpMyAdmin
URL: **http://localhost:8888**

### Utilisez ces identifiants ROOT
- **Serveur**: `mysql-auth`
- **Utilisateur**: `root`
- **Mot de passe**: `root`

✅ Avec l'utilisateur `root`, vous avez accès complet à la base `db_auth`!

---

## 🔧 Explication technique

Le conteneur Docker MySQL crée automatiquement:
- Un utilisateur `root` avec le mot de passe `MYSQL_ROOT_PASSWORD`
- Un utilisateur `ecopria` avec des privilèges sur `db_auth`

MAIS, lorsque vous accédez via phpMyAdmin depuis Docker, il y a parfois des restrictions de host (`localhost` vs `%` vs `172.18.x.x`).

La solution la plus simple est d'utiliser `root` qui a tous les privilèges.

---

## 📋 Liste de toutes vos bases de données

| Base de données | Conteneur | Port local | User root | Password root |
|----------------|-----------|-----------|-----------|----------------|
| db_auth | mysql-auth | 3316 | root | root |
| db_utilisateur | mysql-utilisateur | 3307 | root | root |
| db_action | mysql-action | 3308 | root | root |
| db_inscription | mysql-inscription | 3309 | root | root |
| db_presence | mysql-presence | 3310 | root | root |
| db_recompense | mysql-recompense | 3311 | root | root |
| db_admin | mysql-admin | 3312 | root | root |
| db_notification | mysql-notification | 3313 | root | root |

---

## 💡 Connexion avec un client MySQL externe

Si vous utilisez **MySQL Workbench**, **DBeaver**, ou **TablePlus**:

```
Host: localhost
Port: 3316
User: root
Password: root
Database: db_auth
```

---

## 🔒 Si vous voulez absolument utiliser 'ecopria'

Entrez dans le conteneur et modifiez manuellement:

```powershell
# Entrer dans le conteneur
docker exec -it mysql-auth bash

# Connectez-vous à MySQL
mysql -u root -proot

# Exécutez ces commandes SQL
CREATE USER IF NOT EXISTS 'ecopria'@'172.18.0.1' IDENTIFIED BY 'ecopria_pass_2026';
GRANT ALL PRIVILEGES ON db_auth.* TO 'ecopria'@'172.18.0.1';
GRANT ALL PRIVILEGES ON db_auth.* TO 'ecopria'@'%';
GRANT SELECT ON mysql.* TO 'ecopria'@'%';
FLUSH PRIVILEGES;
EXIT;

# Sortir du conteneur
exit
```

Mais franchement, utiliser `root` en développement local est parfaitement acceptable! 😊
