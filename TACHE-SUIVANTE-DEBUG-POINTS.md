# 🔍 TÂCHE SUIVANTE: Debug de l'Affichage des Points

**Date:** 2026-06-04  
**Statut:** ⏳ En attente de vérification utilisateur

---

## 🎯 PROBLÈME

L'utilisateur avec l'ID 1 a **400 points** dans la base de données `db_utilisateur.citizens`, mais le frontend affiche **"0 points"** sur la page du profil partenaire.

---

## ✅ CE QUI A ÉTÉ FAIT

### 1. Vérification Backend ✅
- ✅ Service-Utilisateur fonctionne (port 8082, Docker)
- ✅ Base de données connectée correctement
- ✅ API testée avec succès: `http://localhost:8082/api/users/1/points` retourne `{"totalPoints":400}`

### 2. Ajout de Logs de Debug ✅
Des logs détaillés ont été ajoutés dans le composant Angular:

**Fichier modifié:** `profil-partenaire-public.component.ts`

**Logs ajoutés:**
```typescript
// Dans checkUserAuthentication():
console.log('🔍 Vérification authentification:');
console.log('   - User ID:', userId);
console.log('   - Is Logged In:', this.auth.isLoggedIn());
console.log('   - localStorage userId:', localStorage.getItem('ecopria_user_id'));
console.log('   - localStorage role:', localStorage.getItem('ecopria_role'));

// Dans loadUserPoints():
console.log(`🔍 Appel API: GET /api/users/${userId}/points`);
console.log('✅ Réponse API reçue:', response);
console.log(`💰 Solde de points assigné: ${this.soldePoints} points`);

// En cas d'erreur:
console.error('❌ Erreur lors du chargement du solde de points:', e);
```

---

## 🔍 ÉTAPES DE VÉRIFICATION POUR L'UTILISATEUR

### Étape 1: Ouvrir la Console du Navigateur

1. Lancez le frontend: `cd frontend ; npm run start`
2. Connectez-vous en tant qu'utilisateur (ID 1)
3. Allez sur le profil d'un partenaire
4. **Appuyez sur F12** pour ouvrir les DevTools
5. Cliquez sur l'onglet **"Console"**

### Étape 2: Analyser les Logs

Cherchez les lignes suivantes dans la console:

```
🔍 Vérification authentification:
   - User ID: 1
   - Is Logged In: true
   - localStorage userId: 1
   - localStorage role: CITOYEN

🔍 Appel API: GET /api/users/1/points
✅ Réponse API reçue: {totalPoints: 400}
💰 Solde de points assigné: 400 points
```

### Étape 3: Identifier le Problème

**CAS A: L'API retourne 400 mais affiche 0**
→ Problème de data binding dans le template HTML

**CAS B: L'API n'est pas appelée**
→ Problème d'authentification ou d'initialisation du composant

**CAS C: L'API retourne une erreur**
→ Problème de configuration backend ou de connexion

**CAS D: localStorage ne contient pas l'ID utilisateur**
→ Problème de connexion/authentification

---

## 🛠️ SOLUTIONS SELON LE CAS

### Solution pour CAS A: Data Binding

Si l'API retourne 400 mais affiche 0, vérifier le template HTML:

**Fichier:** `profil-partenaire-public.component.html`

Chercher:
```html
<p class="points-value" *ngIf="!loadingSolde">{{ soldePoints }} points</p>
```

Remplacer temporairement par:
```html
<p class="points-value" *ngIf="!loadingSolde">
  {{ soldePoints }} points
  <span style="font-size: 10px; color: red;">
    (Debug: isUserConnected={{ isUserConnected }}, loadingSolde={{ loadingSolde }})
  </span>
</p>
```

### Solution pour CAS B: API Non Appelée

Si l'API n'est pas appelée, forcer l'appel dans `ngOnInit()`:

```typescript
ngOnInit(): void {
  // ... code existant ...
  
  // TEMPORAIRE: Forcer le chargement des points
  setTimeout(() => {
    const userId = this.auth.getUserId();
    console.log('🔧 Force reload points pour userId:', userId);
    if (userId) {
      this.loadUserPoints(userId);
    }
  }, 1000);
}
```

### Solution pour CAS C: Erreur API

Si vous voyez des erreurs 404 ou 500 dans la console:

1. Vérifier que Service-Utilisateur est démarré:
   ```powershell
   docker ps | findstr utilisateur
   ```

2. Tester l'API manuellement:
   ```powershell
   curl http://localhost:8082/api/users/1/points
   ```

3. Vérifier le fichier proxy:
   ```json
   // frontend/proxy.conf.json
   {
     "/api/users": {
       "target": "http://localhost:8082",
       "secure": false,
       "changeOrigin": true
     }
   }
   ```

### Solution pour CAS D: localStorage Vide

Si `localStorage.getItem('ecopria_user_id')` retourne `null`:

1. **Se déconnecter et se reconnecter:**
   ```javascript
   // Dans la console du navigateur
   localStorage.clear();
   // Puis reconnectez-vous via l'interface
   ```

2. **Vérifier le service d'authentification:**
   
   Fichier: `frontend/src/app/core/services/auth.service.ts`
   
   Vérifier que lors de la connexion, le service sauvegarde bien l'ID:
   ```typescript
   login(credentials): Observable<any> {
     return this.http.post('/api/auth/login', credentials).pipe(
       tap(response => {
         localStorage.setItem('ecopria_user_id', response.userId);
         localStorage.setItem('ecopria_role', response.role);
         localStorage.setItem('ecopria_access_token', response.token);
       })
     );
   }
   ```

---

## 📋 CHECKLIST DE VÉRIFICATION

Cochez au fur et à mesure:

- [ ] 1. Frontend lancé (`npm run start`)
- [ ] 2. Connexion réussie avec citoyen ID 1
- [ ] 3. Page profil partenaire ouverte
- [ ] 4. Console DevTools ouverte (F12)
- [ ] 5. Logs visibles dans la console
- [ ] 6. Vérification: `localStorage.getItem('ecopria_user_id')` = "1"
- [ ] 7. Vérification: API appelée avec succès
- [ ] 8. Vérification: Réponse API = `{totalPoints: 400}`
- [ ] 9. Vérification: `this.soldePoints` assigné à 400
- [ ] 10. Vérification: Interface affiche "400 points"

---

## 📸 CAPTURES D'ÉCRAN DEMANDÉES

Pour aider au diagnostic, veuillez fournir:

1. **Console du navigateur** (F12 → Console) montrant les logs
2. **Onglet Network** (F12 → Network) montrant l'appel à `/api/users/1/points`
3. **Interface** montrant le bloc "Votre solde de points"

---

## 🚀 COMMANDES RAPIDES

### Vérifier localStorage
```javascript
// Dans la console du navigateur (F12)
console.log('User ID:', localStorage.getItem('ecopria_user_id'));
console.log('Role:', localStorage.getItem('ecopria_role'));
console.log('Token:', localStorage.getItem('ecopria_access_token'));
```

### Tester l'API directement
```javascript
// Dans la console du navigateur
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log('Points API:', d))
  .catch(e => console.error('Erreur:', e));
```

### Vérifier le composant
```javascript
// Dans la console du navigateur (avec Angular DevTools installé)
// Sélectionner l'élément dans l'inspecteur, puis:
ng.probe($0).componentInstance.soldePoints
ng.probe($0).componentInstance.isUserConnected
ng.probe($0).componentInstance.loadingSolde
```

---

## 📞 PROCHAINES ÉTAPES

**Action requise:** Utilisateur doit vérifier la console du navigateur et fournir les logs

**Une fois les logs obtenus:**
1. Identifier le cas (A, B, C ou D)
2. Appliquer la solution correspondante
3. Tester à nouveau
4. Confirmer que l'affichage est correct

---

## 💡 NOTES TECHNIQUES

**Backend testé et fonctionnel:**
- ✅ MySQL: `db_utilisateur.citizens` contient `total_points = 400` pour `auth_id = 1`
- ✅ API: `GET /api/users/1/points` retourne `{"totalPoints": 400}`
- ✅ Service-Utilisateur: Conteneur Docker `ecopria-utilisateur` actif sur port 8082

**Frontend à vérifier:**
- ⏳ localStorage contient-il le bon user ID?
- ⏳ L'API est-elle appelée depuis le frontend?
- ⏳ La réponse est-elle correctement parsée?
- ⏳ La variable `soldePoints` est-elle assignée?
- ⏳ Le template affiche-t-il la bonne variable?

---

**Statut:** 🕐 En attente de retour utilisateur avec les logs de console

