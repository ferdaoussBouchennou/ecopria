# 🚀 Guide Rapide - Tester l'Échange de Points

## 📌 Prérequis

- MySQL démarré (port 3307)
- Service-utilisateur démarré (port 8082)
- Service-recompense démarré (port 8084)
- Frontend démarré (port 4200)
- Utilisateur ID 1 avec 400 points dans la base

---

## 🔍 ÉTAPE 1 : Vérifier les Points

### Dans le Navigateur (F12 → Console)

```javascript
// Vérifier l'utilisateur connecté
console.log('User ID:', localStorage.getItem('ecopria_user_id'));

// Tester l'API
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log('Points:', d));
```

**✅ Résultat attendu :** `{totalPoints: 400}`

**❌ Si 0 ou erreur :** Voir le fichier `RESOLUTION-FINALE-0-POINTS.md`

---

## 💰 ÉTAPE 2 : Recharger la Page

1. Aller sur une page partenaire : `http://localhost:4200/partenaires/2`
2. Vérifier l'affichage : **"400 points"** (ou le bon nombre)
3. Si toujours 0, regarder les logs dans la console du navigateur

---

## 🎁 ÉTAPE 3 : Échanger des Points

1. **Sur la page du partenaire**, choisir une offre (ex: 150 points)
2. **Cliquer sur "Échanger"**
3. **Confirmer** l'échange
4. **Noter le code coupon** généré (ex: `ECO-2026-A7K9M`)

---

## ✅ ÉTAPE 4 : Vérifier la Déduction

### Dans la Console du Navigateur

```javascript
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log('Nouveau solde:', d.totalPoints));
```

**✅ Résultat attendu :** `250` (400 - 150 = 250)

---

## 🏪 ÉTAPE 5 : Valider le Code Partenaire

### Option A : Via PowerShell

```powershell
# Remplacer ECO-2026-A7K9M par votre code
$code = "ECO-2026-A7K9M"
$body = @{code = $code} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8084/api/partenaire/valider-coupon" `
  -Method Post `
  -Headers @{"X-User-Id" = "2"; "Content-Type" = "application/json"} `
  -Body $body
```

### Option B : Via cURL (Git Bash ou Linux)

```bash
curl -X POST http://localhost:8084/api/partenaire/valider-coupon \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{"code": "ECO-2026-A7K9M"}'
```

### Option C : Via Postman

1. Ouvrir Postman
2. Importer la collection : `postman-collection-echange-points.json`
3. Aller dans **"5. Validation de Coupons" → "5.1 Valider un Coupon"**
4. Modifier le `code` dans le Body
5. Cliquer sur **"Send"**

**✅ Résultat attendu :**
```json
{
  "code": "ECO-2026-A7K9M",
  "status": "UTILISE",
  "valideLe": "2026-06-04T15:30:00",
  ...
}
```

---

## 🎉 ÉTAPE 6 : Vérifier le Statut du Coupon

### Dans la Console du Navigateur

```javascript
fetch('/api/recompenses/mes-coupons', {
  headers: {'X-User-Id': '1'}
})
  .then(r => r.json())
  .then(d => console.log('Mes coupons:', d));
```

**✅ Le coupon doit avoir le statut `"UTILISE"`**

---

## 📊 ÉTAPE 7 : Vérifier dans la Base de Données

```sql
-- Se connecter à MySQL
mysql -u ecopria -p -h localhost -P 3307

USE db_utilisateur;
-- Vérifier les points
SELECT auth_id, first_name, total_points FROM citizens WHERE auth_id = 1;

USE db_recompense;
-- Vérifier les coupons
SELECT code, status, points_utilises, valide_le 
FROM coupons 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier les commissions
SELECT montant_commission, valeur_dh, taux_commission, created_at
FROM commissions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔄 Recommencer un Test

### Réinitialiser les Points

```sql
USE db_utilisateur;
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

### Supprimer les Coupons de Test

```sql
USE db_recompense;
DELETE FROM commissions WHERE coupon_id IN (SELECT id FROM coupons WHERE user_id = 1);
DELETE FROM coupons WHERE user_id = 1;
```

### Réinitialiser le Stock d'une Offre

```sql
USE db_recompense;
UPDATE recompenses SET stock = 10, is_active = true WHERE id = 1;
```

---

## 🛠️ Scripts Automatisés

### Script PowerShell (Windows)

```powershell
.\test-echange-api.ps1
```

### Script Bash (Linux/Mac/Git Bash)

```bash
chmod +x test-echange-api.sh
./test-echange-api.sh
```

Ces scripts font tout automatiquement :
1. ✅ Vérifient les points
2. ✅ Récupèrent les offres
3. ✅ Échangent des points
4. ✅ Valident le code partenaire
5. ✅ Affichent un résumé complet

---

## 📚 Fichiers de Documentation

| Fichier | Description |
|---------|-------------|
| `GUIDE-TEST-ECHANGE-POINTS.md` | Guide complet et détaillé |
| `RESOLUTION-FINALE-0-POINTS.md` | Résolution du problème "0 points" |
| `DEBUG-POINTS-FRONTEND.md` | Diagnostic frontend dans le navigateur |
| `SOLUTION-PROBLEME-0-POINTS.md` | Solutions rapides au problème d'affichage |
| `test-points-echange.sql` | Requêtes SQL pour tests et vérifications |
| `test-echange-api.ps1` | Script PowerShell automatisé |
| `test-echange-api.sh` | Script Bash automatisé |
| `postman-collection-echange-points.json` | Collection Postman complète |

---

## ⚡ Raccourcis Clavier Utiles

- **F12** : Ouvrir les DevTools du navigateur
- **Ctrl+Shift+C** : Inspecter un élément
- **Ctrl+Shift+J** : Ouvrir directement la Console
- **Ctrl+R** : Recharger la page
- **Ctrl+Shift+R** : Recharger en vidant le cache

---

## 🐛 Problèmes Courants

### "0 points" affiché

→ Voir `RESOLUTION-FINALE-0-POINTS.md`

### "Points insuffisants" alors que j'ai assez

```sql
-- Mettre à jour manuellement
UPDATE citizens SET total_points = 400 WHERE auth_id = 1;
```

### "Coupon introuvable"

→ Vérifier que vous utilisez le bon code (sensible à la casse)

### "Ce coupon n'appartient pas à votre enseigne"

→ Vérifier que le `X-User-Id` correspond au partenaire qui a créé l'offre

### "Erreur lors de la connexion à MySQL"

```bash
# Vérifier que MySQL est démarré
docker ps | grep mysql
# Ou
netstat -an | findstr 3307
```

### "Service non disponible"

```bash
# Vérifier les services
curl http://localhost:8082/actuator/health  # service-utilisateur
curl http://localhost:8084/actuator/health  # service-recompense
```

---

## 📝 Checklist Avant de Tester

- [ ] MySQL démarré (port 3307)
- [ ] Service-utilisateur démarré (port 8082)
- [ ] Service-recompense démarré (port 8084)
- [ ] Frontend démarré (port 4200)
- [ ] Kafka démarré (port 29092) - optionnel pour les notifications
- [ ] Utilisateur créé avec auth_id = 1
- [ ] Utilisateur a 400 points dans la table `citizens`
- [ ] Au moins une offre active existe dans la table `recompenses`
- [ ] Au moins un partenaire existe avec user_id = 2

---

## 🎯 Ordre de Test Recommandé

1. **Test Backend d'abord** (via cURL ou Postman)
   - Plus facile à déboguer
   - Résultats immédiats
   - Isolation des problèmes

2. **Test Frontend ensuite** (via le navigateur)
   - Une fois le backend validé
   - Vérifier l'intégration complète

3. **Test End-to-End** (flux utilisateur complet)
   - Connexion → Navigation → Échange → Validation

---

## 🆘 Besoin d'Aide ?

Si vous êtes bloqué :

1. **Consulter les logs** dans la console du navigateur (F12)
2. **Vérifier les services** avec `curl http://localhost:PORT/actuator/health`
3. **Consulter la documentation** dans les fichiers `.md`
4. **Exécuter les scripts SQL** pour vérifier la base de données

---

**Bon test ! 🚀**
