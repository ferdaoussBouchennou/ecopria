# ⚡ DÉMARRAGE RAPIDE - 3 COMMANDES

---

## 1️⃣ Service-Utilisateur

**CHOISISSEZ UNE OPTION:**

### Option A: Docker (Recommandé - Fonctionne toujours)

```powershell
.\REBUILD-SERVICE-UTILISATEUR-DOCKER.ps1
```

⏱️ **Durée:** 3 minutes  
✅ **Prêt quand vous voyez:** "✅ Service prêt!"

### Option B: Local avec Java 21

```powershell
cd backend\service-utilisateur
.\run-with-java21.ps1
```

⚠️ **Nécessite:** Java 21 installé  
📚 **Guide:** [INSTALLER-JAVA-21.md](INSTALLER-JAVA-21.md)

---

## 2️⃣ Service-Recompense (Terminal 1)

```powershell
cd backend\service-recompense
mvn spring-boot:run
```

⏱️ **Durée:** 30 secondes  
✅ **Prêt quand vous voyez:** "Started ServiceRecompenseApplication"

---

## 3️⃣ Frontend (Terminal 2)

```powershell
cd frontend
npm run start
```

⏱️ **Durée:** 10 secondes  
✅ **Prêt quand vous voyez:** "✔ Compiled successfully"  
🌐 **URL:** http://localhost:4200

---

## 🧪 Tester

```powershell
.\test-deduction-points.ps1
```

✅ **Si tout est vert, c'est bon!**

---

## 🐛 En cas de problème

**Service-Utilisateur:**
```powershell
docker logs ecopria-utilisateur
```

**Service-Recompense:**
- Vérifier les erreurs dans le terminal
- Redémarrer: Ctrl+C puis `mvn spring-boot:run`

**Frontend:**
- Vérifier les erreurs dans le terminal
- Redémarrer: Ctrl+C puis `npm run start`

---

## 📚 Plus d'infos

Consultez: **`DEMARRAGE-FINAL.md`**

