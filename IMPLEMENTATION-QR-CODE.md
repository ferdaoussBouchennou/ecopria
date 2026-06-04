# 📱 IMPLÉMENTATION DU QR CODE POUR LES COUPONS

## 🎯 OBJECTIF

Ajouter un QR code sur chaque coupon généré pour permettre au partenaire de scanner facilement le code au lieu de le saisir manuellement.

---

## 📦 ÉTAPE 1: Installation de la librairie

```bash
cd frontend
npm install qrcode --save
npm install @types/qrcode --save-dev
```

---

## 🔧 ÉTAPE 2: Créer un service QR Code

Créez `frontend/src/app/core/services/qrcode.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {

  /**
   * Génère un QR code en base64 (data URL)
   * @param text Le texte à encoder (ex: code coupon)
   * @param size Taille du QR code en pixels (défaut: 300)
   * @returns Promise<string> Data URL du QR code
   */
  async generateQRCode(text: string, size: number = 300): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erreur génération QR code:', error);
      throw error;
    }
  }

  /**
   * Génère un QR code et le télécharge
   * @param text Le texte à encoder
   * @param filename Nom du fichier (défaut: qrcode.png)
   */
  async downloadQRCode(text: string, filename: string = 'qrcode.png'): Promise<void> {
    try {
      const dataUrl = await this.generateQRCode(text, 400);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error('Erreur téléchargement QR code:', error);
      throw error;
    }
  }
}
```

---

## 🎨 ÉTAPE 3: Modifier le composant d'échange

Mettez à jour `profil-partenaire-public.component.ts`:

```typescript
import { QrCodeService } from '../../../core/services/qrcode.service';

export class ProfilPartenairePublicComponent implements OnInit {
  // ... existing properties ...
  
  // Nouvelle propriété pour le QR code
  qrCodeDataUrl: string = '';
  qrCodeLoading: boolean = false;

  constructor(
    // ... existing dependencies ...
    private qrCodeService: QrCodeService
  ) {}

  echangerOffre(offre: RecompenseItemDto): void {
    // ... existing code ...

    this.recompenseService.echanger(offre.id).subscribe({
      next: async (coupon) => {
        this.couponGenere = coupon;
        
        // Générer le QR code
        this.qrCodeLoading = true;
        try {
          this.qrCodeDataUrl = await this.qrCodeService.generateQRCode(coupon.code);
        } catch (error) {
          console.error('Erreur génération QR code:', error);
          this.qrCodeDataUrl = ''; // On affiche quand même le coupon sans QR
        } finally {
          this.qrCodeLoading = false;
        }
        
        this.showSuccessModal = true;
        this.echangeEnCours = null;
        
        // Recharger le solde et les offres
        const userId = this.auth.getUserId();
        if (userId != null) {
          this.loadUserPoints(userId);
        }
        if (this.profil) {
          this.loadOffres(this.profil.userId);
        }
      },
      error: (e: Error) => {
        alert(`Erreur : ${e.message}`);
        this.echangeEnCours = null;
      }
    });
  }

  async telechargerQRCode(): Promise<void> {
    if (!this.couponGenere) return;
    
    try {
      await this.qrCodeService.downloadQRCode(
        this.couponGenere.code,
        `coupon-${this.couponGenere.code}.png`
      );
    } catch (error) {
      alert('Erreur lors du téléchargement du QR code');
    }
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.couponGenere = null;
    this.qrCodeDataUrl = '';
  }
}
```

---

## 🎨 ÉTAPE 4: Modifier le template HTML

Mettez à jour `profil-partenaire-public.component.html`:

```html
<!-- Modal de succès avec QR code -->
<div class="modal-overlay" *ngIf="showSuccessModal" (click)="closeModal()">
  <div class="modal-content modal--success" (click)="$event.stopPropagation()">
    <button class="modal-close" (click)="closeModal()">✕</button>
    
    <div class="modal-icon">🎉</div>
    <h2 class="modal-title">Coupon obtenu !</h2>
    
    <div class="coupon-details" *ngIf="couponGenere">
      <div class="coupon-info">
        <h3>{{ couponGenere.recompenseTitle }}</h3>
        <p class="coupon-partner">Chez {{ couponGenere.partenaireName }}</p>
        <p class="coupon-points">{{ couponGenere.pointsUtilises }} points utilisés</p>
      </div>

      <!-- QR Code -->
      <div class="qr-code-container">
        <div class="qr-code-loading" *ngIf="qrCodeLoading">
          <div class="spinner"></div>
          <p>Génération du QR code...</p>
        </div>
        
        <div class="qr-code-image" *ngIf="!qrCodeLoading && qrCodeDataUrl">
          <img [src]="qrCodeDataUrl" alt="QR Code du coupon" />
          <p class="qr-code-hint">Scannez ce QR code chez le partenaire</p>
        </div>

        <div class="qr-code-error" *ngIf="!qrCodeLoading && !qrCodeDataUrl">
          <p>QR code non disponible</p>
        </div>
      </div>

      <!-- Code coupon -->
      <div class="coupon-code-box">
        <span class="code-label">Code coupon:</span>
        <div class="code-value-container">
          <span class="code-value">{{ couponGenere.code }}</span>
          <button 
            class="btn-copy" 
            (click)="copierCode(couponGenere.code)"
            title="Copier le code">
            📋
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button 
          class="btn btn--secondary" 
          (click)="telechargerQRCode()"
          *ngIf="qrCodeDataUrl">
          📥 Télécharger QR Code
        </button>
        <button class="btn btn--primary" (click)="allerVersMesCoupons()">
          Voir mes coupons
        </button>
      </div>

      <p class="coupon-expiry" *ngIf="couponGenere.expireLe">
        Valable jusqu'au {{ couponGenere.expireLe | date:'dd/MM/yyyy' }}
      </p>
    </div>
  </div>
</div>
```

---

## 🎨 ÉTAPE 5: Ajouter les styles CSS

Ajoutez dans `profil-partenaire-public.component.scss`:

```scss
// QR Code container
.qr-code-container {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
}

.qr-code-loading {
  padding: 2rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  p {
    color: #6b7280;
    font-size: 0.9rem;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qr-code-image {
  img {
    max-width: 250px;
    width: 100%;
    height: auto;
    border: 3px solid #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .qr-code-hint {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 500;
  }
}

.qr-code-error {
  padding: 2rem;
  color: #ef4444;
  font-size: 0.9rem;
}

// Code coupon box
.coupon-code-box {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fff;
  border: 2px dashed #10b981;
  border-radius: 8px;
  text-align: center;
  
  .code-label {
    display: block;
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .code-value-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .code-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #10b981;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
  }
  
  .btn-copy {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s;
    
    &:hover {
      background: #059669;
      transform: scale(1.05);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

// Modal actions
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.coupon-expiry {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}
```

---

## 📱 ÉTAPE 6: Ajouter la fonction de copie

Ajoutez dans le composant TypeScript:

```typescript
copierCode(code: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      // Vous pouvez ajouter un toast ou une notification
      alert('Code copié dans le presse-papiers!');
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
      this.fallbackCopyCode(code);
    });
  } else {
    this.fallbackCopyCode(code);
  }
}

private fallbackCopyCode(code: string): void {
  const textArea = document.createElement('textarea');
  textArea.value = code;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    alert('Code copié!');
  } catch (err) {
    console.error('Erreur fallback copy:', err);
  }
  document.body.removeChild(textArea);
}
```

---

## 🎯 ÉTAPE 7: Afficher les QR codes dans "Mes Coupons"

Créez ou mettez à jour le composant `mes-coupons`:

```typescript
// mes-coupons.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecompenseService } from '../recompense.service';
import { QrCodeService } from '../../../core/services/qrcode.service';
import { CouponDto } from '../../../core/models/recompense.model';

@Component({
  selector: 'app-mes-coupons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mes-coupons-page">
      <h1>Mes Coupons</h1>
      
      <div class="coupons-grid">
        <div class="coupon-card" *ngFor="let coupon of coupons">
          <div class="coupon-header">
            <h3>{{ coupon.recompenseTitle }}</h3>
            <span class="badge" [ngClass]="getBadgeClass(coupon.status)">
              {{ getStatusLabel(coupon.status) }}
            </span>
          </div>
          
          <div class="coupon-body">
            <p class="partner">{{ coupon.partenaireName }}</p>
            
            <div class="qr-section" *ngIf="coupon.status === 'DISTRIBUE'">
              <img 
                [src]="qrCodes[coupon.code]" 
                *ngIf="qrCodes[coupon.code]"
                alt="QR Code"
                class="qr-image">
            </div>
            
            <div class="code-display">
              <span class="code-label">Code:</span>
              <code class="code-value">{{ coupon.code }}</code>
            </div>
            
            <div class="coupon-meta">
              <span>{{ coupon.pointsUtilises }} points</span>
              <span *ngIf="coupon.expireLe">
                Expire le {{ coupon.expireLe | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>
          
          <div class="coupon-actions" *ngIf="coupon.status === 'DISTRIBUE'">
            <button (click)="telechargerQR(coupon.code)" class="btn-download">
              📥 Télécharger QR
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .qr-section {
      margin: 1rem 0;
      text-align: center;
      
      .qr-image {
        max-width: 200px;
        width: 100%;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
      }
    }
    
    .code-display {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      text-align: center;
      
      .code-label {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }
      
      .code-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #10b981;
        font-family: monospace;
      }
    }
  `]
})
export class MesCouponsComponent implements OnInit {
  coupons: CouponDto[] = [];
  qrCodes: { [code: string]: string } = {};
  loading = true;

  constructor(
    private recompenseService: RecompenseService,
    private qrCodeService: QrCodeService
  ) {}

  async ngOnInit(): Promise<void> {
    this.recompenseService.getMesCoupons().subscribe({
      next: async (coupons) => {
        this.coupons = coupons;
        this.loading = false;
        
        // Générer les QR codes pour les coupons actifs
        for (const coupon of coupons) {
          if (coupon.status === 'DISTRIBUE') {
            try {
              this.qrCodes[coupon.code] = await this.qrCodeService.generateQRCode(coupon.code, 200);
            } catch (error) {
              console.error(`Erreur QR pour ${coupon.code}:`, error);
            }
          }
        }
      },
      error: (e) => {
        console.error('Erreur chargement coupons:', e);
        this.loading = false;
      }
    });
  }

  async telechargerQR(code: string): Promise<void> {
    try {
      await this.qrCodeService.downloadQRCode(code, `coupon-${code}.png`);
    } catch (error) {
      alert('Erreur lors du téléchargement');
    }
  }

  getBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'DISTRIBUE': 'badge-success',
      'UTILISE': 'badge-info',
      'EXPIRE': 'badge-danger'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'DISTRIBUE': 'Actif',
      'UTILISE': 'Utilisé',
      'EXPIRE': 'Expiré'
    };
    return labels[status] || status;
  }
}
```

---

## ✅ RÉSUMÉ DES CHANGEMENTS

1. ✅ Installation de `qrcode` et `@types/qrcode`
2. ✅ Création du service `QrCodeService`
3. ✅ Ajout de la génération QR dans `echangerOffre()`
4. ✅ Affichage du QR code dans le modal de succès
5. ✅ Bouton de téléchargement du QR code
6. ✅ Fonction de copie du code
7. ✅ Styles CSS pour le QR code
8. ✅ Composant "Mes Coupons" avec QR codes

---

## 🚀 POUR TESTER

1. Installez les dépendances:
   ```bash
   cd frontend
   npm install
   ```

2. Lancez le frontend:
   ```bash
   npm run start
   ```

3. Échangez une offre et vérifiez que:
   - Le QR code s'affiche
   - Le code est copiable
   - Le QR est téléchargeable
   - Le partenaire peut scanner le QR code

---

## 📱 SCANNER CÔTÉ PARTENAIRE (OPTIONNEL)

Pour ajouter un vrai scanner QR côté partenaire, vous pouvez utiliser `html5-qrcode`:

```bash
npm install html5-qrcode
```

Et l'intégrer dans le composant `scanner-coupon`.

---

**Créé le**: 2026-06-04  
**Prêt à implémenter!**
