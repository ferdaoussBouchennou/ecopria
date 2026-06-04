# 🎯 Comment Résoudre le Problème "0 Points"

## 📌 Situation

Vous êtes connecté avec l'utilisateur ID 1 qui a **400 points** dans la base de données, mais l'interface affiche **"0 points"**.

---

## ⚡ Solution Rapide (2 minutes)

### Étape 1 : Ouvrir la Console du Navigateur

1. Sur la page du partenaire, appuyez sur **F12**
2. Allez dans l'onglet **"Console"**

### Étape 2 : Vérifier les Logs

Vous devriez voir des messages comme :

```
🔍 Vérification authentification:
   - User ID: 1
   - Is Logged In: true
   
🔍 Appel API: GET /api/users/1/points

✅ Réponse API reçue: {totalPoints: 400}

💰 Solde de points assigné: 400 points
```

### Étape 3 : Identifier le Problème

| Ce que vous voyez | Problème | Solution |
|-------------------|----------|----------|
| `User ID: null` | Pas connecté | Reconnectez-vous |
| `User ID: 2` (ou autre) | Mauvais compte | Connectez-vous avec l'user ID 1 |
| `❌ Erreur API` | Backend | Démarrer service-utilisateur |
| `totalPoints: 0` | Base de données | Mettre à jour la DB (voir ci-dessous) |
| Tout OK mais affichage 0 | Bug d'affichage | Recharger la page (Ctrl+R) |

---

## 🔧 Solutions selon le Cas

### CAS 1 : Pas Connecté (User ID: null)

```javascript
// Dans la console du navigateur
localStorage.clear();
// Puis reconnectez-vous
```

### CAS 2 : Mauvais Compte

Option A : Se connecter avec le bon compte  
Option B : Mettre à jour les points du compte actuel :

```sql
-- Remplacer 2 par votre ID
UPDATE citizens SET total_points = 400 WHERE auth_id = 2;
```

### CAS 3 : Service Backend Non Démarré

```bash
# Vérifier
curl http://localhost:8082/actuator/health

# Démarrer si nécessaire
cd backend/service-utilisateur
mvnw spring-boot:run
```

### CAS 4 : Points à 0 dans la Base

```sql
mysql -u ecopria -p -h localhost -P 3307

USE db_utilisateur;
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

---

## 🚀 Tester l'Échange Complet

### 1. Vérifier les Points

L'interface devrait maintenant afficher : **"400 points"**

### 2. Échanger des Points

1. Cliquer sur **"Échanger"** pour une offre
2. Confirmer
3. Noter le code généré : `ECO-2026-XXXXX`

### 3. Valider le Code Partenaire

```powershell
# Windows PowerShell
.\test-echange-api.ps1
```

```bash
# Linux/Mac/Git Bash
./test-echange-api.sh
```

Ou manuellement :

```bash
curl -X POST http://localhost:8084/api/partenaire/valider-coupon \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{"code": "VOTRE-CODE-ICI"}'
```

---

## 📚 Documentation Complète

| Fichier | Description | Quand l'utiliser |
|---------|-------------|------------------|
| **GUIDE-RAPIDE-TEST.md** | Guide pas-à-pas simple | ⭐ Commencer ici |
| **DEBUG-POINTS-FRONTEND.md** | Diagnostic navigateur | Si "0 points" affiché |
| **GUIDE-TEST-ECHANGE-POINTS.md** | Documentation complète | Pour tout comprendre |
| **test-echange-api.ps1** | Script automatisé Windows | Test automatique |
| **test-echange-api.sh** | Script automatisé Linux/Mac | Test automatique |
| **INDEX-DOCUMENTATION-POINTS.md** | Index complet | Trouver l'info |

---

## ✅ Checklist Rapide

- [ ] Ouvrir F12 et regarder les logs dans la Console
- [ ] Vérifier que User ID = 1
- [ ] Vérifier que l'API retourne 400 points
- [ ] Si problème identifié, appliquer la solution correspondante
- [ ] Recharger la page
- [ ] Vérifier l'affichage : "400 points"
- [ ] Tester un échange
- [ ] Valider le code partenaire

---

## 🎯 En Bref

1. **Appuyer sur F12** → Onglet Console
2. **Regarder les logs** qui s'affichent
3. **Identifier le problème** (voir tableau ci-dessus)
4. **Appliquer la solution** correspondante
5. **Tester l'échange complet**

---

## 🆘 Besoin d'Aide ?

### Tests Rapides

```javascript
// 1. Vérifier l'ID
localStorage.getItem('ecopria_user_id')

// 2. Tester l'API
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log(d))
```

```sql
-- 3. Vérifier la DB
SELECT auth_id, total_points FROM citizens WHERE auth_id = 1;
```

### Scripts Automatisés

```powershell
# Windows
.\test-echange-api.ps1
```

```bash
# Linux/Mac
chmod +x test-echange-api.sh
./test-echange-api.sh
```

---

## 📂 Fichiers Créés

- ✅ 10 fichiers de documentation
- ✅ 2 scripts de test automatisés (PowerShell + Bash)
- ✅ 1 fichier SQL avec 40+ requêtes
- ✅ 1 collection Postman avec 30+ endpoints
- ✅ Code frontend corrigé avec logs de débogage

---

**Tout est prêt pour tester ! 🚀**

**Commencez par ouvrir F12 sur la page et regarder les logs dans la console.**
