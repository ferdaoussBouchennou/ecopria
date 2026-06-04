# ⭐ COMMENCEZ ICI

## 🎯 Problème : "0 points" affiché

Vous avez 400 points dans la base de données mais l'interface affiche "0 points".

---

## ✅ Solution en 3 Étapes

### 1️⃣ Ouvrir la Console (F12)

Sur la page du partenaire :
- Appuyer sur **F12**
- Aller dans **Console**

### 2️⃣ Regarder les Logs

Vous verrez des messages comme :

```
🔍 User ID: 1
🔍 Appel API: GET /api/users/1/points
✅ Réponse: {totalPoints: 400}
💰 Solde: 400 points
```

### 3️⃣ Identifier le Problème

| Si vous voyez | Solution |
|---------------|----------|
| `User ID: null` | → Reconnectez-vous |
| `Erreur API` | → Démarrer le backend |
| `totalPoints: 0` | → Mettre à jour la DB |

---

## 🚀 Test Automatique

### Windows

```powershell
.\test-echange-api.ps1
```

### Linux/Mac

```bash
chmod +x test-echange-api.sh
./test-echange-api.sh
```

---

## 📚 Documentation

| Pour | Lire |
|------|------|
| **Démarrage rapide** | `LIRE-MOI.md` |
| **Diagnostic "0 points"** | `DEBUG-POINTS-FRONTEND.md` |
| **Guide complet** | `GUIDE-RAPIDE-TEST.md` |
| **Index complet** | `INDEX-DOCUMENTATION-POINTS.md` |

---

## 🔧 Correction Rapide DB

```sql
mysql -u ecopria -p -h localhost -P 3307
USE db_utilisateur;
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

---

## ✨ C'est Tout !

1. **F12** → Console
2. **Regarder** les logs
3. **Appliquer** la solution
4. **Tester** l'échange

**Tout est documenté dans les fichiers .md ! 📖**
