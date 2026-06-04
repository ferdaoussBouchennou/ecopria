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
