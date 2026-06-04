# 📥 Installer Java 21 (À côté de Java 25)

**Problème:** Lombok ne fonctionne pas avec Java 25  
**Solution:** Installer Java 21 sans désinstaller Java 25

---

## ⚡ SOLUTION RAPIDE (Recommandée)

**Utilisez Docker** (pas besoin d'installer Java 21):

```powershell
.\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1
```

✅ Avantages:
- Pas d'installation nécessaire
- Fonctionne immédiatement
- Isolation parfaite

---

## 📦 SOLUTION: Installer Java 21

### Étape 1: Télécharger Java 21

**Option A: Eclipse Temurin (Recommandé)**
1. Aller sur: https://adoptium.net/
2. Choisir: Java 21 (LTS)
3. Télécharger: Windows x64 MSI

**Option B: Oracle JDK**
1. Aller sur: https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html
2. Télécharger: Windows x64 Installer

### Étape 2: Installer

1. Lancer l'installateur
2. **IMPORTANT:** Choisir un chemin différent:
   - Java 25: `C:\Program Files\Java\jdk-25`
   - Java 21: `C:\Program Files\Java\jdk-21` ✅

3. Ne PAS modifier JAVA_HOME (garder Java 25 par défaut)

### Étape 3: Vérifier l'Installation

```powershell
# Java par défaut (25)
java -version

# Java 21 (chemin complet)
"C:\Program Files\Java\jdk-21\bin\java.exe" -version
```

### Étape 4: Utiliser le Script

```powershell
cd backend\service-utilisateur
.\run-with-java21.ps1
```

Le script:
1. Trouve automatiquement Java 21
2. Configure JAVA_HOME temporairement
3. Démarre le service

---

## 🔧 CONFIGURATION MANUELLE

### Option 1: Variable d'Environnement Temporaire

```powershell
# Terminal PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
cd backend\service-utilisateur
./mvnw spring-boot:run
```

### Option 2: Modifier mvnw (Permanent)

Éditer `backend/service-utilisateur/mvnw.cmd`:

```batch
@REM Ajouter au début du fichier
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
```

### Option 3: Alias PowerShell

Ajouter à votre profil PowerShell (`$PROFILE`):

```powershell
function Start-UtilisateurJava21 {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
    cd "C:\Users\user\Desktop\ecopria\backend\service-utilisateur"
    ./mvnw spring-boot:run
}

Set-Alias -Name utilisateur -Value Start-UtilisateurJava21
```

Puis utiliser:
```powershell
utilisateur
```

---

## 🐛 DÉPANNAGE

### Problème: "Java 21 non trouvé"

**Vérifier les chemins:**
```powershell
dir "C:\Program Files\Java"
dir "C:\Program Files\Eclipse Adoptium"
dir "C:\Program Files\Microsoft"
```

**Modifier le script:**
Éditer `run-with-java21.ps1` et ajouter votre chemin:
```powershell
$possibleJava21Paths = @(
    "VOTRE_CHEMIN_ICI\bin\java.exe",
    # ... autres chemins
)
```

### Problème: "Lombok error" persiste

**Nettoyer le cache Maven:**
```powershell
cd backend\service-utilisateur
./mvnw clean
rm -r -force ~/.m2/repository/org/projectlombok
./mvnw compile
```

### Problème: "Port already in use"

**Tuer le processus:**
```powershell
netstat -ano | findstr 8082
taskkill /PID <PID> /F
```

---

## 📊 COMPARAISON DES SOLUTIONS

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Docker** ⭐ | - Rien à installer<br>- Isolation parfaite<br>- Fonctionne immédiatement | - Nécessite Docker Desktop<br>- Un peu plus lent au démarrage |
| **Java 21 local** | - Plus rapide<br>- Debug plus facile | - Installation requise<br>- Gestion de 2 versions Java |
| **Java 21 système** | - Simple<br>- Une seule version | - Peut casser d'autres projets Java 25 |

**Recommandation:** Utilisez Docker pour ce service, gardez Java 25 pour les autres.

---

## 🎯 WORKFLOW RECOMMANDÉ

```
Service-Utilisateur  → Docker (Java 21)      ← Lombok compatible
Service-Recompense   → Local Java 25        ← Pas de Lombok
Frontend             → Local Node.js
```

**Commandes:**
```powershell
# Service-Utilisateur (Docker)
.\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1

# Service-Recompense (Local Java 25)
cd backend\service-recompense
mvn spring-boot:run

# Frontend (Local)
cd frontend
npm run start
```

---

## ✅ VÉRIFICATION

### Java 21 Correctement Installé

```powershell
# Devrait afficher: openjdk version "21.x.x"
"C:\Program Files\Java\jdk-21\bin\java.exe" -version
```

### Service Démarre

```powershell
cd backend\service-utilisateur
.\run-with-java21.ps1

# Dans un autre terminal:
curl http://localhost:8082/actuator/health
# Devrait retourner: {"status":"UP"}
```

---

## 🔗 LIENS UTILES

- Eclipse Temurin: https://adoptium.net/
- Oracle JDK: https://www.oracle.com/java/technologies/downloads/
- Lombok: https://projectlombok.org/
- Docker Desktop: https://www.docker.com/products/docker-desktop/

---

## 💡 CONCLUSION

**2 choix simples:**

1. **Facile:** Utilisez Docker (recommandé)
   ```powershell
   .\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1
   ```

2. **Avancé:** Installez Java 21 + utilisez le script
   ```powershell
   .\run-with-java21.ps1
   ```

**Les deux fonctionnent parfaitement!** Choisissez selon votre préférence.

