# ⚡ Solution Rapide avec Docker

## 🎯 Le Problème

Le service-utilisateur ne compile pas à cause de Java 25 vs Java 21.

## ✅ La Solution Rapide

**Utiliser Docker** qui contient Java 21 !

---

## 🚀 Étapes (5 minutes)

### 1. Vérifier que Docker est Démarré

Ouvrir Docker Desktop ou vérifier :
```powershell
docker --version
```

### 2. Exécuter le Script

```powershell
cd C:\Users\user\Desktop\ecopria
.\START-SERVICE-UTILISATEUR-DOCKER.ps1
```

Ce script va :
1. ✅ Vérifier Docker
2. ✅ Construire l'image avec Java 21
3. ✅ Démarrer le service sur port 8082
4. ✅ Tester automatiquement

### 3. Tester l'API

```powershell
.\test-api-simple.ps1
```

---

## 📊 Avantages de Docker

- ✅ **Pas besoin d'installer Java 21** localement
- ✅ **Environnement isolé** (pas de conflit)
- ✅ **Même environnement** que la production
- ✅ **Rapide** à démarrer/arrêter

---

## 🔧 Commandes Utiles

### Voir les Logs

```powershell
docker logs -f ecopria-utilisateur
```

### Arrêter le Service

```powershell
docker stop ecopria-utilisateur
```

### Redémarrer

```powershell
docker restart ecopria-utilisateur
```

### Supprimer

```powershell
docker stop ecopria-utilisateur
docker rm ecopria-utilisateur
```

---

## ✅ Une Fois Démarré

1. **Tester l'API** : `.\test-api-simple.ps1`
2. **Tester le frontend** : Ouvrir `http://localhost:4200/partenaires/2` + F12
3. **Vérifier l'affichage** : "400 points"

---

## 🆘 Si Docker n'est pas Installé

1. **Télécharger** : https://www.docker.com/products/docker-desktop
2. **Installer** Docker Desktop
3. **Démarrer** Docker Desktop
4. **Relancer** le script

---

## ⚡ C'est Tout !

Cette solution **contourne complètement** le problème de Java 25.

**Exécutez maintenant :**
```powershell
.\START-SERVICE-UTILISATEUR-DOCKER.ps1
```

Puis testez :
```powershell
.\test-api-simple.ps1
```

🚀
