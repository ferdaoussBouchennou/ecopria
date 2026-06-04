# 🚀 DÉMARRAGE RAPIDE - Tester le QR Code

**Guide ultra-rapide pour tester les nouvelles fonctionnalités**

---

## ⚡ EN 3 COMMANDES

### 1. Démarrer le Frontend
```powershell
cd frontend
npm run start
```

Attendez que le serveur démarre (~10 secondes)  
→ Frontend disponible sur: **http://localhost:4200**

### 2. Vérifier les Services Backend
```powershell
# Dans un autre terminal
docker ps

# Devrait afficher:
# - ecopria-utilisateur (port 8082)
# - mysql:8.0 (ports 3307 et 3311)
```

Si les services ne sont pas démarrés:
```powershell
# Démarrer Service-Utilisateur
docker start ecopria-utilisateur

# OU reconstruire si nécessaire
.\START-SERVICE-UTILISATEUR-DOCKER.ps1
```

### 3. Tester le Flux Complet
```powershell
.\test-qr-code-flow.ps1
```

✅ Ce script teste automatiquement tout le flux!

---

## 🎯 TEST MANUEL DANS LE NAVIGATEUR

### Étape 1: Se Connecter
1. Allez sur **http://localhost:4200**
2. Cliquez sur "Connexion" ou "Se connecter"
3. Connectez-vous avec un citoyen qui a des points

**Identifiants de test:**
- Email: (selon votre configuration)
- Auth ID: 1

### Étape 2: Aller sur un Profil Partenaire
1. Allez dans "Partenaires" ou "Catalogue"
2. Cliquez sur un partenaire (ex: Café Botanique)
3. Vous devriez voir vos points en haut de la page

### Étape 3: Échanger une Offre
1. Trouvez une offre que vous pouvez vous permettre
2. Cliquez sur "Échanger"
3. Confirmez l'échange

### Étape 4: Admirer le QR Code! 🎉
Le modal devrait afficher:
- ✅ Un QR code généré automatiquement
- ✅ Le code coupon en texte (ECO-2026-XXXXX)
- ✅ Un bouton 📋 pour copier
- ✅ Un bouton 📥 pour télécharger le QR

---

## 🔍 DEBUG: Vérifier les Points (Si affichage "0")

### Dans le Navigateur (F12):

```javascript
// 1. Vérifier localStorage
console.log('User ID:', localStorage.getItem('ecopria_user_id'));

// 2. Tester l'API
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log('Points:', d));
```

**Si localStorage est vide:**
1. Se déconnecter
2. Vider le cache: `localStorage.clear()`
3. Se reconnecter

**Si l'API retourne une erreur:**
1. Vérifier que Service-Utilisateur tourne: `docker ps`
2. Tester directement: `curl http://localhost:8082/api/users/1/points`

---

## 📊 ÉTAT DES SERVICES

### Vérifier Rapidement:
```powershell
# Services Docker
docker ps | findstr -i "utilisateur mysql"

# Ports utilisés
netstat -ano | findstr "8082 9093 3307 3311 4200"
```

### Services Attendus:

| Service | Port | Commande Check |
|---------|------|----------------|
| Frontend Angular | 4200 | `curl http://localhost:4200` |
| Service-Utilisateur | 8082 | `curl http://localhost:8082/api/users/1/points` |
| Service-Recompense | 9093 | `curl http://localhost:9093/api/recompenses` |
| MySQL Utilisateur | 3307 | `mysql -h localhost -P 3307 -u ecopria -p` |
| MySQL Recompense | 3311 | `mysql -h localhost -P 3311 -u ecopria -p` |

---

## 🎬 SCÉNARIO DE TEST COMPLET

### Scénario: "Du Point au QR Code"

**Temps estimé:** 2 minutes

1. **Vérifier le solde (30 secondes)**
   ```sql
   mysql -h localhost -P 3307 -u ecopria -pecopria_pass_2026 db_utilisateur -e "SELECT auth_id, total_points FROM citizens WHERE auth_id = 1"
   ```
   Résultat attendu: `total_points = 400` (ou autre valeur > 0)

2. **Se connecter et naviguer (30 secondes)**
   - http://localhost:4200
   - Se connecter
   - Aller sur un profil partenaire

3. **Vérifier l'affichage des points (10 secondes)**
   - Devrait afficher votre solde en haut
   - Si "0 points": Ouvrir F12 et vérifier la console

4. **Faire un échange (30 secondes)**
   - Cliquer "Échanger" sur une offre
   - Confirmer
   - Modal avec QR s'affiche

5. **Tester les fonctionnalités QR (30 secondes)**
   - Cliquer sur 📋 → Code copié
   - Coller quelque part (Ctrl+V) → Vérifier le code
   - Cliquer sur 📥 → Fichier PNG téléchargé
   - Ouvrir le PNG → QR code visible

**✅ TEST RÉUSSI!** Si tout fonctionne, le QR code est opérationnel!

---

## 🆘 PROBLÈMES COURANTS

### Problème 1: "npm run start" échoue

**Erreur possible:** "Cannot find module" ou "dependencies missing"

**Solution:**
```powershell
cd frontend
npm install
npm run start
```

### Problème 2: Port 4200 déjà utilisé

**Solution:**
```powershell
# Arrêter le processus sur le port 4200
netstat -ano | findstr 4200
# Noter le PID, puis:
taskkill /PID <PID> /F

# Ou changer le port:
ng serve --port 4201
```

### Problème 3: Service-Utilisateur ne répond pas

**Solution:**
```powershell
# Redémarrer le conteneur
docker restart ecopria-utilisateur

# Voir les logs
docker logs ecopria-utilisateur --tail 50

# Si problème de connexion MySQL:
docker ps | findstr mysql
```

### Problème 4: QR Code ne s'affiche pas

**Solutions à vérifier:**
1. Ouvrir la console (F12) → Chercher les erreurs
2. Vérifier que `qrcode` est installé:
   ```powershell
   npm list qrcode
   ```
3. Si absent, réinstaller:
   ```powershell
   npm install qrcode @types/qrcode
   ```

### Problème 5: "0 points" affiché

**Action immédiate:**
1. Ouvrir F12 → Console
2. Chercher les logs commençant par 🔍
3. Copier tous les logs
4. Consulter: `TACHE-SUIVANTE-DEBUG-POINTS.md`

---

## 📱 TESTER AVEC UN VRAI SCANNER QR

### Option 1: Application mobile

1. Téléchargez une app de scan QR sur votre téléphone
2. Scannez le QR affiché dans le modal
3. Vérifiez que le code scanné = code affiché (ECO-2026-XXXXX)

### Option 2: Scanner en ligne

1. Téléchargez le QR (bouton 📥)
2. Allez sur: https://zxing.org/w/decode.jsp
3. Uploadez l'image PNG
4. Vérifiez le contenu décodé

---

## ✅ CHECKLIST DE VÉRIFICATION

Cochez chaque élément testé:

**Backend:**
- [ ] Service-Utilisateur répond (port 8082)
- [ ] Service-Recompense répond (port 9093)
- [ ] MySQL accessible
- [ ] API `/api/users/1/points` retourne les points

**Frontend:**
- [ ] Angular démarre sans erreur
- [ ] Page de connexion accessible
- [ ] Connexion réussie
- [ ] Navigation vers profil partenaire OK

**Points:**
- [ ] Solde affiché correctement (pas "0")
- [ ] Points déduits après échange
- [ ] Confirmation visuelle de l'échange

**QR Code:**
- [ ] QR code s'affiche dans le modal
- [ ] Image nette et lisible
- [ ] Bouton copie fonctionne
- [ ] Bouton téléchargement fonctionne
- [ ] Fichier PNG contient le QR
- [ ] QR scannable et contient le bon code

---

## 🎓 RESSOURCES

### Documentation:
- `QR-CODE-IMPLEMENTATION-COMPLETE.md` - Guide complet QR
- `TACHE-SUIVANTE-DEBUG-POINTS.md` - Debug des points
- `RESUME-SESSION-2026-06-04.md` - Vue d'ensemble complète

### Scripts:
- `test-qr-code-flow.ps1` - Test automatisé complet
- `verifier-donnees.ps1` - Vérification rapide BD

### Commandes utiles:
```powershell
# Tout redémarrer
docker restart ecopria-utilisateur
cd frontend ; npm run start

# Tout tester
.\test-qr-code-flow.ps1

# Vérifier les données
.\verifier-donnees.ps1

# Logs en direct
docker logs ecopria-utilisateur -f
```

---

## 🚀 C'EST PARTI!

**Commande magique pour tout démarrer:**

```powershell
# Terminal 1: Frontend
cd C:\Users\user\Desktop\ecopria\frontend
npm run start

# Terminal 2: Test automatisé (optionnel)
cd C:\Users\user\Desktop\ecopria
.\test-qr-code-flow.ps1
```

Puis rendez-vous sur **http://localhost:4200** et profitez! 🎉

---

**Bon test! Si vous rencontrez un problème, consultez la section "PROBLÈMES COURANTS" ci-dessus.**

