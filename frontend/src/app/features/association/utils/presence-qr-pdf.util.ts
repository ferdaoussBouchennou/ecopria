import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface PresenceQrDocumentOptions {
  qrToken: string;
  pinCode: string | null;
  actionTitle: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeFileName(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'action';
}

async function buildQrImageDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export async function downloadPresenceQrPdf(
  options: PresenceQrDocumentOptions
): Promise<void> {
  const qrDataUrl = await buildQrImageDataUrl(options.qrToken);
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('QR Code de présence', pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.text(options.actionTitle, pageW / 2, y, { align: 'center', maxWidth: pageW - 28 });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Scannez ce QR code pour valider votre présence', pageW / 2, y, {
    align: 'center',
    maxWidth: pageW - 28,
  });
  y += 10;

  const qrSize = 55;
  doc.addImage(qrDataUrl, 'PNG', (pageW - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 8;

  if (options.pinCode) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Code PIN : ${options.pinCode}`, pageW / 2, y, { align: 'center' });
    y += 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "À afficher sur place le jour de l'action pour validation des présences.",
    pageW / 2,
    y,
    { align: 'center', maxWidth: pageW - 28 }
  );

  doc.save(`qr-presence-${safeFileName(options.actionTitle)}.pdf`);
}

export async function printPresenceQr(
  options: PresenceQrDocumentOptions
): Promise<void> {
  const qrDataUrl = await buildQrImageDataUrl(options.qrToken);
  const title = escapeHtml(options.actionTitle);
  const pinBlock = options.pinCode
    ? `<p class="pin"><strong>Code PIN : ${escapeHtml(options.pinCode)}</strong></p>`
    : '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('POPUP_BLOCKED');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>QR Code - ${title}</title>
        <style>
          body {
            margin: 0;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; text-align: center; }
          .subtitle { color: #666; margin-bottom: 1.5rem; text-align: center; }
          img { width: 280px; height: 280px; }
          .pin { margin-top: 1rem; font-size: 1.125rem; }
          .footer { margin-top: 2rem; font-size: 0.875rem; color: #999; text-align: center; }
          @media print { body { padding: 1rem; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="subtitle">Scannez ce QR code pour valider votre présence</p>
        <img src="${qrDataUrl}" alt="QR Code de présence" />
        ${pinBlock}
        <div class="footer">
          <p>Ecopria — ${new Date().toLocaleDateString('fr-FR')}</p>
          <p>À afficher sur place le jour de l'action pour validation des présences.</p>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
