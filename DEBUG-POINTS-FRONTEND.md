# Diagnostic du Problème "0 Points" - Frontend

## 🔍 Diagnostic Rapide dans le Navigateur

Ouvrez la **Console JavaScript** du navigateur (F12) et exécutez ces commandes :

### 1. Vérifier l'ID Utilisateur Stocké

```javascript
// Vérifier le localStorage
console.log('User ID:', localStorage.getItem('ecopria_user_id'));
console.log('Role:', localStorage.getItem('ecopria_role'));
console.log('Token:', localStorage.getItem('ecopria_access_token') ? 'Présent' : 'Absent');
```

**Résultat attendu :** `User ID: 1`

Si vous obtenez `null` ou un ID différent, c'est la source du problème.

---

### 2. Tester l'Appel API Manuellement

```javascript
// Remplacer 1 par votre ID utilisateur
fetch('/api/users/1/points')
  .then(res => res.json())
  .then(data => console.log('Points API:', data))
  .catch(err => console.error('Erreur:', err));
```

**Résultat attendu :**
```json
{
  "totalPoints": 400
}
```

---

### 3. Vérifier la Valeur dans le Composant Angular

Si vous êtes sur la page du profil partenaire, ouvrez la console et tapez :

```javascript
// Inspecter le composant Angular (DevTools Angular requis)
ng.probe($0).componentInstance.soldePoints
ng.probe($0).componentInstance.isUserConnected
```

Ou insérez un `console.log` temporaire dans le code.

---

## ✅ Solutions selon le Cas

### CAS 1 : `localStorage.getItem('ecopria_user_id')` retourne `null`

**→ L'utilisateur n'est pas correctement connecté**

**Solution :** Se déconnecter et se reconnecter

```javascript
// Dans la console du navigateur
localStorage.clear();
// Puis reconnectez-vous via l'interface
```

---

### CAS 2 : `localStorage.getItem('ecopria_user_id')` retourne un ID différent de 1

**→ Vous êtes connecté avec un autre compte**

**Vérification :**
```javascript
const userId = localStorage.getItem('ecopria_user_id');
console.log('ID connecté:', userId);

// Vérifier les points de CET utilisateur
fetch(`/api/users/${userId}/points`)
  .then(res => res.json())
  .then(data => console.log(`Points de l'utilisateur ${userId}:`, data));
```

**Solution :** Se connecter avec le bon compte ou modifier les points du compte actuel dans la DB :

```sql
-- Remplacer 2 par l'ID trouvé
UPDATE citizens SET total_points = 400 WHERE auth_id = 2;
```

---

### CAS 3 : L'API retourne bien 400 mais le frontend affiche 0

**→ Problème dans le code du composant**

**Vérification :**

1. Ouvrir les **DevTools du navigateur** (F12)
2. Aller dans l'onglet **Network** (Réseau)
3. Recharger la page
4. Chercher la requête `points` dans la liste
5. Cliquer dessus et voir la réponse

Si la réponse est `{"totalPoints": 400}` mais que l'interface affiche 0, alors il y a un bug dans le code TypeScript.

**Causes possibles :**

1. **Le parsing de la réponse est incorrect**
   ```typescript
   // ❌ MAUVAIS
   this.soldePoints = response.points; // undefined
   
   // ✅ BON
   this.soldePoints = response.totalPoints || 0;
   ```

2. **La variable est réinitialisée après**
   ```typescript
   this.soldePoints = response.totalPoints || 0; // OK
   // ... quelque part plus tard ...
   this.soldePoints = 0; // ⚠️ Écrase la valeur
   ```

3. **Erreur dans le Observable**
   ```typescript
   this.userService.getPoints(userId).subscribe({
     next: (response) => {
       console.log('Réponse API:', response); // Ajouter ce log
       this.soldePoints = response.totalPoints || 0;
       console.log('Solde assigné:', this.soldePoints); // Et celui-ci
     },
     error: (e) => {
       console.error('Erreur API:', e); // Vérifier si on arrive ici
       this.soldePoints = 0;
     }
   });
   ```

---

## 🔧 Fix Rapide - Ajouter des Logs de Débogage

Modifiez temporairement le fichier :  
`frontend/src/app/features/recompense/profil-partenaire-public/profil-partenaire-public.component.ts`

```typescript
loadUserPoints(userId: number): void {
  this.loadingSolde = true;
  
  // 🔍 LOG 1: Vérifier l'ID utilisé
  console.log('🔍 Chargement des points pour userId:', userId);
  
  this.userService.getPoints(userId).subscribe({
    next: (response) => {
      // 🔍 LOG 2: Vérifier la réponse de l'API
      console.log('✅ Réponse API getPoints:', response);
      
      this.soldePoints = response.totalPoints || 0;
      
      // 🔍 LOG 3: Vérifier la valeur assignée
      console.log('💰 Solde de points assigné:', this.soldePoints);
      
      this.loadingSolde = false;
    },
    error: (e: Error) => {
      // 🔍 LOG 4: Détecter les erreurs
      console.error('❌ Erreur lors du chargement du solde de points:', e);
      console.error('❌ Message d\'erreur:', e.message);
      
      this.soldePoints = 0;
      this.loadingSolde = false;
    }
  });
}
```

Rechargez la page et consultez la console du navigateur. Vous verrez exactement où se situe le problème.

---

## 🎯 Solution Définitive

D'après l'analyse du code, voici la ligne problématique probable :

**Fichier :** `profil-partenaire-public.component.ts` (ligne 84-92)

Le code actuel semble correct, mais voici une version renforcée :

```typescript
loadUserPoints(userId: number): void {
  if (!userId || userId <= 0) {
    console.error('❌ ID utilisateur invalide:', userId);
    this.soldePoints = 0;
    this.loadingSolde = false;
    return;
  }

  this.loadingSolde = true;
  
  this.userService.getPoints(userId).subscribe({
    next: (response) => {
      // Vérifier que response et totalPoints existent
      if (response && typeof response.totalPoints === 'number') {
        this.soldePoints = response.totalPoints;
      } else {
        console.warn('⚠️ Réponse API invalide:', response);
        this.soldePoints = 0;
      }
      this.loadingSolde = false;
    },
    error: (e: Error) => {
      console.error('❌ Erreur getPoints:', e.message);
      this.soldePoints = 0;
      this.loadingSolde = false;
    }
  });
}
```

---

## 📊 Vérification Complète Étape par Étape

### Étape 1 : Vérifier la connexion

```javascript
// Console du navigateur
const userId = localStorage.getItem('ecopria_user_id');
const role = localStorage.getItem('ecopria_role');
const token = localStorage.getItem('ecopria_access_token');

console.log('Connecté:', userId !== null);
console.log('User ID:', userId);
console.log('Rôle:', role);
console.log('Token présent:', token !== null);
```

### Étape 2 : Tester l'API directement

```bash
# Dans un terminal
curl http://localhost:8082/api/users/1/points
```

Ou dans le navigateur :
```javascript
fetch('/api/users/1/points')
  .then(r => r.json())
  .then(d => console.log('API directe:', d));
```

### Étape 3 : Vérifier le flux complet

```javascript
// 1. ID stocké
const storedId = localStorage.getItem('ecopria_user_id');
console.log('1️⃣ ID stocké:', storedId);

// 2. API call
fetch(`/api/users/${storedId}/points`)
  .then(r => r.json())
  .then(d => {
    console.log('2️⃣ Réponse API:', d);
    console.log('3️⃣ totalPoints:', d.totalPoints);
  });
```

---

## 🛠️ Correctifs Possibles

### Correctif 1 : Forcer un ID pour les tests

**Fichier :** `profil-partenaire-public.component.ts`

```typescript
checkUserAuthentication(): void {
  let userId = this.auth.getUserId();
  
  // 🔧 TEMPORAIRE : Forcer l'ID 1 pour les tests
  if (!userId) {
    console.warn('⚠️ Aucun ID trouvé, utilisation de l\'ID 1 pour test');
    userId = 1;
  }
  
  if (userId != null && this.auth.isLoggedIn()) {
    this.isUserConnected = true;
    this.loadUserPoints(userId);
  }
}
```

### Correctif 2 : Ajouter un Fallback

```typescript
loadUserPoints(userId: number): void {
  this.loadingSolde = true;
  
  this.userService.getPoints(userId).subscribe({
    next: (response) => {
      this.soldePoints = response?.totalPoints ?? 0;
      
      // 🔧 Si toujours 0, essayer une autre méthode
      if (this.soldePoints === 0) {
        console.warn('⚠️ Solde à 0, vérification alternative...');
        // Peut-être charger via le dashboard ?
      }
      
      this.loadingSolde = false;
    },
    error: (e: Error) => {
      console.error('❌ Erreur:', e);
      this.soldePoints = 0;
      this.loadingSolde = false;
    }
  });
}
```

---

## 📝 Checklist de Résolution

- [ ] 1. Vérifier que `localStorage.getItem('ecopria_user_id')` retourne bien `"1"`
- [ ] 2. Vérifier que l'API `/api/users/1/points` retourne `{"totalPoints": 400}`
- [ ] 3. Ajouter des `console.log` dans `loadUserPoints` pour tracer le flux
- [ ] 4. Vérifier qu'il n'y a pas d'erreur JavaScript dans la console
- [ ] 5. Vérifier que `this.soldePoints` n'est pas écrasé après l'assignation
- [ ] 6. Tester avec un autre navigateur ou en navigation privée

---

## 🆘 Si Rien ne Fonctionne

**Option nucléaire :** Afficher temporairement la valeur en dur

```html
<!-- Dans profil-partenaire-public.component.html -->
<p class="points-value">
  {{ soldePoints }} points
  <!-- DEBUG: -->
  <span style="color: red; font-size: 12px;">
    (localStorage: {{ getDebugUserId() }})
  </span>
</p>
```

```typescript
// Dans profil-partenaire-public.component.ts
getDebugUserId(): string {
  return localStorage.getItem('ecopria_user_id') || 'NULL';
}
```

Cela vous permettra de voir immédiatement si le problème vient de l'ID stocké.

---

## ✅ Une Fois le Problème Résolu

1. **Retirer tous les logs de débogage**
2. **Tester le flux complet :**
   - Connexion
   - Affichage des points
   - Échange d'une offre
   - Validation du code partenaire

3. **Documenter la solution** pour référence future

---

**Bonne chance ! 🚀**
