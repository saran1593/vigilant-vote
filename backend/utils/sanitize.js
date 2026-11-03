const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Re-encode images: drops EXIF (GPS, device, timestamps)
const stripImage = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const tmp = filePath + '_clean';
  const img = sharp(filePath);
  if (ext === '.png') await img.png().toFile(tmp);
  else await img.jpeg({ quality: 90 }).toFile(tmp);
  fs.unlinkSync(filePath);
  fs.renameSync(tmp, filePath);
};

// Rebuild the PDF page by page into a fresh document:
// the original Info dictionary (author, title, creator, dates) and XMP metadata are not copied.
const stripPdf = async (filePath) => {
  const src = await PDFDocument.load(fs.readFileSync(filePath));
  const out = await PDFDocument.create({ updateMetadata: false });
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  out.setTitle('');
  out.setAuthor('');
  out.setSubject('');
  out.setKeywords([]);
  out.setCreator('');
  out.setProducer('');
  fs.writeFileSync(filePath, await out.save());
};

// Throws if the file is not a valid image/PDF
const sanitizeFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return stripImage(filePath);
  if (ext === '.pdf') return stripPdf(filePath);
  throw new Error('Unsupported file type');
};

module.exports = { sanitizeFile };