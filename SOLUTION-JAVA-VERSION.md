# 🔧 Solution au Problème de Compilation Java

## 🎯 Problème

Le service ne compile pas à cause d'une incompatibilité de version Java :
- **Version installée** : Java 25.0.1
- **Version requise** : Java 21

## ⚡ Solution Rapide : Installer Java 21

### Option A : Avec Chocolatey (Recommandé)

```powershell
# Installer Chocolatey si pas déjà installé
# Suivre: https://chocolatey.org/install

# Installer Java 21
choco install temurin21

# Définir JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

### Option B : Téléchargement Manuel

1. **Télécharger Java 21** depuis [Adoptium](https://adoptium.net/temurin/releases/?version=21)
2. **Installer** le fichier téléchargé
3. **Configurer JAVA_HOME** :

```powershell
# Vérifier où Java 21 est installé
dir "C:\Program Files\Eclipse Adoptium\"

# Définir JAVA_HOME temporairement
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Vérifier
java -version
# Devrait afficher: openjdk version "21.0.x"
```

4. **Définir JAVA_HOME de manière permanente** :
   - Panneau de configuration → Système → Paramètres système avancés
   - Variables d'environnement
   - Nouvelle variable système :
     - Nom : `JAVA_HOME`
     - Valeur : `C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot`
   - Modifier `Path` et ajouter : `%JAVA_HOME%\bin`

---

## 🚀 Après Installation de Java 21

### 1. Vérifier la Version

```powershell
java -version
```

Devrait afficher :
```
openjdk version "21.0.x" ...
```

### 2. Nettoyer et Recompiler

```powershell
cd C:\Users\user\Desktop\ecopria\backend\service-utilisateur
./mvnw clean
./mvnw compile
```

### 3. Démarrer le Service

```powershell
./mvnw spring-boot:run
```

---

## 🔄 Alternative : Utiliser Java 25 (Non Recommandé)

Si vous ne pouvez pas installer Java 21, vous pouvez essayer de mettre à jour Spring Boot, mais cela peut causer d'autres problèmes :

**PAS RECOMMANDÉ - seulement si vraiment nécessaire**

---

## ✅ Une Fois Java 21 Installé

### Tester l'API

```powershell
# Dans un nouveau terminal (après démarrage du service)
cd C:\Users\user\Desktop\ecopria
.\test-api-simple.ps1
```

Cela testera automatiquement :
- ✅ Le service est actif
- ✅ L'API retourne les points
- ✅ Le profil est accessible

---

## 📊 Récapitulatif

| Étape | Commande | Résultat attendu |
|-------|----------|------------------|
| 1. Installer Java 21 | `choco install temurin21` | Java 21 installé |
| 2. Vérifier | `java -version` | "21.0.x" |
| 3. Nettoyer | `./mvnw clean` | BUILD SUCCESS |
| 4. Compiler | `./mvnw compile` | BUILD SUCCESS |
| 5. Démarrer | `./mvnw spring-boot:run` | Service démarré |
| 6. Tester | `.\test-api-simple.ps1` | Points récupérés |

---

## 🆘 En Cas de Problème

### Problème : Plusieurs versions de Java installées

```powershell
# Vérifier toutes les installations Java
where.exe java

# Devrait pointer vers Java 21
# Si ce n'est pas le cas, modifier PATH ou JAVA_HOME
```

### Problème : Maven utilise toujours Java 25

```powershell
# Forcer Maven à utiliser Java 21
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"

# Vérifier
./mvnw -version
```

### Problème : Erreur Lombok persiste

```powershell
# Supprimer complètement le dossier target
Remove-Item -Recurse -Force target

# Recompiler from scratch
./mvnw clean compile
```

---

## 🎯 Pourquoi Java 21 ?

- Spring Boot 3.2.5 est optimisé pour Java 21
- Lombok n'est pas encore totalement compatible avec Java 25
- Le projet a été développé avec Java 21

---

## ✨ Après Résolution

Une fois le service démarré avec succès, vous pourrez :
1. ✅ Tester l'API backend avec `.\test-api-simple.ps1`
2. ✅ Vérifier les points de l'utilisateur
3. ✅ Tester le frontend
4. ✅ Faire un échange complet de points

---

**Commencez par installer Java 21 !** 🚀
