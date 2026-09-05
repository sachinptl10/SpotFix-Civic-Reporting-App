// backend/services/workOrderPdfService.js
//
// Generates a printable "Field Repair Work Order" PDF for a single report.
// Wired up by GET /api/reports/:id/export-pdf (see reportController.js / reportRoutes.js).
//
// Install:
//   npm install pdf-lib qrcode
//
// Optional env vars (the PDF still generates without them, just with fewer panels):
//   MAPBOX_ACCESS_TOKEN  - enables an embedded static map snapshot of the GPS pin
//   PUBLIC_APP_URL       - base URL used to build the QR code deep link (e.g. https://spotfix.example.com)

const fs = require('fs/promises');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

// Adjust if your Multer destination differs from backend/uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const PRIORITY_COLORS = {
  high: rgb(0.86, 0.15, 0.15),
  medium: rgb(0.93, 0.62, 0.08),
  low: rgb(0.16, 0.5, 0.86),
};

/**
 * Reads an uploaded report image off disk and embeds it in the PDF.
 * Returns null instead of throwing if the file is missing or unsupported,
 * so one bad/missing photo never blocks the whole work order from generating.
 */
async function embedReportImage(pdfDoc, storedFilename) {
  if (!storedFilename) return null;
  try {
    // path.basename strips any directory component - guards against path traversal
    // even though the value should already be a safe, server-generated filename.
    const filePath = path.join(UPLOAD_DIR, path.basename(storedFilename));
    const bytes = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return await pdfDoc.embedPng(bytes);
    if (ext === '.jpg' || ext === '.jpeg') return await pdfDoc.embedJpg(bytes);
    return null; // e.g. a video file - handled separately in the layout
  } catch (err) {
    console.warn(`[workOrderPdfService] Could not embed image "${storedFilename}":`, err.message);
    return null;
  }
}

/**
 * Fetches a static map snapshot centered on the report's coordinates via the
 * Mapbox Static Images API. Returns null if MAPBOX_ACCESS_TOKEN isn't set or
 * the request fails - the PDF still generates, just without the map panel.
 */
async function fetchMapSnapshot(latitude, longitude, pdfDoc) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token || latitude == null || longitude == null) return null;

  const width = 500;
  const height = 300;
  const zoom = 16;
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `pin-l+e63946(${longitude},${latitude})/${longitude},${latitude},${zoom},0/${width}x${height}@2x` +
    `?access_token=${token}`;

  try {
    const response = await fetch(url); // Node 18+ has global fetch; install node-fetch if on an older runtime
    if (!response.ok) throw new Error(`Mapbox responded ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return await pdfDoc.embedPng(Buffer.from(arrayBuffer));
  } catch (err) {
    console.warn('[workOrderPdfService] Map snapshot fetch failed:', err.message);
    return null;
  }
}

/** Builds a QR code linking back to the live report so a contractor can scan for status/updates. */
async function buildQrCode(pdfDoc, reportNumber) {
  const baseUrl = process.env.PUBLIC_APP_URL || 'https://spotfix.app';
  const deepLink = `${baseUrl}/report/${reportNumber}`;
  const qrPngBuffer = await QRCode.toBuffer(deepLink, { type: 'png', margin: 1, width: 240 });
  return { image: await pdfDoc.embedPng(qrPngBuffer), deepLink };
}

function drawLabelValue(page, font, boldFont, label, value, x, y, labelWidth = 110) {
  page.drawText(label.toUpperCase(), { x, y, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.45) });
  page.drawText(String(value ?? '—'), { x: x + labelWidth, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
}

/** Naive word-wrap so long strings don't overflow the page. Swap for a font-metric-aware wrapper if you need precision. */
function wrapText(text, maxCharsPerLine) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['—'];
}

/**
 * Generates the full work order PDF for a single report and returns it as a Buffer.
 * `report` should be a Mongoose Report document (matches the schema in models/Report.js).
 */
async function generateWorkOrderPdf(report) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 40;

  // ---- Header band ----
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: rgb(0.11, 0.15, 0.22) });
  page.drawText('SPOTFIX — FIELD REPAIR WORK ORDER', {
    x: margin, y: height - 40, size: 18, font: boldFont, color: rgb(1, 1, 1),
  });
  page.drawText(`Report #${report.reportNumber}`, {
    x: margin, y: height - 62, size: 12, font, color: rgb(0.8, 0.85, 0.95),
  });
  const priorityColor = PRIORITY_COLORS[report.priority] || rgb(0.5, 0.5, 0.5);
  page.drawRectangle({ x: width - margin - 90, y: height - 60, width: 90, height: 22, color: priorityColor });
  page.drawText((report.priority || 'medium').toUpperCase(), {
    x: width - margin - 78, y: height - 54, size: 10, font: boldFont, color: rgb(1, 1, 1),
  });

  // ---- Issue details ----
  let cursorY = height - 120;
  drawLabelValue(page, font, boldFont, 'Category', report.category, margin, cursorY); cursorY -= 22;
  drawLabelValue(page, font, boldFont, 'Status', report.status, margin, cursorY); cursorY -= 22;
  drawLabelValue(page, font, boldFont, 'Reported', new Date(report.createdAt).toLocaleString(), margin, cursorY); cursorY -= 22;
  drawLabelValue(page, font, boldFont, 'Address', report.address || 'Not provided', margin, cursorY); cursorY -= 22;
  drawLabelValue(
    page, font, boldFont, 'Coordinates',
    `${report.latitude?.toFixed?.(6)}, ${report.longitude?.toFixed?.(6)}`,
    margin, cursorY
  );
  cursorY -= 30;

  page.drawText('DESCRIPTION', { x: margin, y: cursorY, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.45) });
  cursorY -= 16;
  wrapText(report.description, 90).forEach((line) => {
    page.drawText(line, { x: margin, y: cursorY, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    cursorY -= 14;
  });
  cursorY -= 10;

  // ---- Before photo + map snapshot, side by side ----
  const photoBoxY = cursorY - 190;
  const photo = await embedReportImage(pdfDoc, report.imageUrl || report.image);
  page.drawText('BEFORE PHOTO', { x: margin, y: cursorY, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.45) });
  if (photo) {
    const scale = Math.min(220 / photo.width, 180 / photo.height);
    page.drawImage(photo, { x: margin, y: photoBoxY, width: photo.width * scale, height: photo.height * scale });
  } else {
    page.drawRectangle({ x: margin, y: photoBoxY, width: 220, height: 180, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawText(report.mediaType === 'video' ? 'Video evidence on file (see app)' : 'No photo available', {
      x: margin + 20, y: photoBoxY + 85, size: 9, font, color: rgb(0.6, 0.6, 0.6),
    });
  }

  const mapX = margin + 250;
  page.drawText('LOCATION', { x: mapX, y: cursorY, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.45) });
  const map = await fetchMapSnapshot(report.latitude, report.longitude, pdfDoc);
  if (map) {
    const scale = Math.min(220 / map.width, 180 / map.height);
    page.drawImage(map, { x: mapX, y: photoBoxY, width: map.width * scale, height: map.height * scale });
  } else {
    page.drawRectangle({ x: mapX, y: photoBoxY, width: 220, height: 180, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawText('Map snapshot unavailable', { x: mapX + 35, y: photoBoxY + 85, size: 9, font, color: rgb(0.6, 0.6, 0.6) });
    page.drawText('(set MAPBOX_ACCESS_TOKEN to enable)', { x: mapX + 15, y: photoBoxY + 70, size: 7, font, color: rgb(0.7, 0.7, 0.7) });
  }

  cursorY = photoBoxY - 30;

  // ---- QR code + repair spec + signature lines ----
  const { image: qrImage, deepLink } = await buildQrCode(pdfDoc, report.reportNumber);
  page.drawImage(qrImage, { x: margin, y: cursorY - 100, width: 100, height: 100 });
  page.drawText('Scan for live status', { x: margin, y: cursorY - 112, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(deepLink, { x: margin, y: cursorY - 124, size: 7, font, color: rgb(0.6, 0.6, 0.6) });

  const specX = margin + 140;
  page.drawText('REPAIR SPECIFICATIONS', { x: specX, y: cursorY, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.45) });
  const specNote = report.reviewNote || 'No additional specifications provided by reviewing officer.';
  wrapText(specNote, 60).forEach((line, i) => {
    page.drawText(line, { x: specX, y: cursorY - 16 - i * 14, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
  });

  const sigY = cursorY - 130;
  page.drawLine({ start: { x: specX, y: sigY }, end: { x: specX + 180, y: sigY }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
  page.drawText('Contractor signature', { x: specX, y: sigY - 12, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  page.drawLine({ start: { x: specX + 200, y: sigY }, end: { x: specX + 320, y: sigY }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
  page.drawText('Date completed', { x: specX + 200, y: sigY - 12, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

  // ---- Footer ----
  page.drawText(`Generated ${new Date().toLocaleString()} · SpotFix Municipal System`, {
    x: margin, y: 30, size: 7, font, color: rgb(0.6, 0.6, 0.6),
  });

  return Buffer.from(await pdfDoc.save());
}

module.exports = { generateWorkOrderPdf };
