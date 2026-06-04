# ✅ Étapes Finales pour Résoudre le Problème "0 Points"

## 🎯 Situation Actuelle

1. ✅ Frontend modifié avec logs de débogage
2. ✅ Scripts de test créés
3. ❌ **Service backend ne démarre pas** (problème Java 25 vs Java 21)

---

## 🚀 ÉTAPES À SUIVRE MAINTENANT

### ÉTAPE 1 : Installer Java 21 (OBLIGATOIRE)

Le service nécessite Java 21, pas Java 25.

#### Option A : Avec Chocolatey (5 min)

```powershell
# Installer Java 21
choco install temurin21

# Vérifier
java -version
# Devrait afficher: openjdk version "21.0.x"
```

#### Option B : Téléchargement (10 min)

1. Télécharger depuis : https://adoptium.net/temurin/releases/?version=21
2. Installer le fichier téléchargé
3. Configurer JAVA_HOME (voir SOLUTION-JAVA-VERSION.md)

---

### ÉTAPE 2 : Démarrer le Service

```powershell
cd C:\Users\user\Desktop\ecopria\backend\service-utilisateur

# Nettoyer
./mvnw clean

# Démarrer
./mvnw spring-boot:run
```

Le service devrait démarrer et afficher :
```
Started UtilisateurApplication in X.XXX seconds
```

---

### ÉTAPE 3 : Tester l'API Backend

**Dans un NOUVEAU terminal** (laisser le service tourner dans l'autre) :

```powershell
cd C:\Users\user\Desktop\ecopria
.\test-api-simple.ps1
```

**Résultat attendu :**
```
✅ Service actif: UP
✅ Points récupérés: 400
✅ Profil récupéré: John Doe
```

**Si "Points: 0"** → Corriger la DB :
```sql
mysql -u ecopria -p -h localhost -P 3307
USE db_utilisateur;
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

---

### ÉTAPE 4 : Tester le Frontend

1. Ouvrir : `http://localhost:4200/partenaires/2`
2. Appuyer sur **F12** (Console)
3. Vérifier les logs :

```
🔍 Vérification authentification:
   - User ID: 1
   - Is Logged In: true

✅ Réponse API reçue: {totalPoints: 400}

💰 Solde de points assigné: 400 points
```

**L'interface devrait maintenant afficher : "400 points"**

---

### ÉTAPE 5 : Tester l'Échange Complet

1. Cliquer sur **"Échanger"** pour une offre
2. Confirmer
3. Noter le code généré (ex: `ECO-2026-XXXXX`)
4. Valider le code partenaire :

```powershell
# Dans le script de test
.\test-echange-api.ps1
```

---

## 📊 Checklist Complète

- [ ] **Java 21 installé** (`java -version` → 21.0.x)
- [ ] **Service backend démarré** (`./mvnw spring-boot:run`)
- [ ] **API testée** (`.\test-api-simple.ps1` → Points: 400)
- [ ] **DB vérifiée** (total_points = 400 pour auth_id = 1)
- [ ] **Frontend testé** (F12 → Console → logs visibles)
- [ ] **Interface affiche** "400 points"
- [ ] **Échange testé** (code coupon généré)
- [ ] **Validation testée** (code validé par partenaire)

---

## 🗂️ Fichiers Importants

| Fichier | Utilité |
|---------|---------|
| **SOLUTION-JAVA-VERSION.md** | Guide complet pour Java 21 |
| **test-api-simple.ps1** | Tester le backend |
| **test-echange-api.ps1** | Tester l'échange complet |
| **TEST-DIRECT-API.md** | Tests manuels de l'API |
| **DEBUG-POINTS-FRONTEND.md** | Diagnostic frontend |

---

## 🎯 Diagnostic Rapide

### Backend ne démarre pas ?
→ **SOLUTION-JAVA-VERSION.md**

### Backend OK mais frontend affiche 0 ?
→ **DEBUG-POINTS-FRONTEND.md**

### Points à 0 dans l'API ?
→ Mettre à jour la DB :
```sql
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

---

## ✨ Résumé en 5 Étapes

1. **Installer Java 21**
2. **Démarrer service** : `./mvnw spring-boot:run`
3. **Tester API** : `.\test-api-simple.ps1`
4. **Ouvrir frontend** : F12 → Console
5. **Vérifier affichage** : "400 points"

---

## 🆘 Besoin d'Aide ?

| Problème | Solution |
|----------|----------|
| Java 25 installé | SOLUTION-JAVA-VERSION.md |
| Service ne compile pas | Installer Java 21 |
| API retourne 0 | Mettre à jour la DB |
| Frontend affiche 0 | DEBUG-POINTS-FRONTEND.md |
| Tout semble OK mais affichage 0 | Vider cache + Ctrl+R |

---

**COMMENCEZ PAR : Installer Java 21** 🚀

Ensuite tout devrait fonctionner !
