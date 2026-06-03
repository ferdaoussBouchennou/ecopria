# 🧪 Tests API - Offres par Partenaire

## ✅ Nouveau Endpoint Implémenté

### GET `/api/recompenses/public/partenaire/{userId}/offres`

**Description :** Récupère UNIQUEMENT les offres actives d'un partenaire spécifique

**Paramètres :**
- `userId` (path) : L'identifiant utilisateur du partenaire (ex: 101, 102, 103...)

**Réponse :** `RecompenseDTO[]`

---

## 🔍 Tests à Effectuer

### 1. Café Botanique (user_id = 101)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/101/offres
```

**Résultat attendu :** 3 offres
- Menu Déjeuner Bio Complet (120 pts)
- 15% sur toute la carte (80 pts)
- Café & Pâtisserie Maison (50 pts)

---

### 2. Zara Maroc (user_id = 102)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/102/offres
```

**Résultat attendu :** 2 offres
- 20% sur Collection Join Life (150 pts)
- Bon d'achat 250 DH (200 pts)

---

### 3. Le Jardin Secret (user_id = 103)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/103/offres
```

**Résultat attendu :** 2 offres
- Dîner Gastronomique 2 Personnes (300 pts)
- 25% sur Menu du Jour (100 pts)

---

### 4. Carrefour Bio (user_id = 104)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/104/offres
```

**Résultat attendu :** 2 offres
- 10% sur Rayon Bio (60 pts)
- Panier de Légumes Bio (90 pts)

---

### 5. Vélo Vert Maroc (user_id = 105)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/105/offres
```

**Résultat attendu :** 2 offres
- Location Vélo Électrique 3 Jours (180 pts)
- Révision Complète Gratuite (70 pts)

---

### 6. Spa Nature & Sens (user_id = 106)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/106/offres
```

**Résultat attendu :** 2 offres
- Massage Relaxant 60min (220 pts)
- 30% sur Soins Visage (130 pts)

---

### 7. Librairie Papier Recyclé (user_id = 107)

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/107/offres
```

**Résultat attendu :** 2 offres
- 20% sur Livres d'Occasion (40 pts)
- Bon d'achat Papeterie 100 DH (80 pts)

---

## 🚫 Test d'Erreur

### Partenaire Inexistant

**Requête :**
```bash
curl http://localhost:8080/api/recompenses/public/partenaire/999/offres
```

**Résultat attendu :** 
- HTTP 404 ou 500
- Message : "Partenaire introuvable" ou similaire

---

## 📊 Vérification Base de Données

### Compter les offres par partenaire

```sql
SELECT 
    p.user_id,
    p.name,
    COUNT(r.id) as nb_offres
FROM partenaires p
LEFT JOIN recompenses r ON r.partenaire_id = p.id AND r.is_active = 1
WHERE p.user_id >= 101 AND p.user_id <= 107
GROUP BY p.user_id, p.name
ORDER BY p.name;
```

**Résultat attendu :**
| user_id | name | nb_offres |
|---------|------|-----------|
| 101 | Café Botanique | 3 |
| 102 | Zara Maroc | 2 |
| 103 | Le Jardin Secret | 2 |
| 104 | Carrefour Bio | 2 |
| 105 | Vélo Vert Maroc | 2 |
| 106 | Spa Nature & Sens | 2 |
| 107 | Librairie Papier Recyclé | 2 |

---

## 🎯 Test Frontend

### URL de test dans le navigateur

1. **Liste des partenaires :**
   ```
   http://localhost:4200/partenaires
   ```

2. **Profil Café Botanique avec ses 3 offres :**
   ```
   http://localhost:4200/partenaires/101
   ```
   - Doit afficher uniquement les 3 offres du Café Botanique
   - Pas d'offres d'autres partenaires

3. **Profil Zara avec ses 2 offres :**
   ```
   http://localhost:4200/partenaires/102
   ```
   - Doit afficher uniquement les 2 offres de Zara
   - Pas d'offres de restaurants ou autres

---

## ✅ Checklist de Validation

- [ ] Le backend compile sans erreurs
- [ ] Le frontend compile sans erreurs
- [ ] L'API `/api/recompenses/public/partenaire/{userId}/offres` retourne les bonnes offres
- [ ] Chaque partenaire affiche UNIQUEMENT ses propres offres
- [ ] Les offres inactives ne sont pas affichées
- [ ] La page profil charge correctement
- [ ] Les images des offres s'affichent
- [ ] Les types d'offres (STOCK, REDUCTION, etc.) sont corrects

---

## 🔧 Modifications Effectuées

### Backend (Java)

**1. RecompenseController.java**
```java
@GetMapping("/public/partenaire/{userId}/offres")
public ResponseEntity<List<RecompenseDTO>> getOffresPartenaire(@PathVariable Long userId) {
    return ResponseEntity.ok(recompenseService.getOffresPartenaire(userId));
}
```

**2. RecompenseService.java**
```java
@Transactional(readOnly = true)
public List<RecompenseDTO> getOffresPartenaire(Long userId) {
    Partenaire partenaire = getPartenaireByUserId(userId);
    List<Recompense> recompenses = recompenseRepository
            .findByPartenaireIdAndIsActiveTrue(partenaire.getId());
    return recompenses.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
}
```

**3. RecompenseRepository.java**
- Méthode `findByPartenaireIdAndIsActiveTrue` déjà existante ✅

### Frontend (Angular)

**1. recompense.service.ts**
```typescript
getOffresByPartenaire(partenaireUserId: number): Observable<RecompenseItemDto[]> {
  return this.http
    .get<RecompenseItemDto[]>(`${API}/public/partenaire/${partenaireUserId}/offres`)
    .pipe(catchError(this.handleError));
}
```

**2. profil-partenaire-public.component.ts**
- Utilise déjà `getOffresByPartenaire(userId)` ✅
- Filtre les offres actives et disponibles ✅

---

## 📝 Notes Importantes

1. **Filtrage automatique :**
   - Le backend filtre automatiquement par `is_active = true`
   - Le frontend filtre en plus par `isAvailable` (vérifie le stock)

2. **Performance :**
   - Une seule requête par partenaire
   - Pas de chargement de toutes les offres puis filtrage côté frontend

3. **Sécurité :**
   - Endpoint public (pas d'authentification requise)
   - Affiche uniquement les offres actives

---

## 🎉 Résultat Final

Chaque page profil de partenaire affiche maintenant **UNIQUEMENT** ses propres offres, de manière professionnelle et cohérente avec sa catégorie.

**Exemple :**
- Café Botanique → Offres de restauration
- Zara → Offres de mode
- Vélo Vert → Offres de mobilité
