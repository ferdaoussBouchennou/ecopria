import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CouponViewModel } from '../../../core/models/recompense.model';

export async function downloadCouponPdf(coupon: CouponViewModel): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(coupon.code, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M'
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Ecopria — Coupon', pageW / 2, y, { align: 'center' });
  y += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(coupon.partenaireName, 14, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(coupon.recompenseTitle, 14, y, { maxWidth: pageW - 28 });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Code coupon', 14, y);
  y += 6;
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text(coupon.code, 14, y);
  y += 14;

  const qrSize = 42;
  doc.addImage(qrDataUrl, 'PNG', (pageW - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (coupon.expireLe) {
    const expiry = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(coupon.expireLe));
    doc.text(`Expire le ${expiry}`, 14, y);
    y += 6;
  }
  doc.text(`Points utilisés : ${coupon.pointsUtilises}`, 14, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Présentez ce QR code chez le partenaire pour valider votre offre.', 14, y, {
    maxWidth: pageW - 28
  });

  const safeCode = coupon.code.replace(/[^\w-]+/g, '_');
  doc.save(`ecopria-coupon-${safeCode}.pdf`);
}
