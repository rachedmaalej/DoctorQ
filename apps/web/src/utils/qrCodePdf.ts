import { jsPDF } from 'jspdf';

/**
 * Generate and download a printable A4 PDF with the clinic's QR code.
 */
export async function downloadQrCodePdf(qrDataUrl: string, clinicName: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title — BleSaf branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(27, 122, 74); // #1B7A4A
  doc.text('BleSaf', pageWidth / 2, 30, { align: 'center' });

  // QR Code — centered, large (80mm x 80mm)
  const qrSize = 80;
  const qrX = (pageWidth - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, 50, qrSize, qrSize);

  // Clinic name
  doc.setFontSize(24);
  doc.setTextColor(26, 26, 46); // #1A1A2E
  doc.text(clinicName, pageWidth / 2, 150, { align: 'center' });

  // Instruction text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(85, 85, 102); // #555566
  doc.text(
    'Scannez ce code pour rejoindre',
    pageWidth / 2,
    170,
    { align: 'center' }
  );
  doc.text(
    "la file d'attente sans vous déplacer.",
    pageWidth / 2,
    180,
    { align: 'center' }
  );

  // Sub-instruction
  doc.setFontSize(14);
  doc.setTextColor(136, 136, 153); // #888899
  doc.text(
    'Votre numéro vous sera envoyé',
    pageWidth / 2,
    200,
    { align: 'center' }
  );
  doc.text(
    'par message.',
    pageWidth / 2,
    208,
    { align: 'center' }
  );

  // Sanitize clinic name for filename
  const safeName = clinicName.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').replace(/\s+/g, '-');
  doc.save(`QR-BleSaf-${safeName}.pdf`);
}
