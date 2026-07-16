import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { processMarksheetData } from '../../../lib/ocr/ocrProcessor';

/* ── Image preprocessing — tuned for Indian board marksheets ─────────────── */
const preprocessImage = async (buffer) => {
  try {
    // Step 1: Get image metadata
    const metadata = await sharp(buffer).metadata();
    console.log(`Image: ${metadata.width}x${metadata.height} ${metadata.format}`);

    const processed = await sharp(buffer)
      // Upscale small images for better OCR
      .resize(
        Math.max(metadata.width  || 0, 2500),
        Math.max(metadata.height || 0, 3000),
        { fit: 'inside', withoutEnlargement: false }
      )
      // Convert to grayscale
      .grayscale()
      // Boost contrast for faded/coloured marksheets
      .linear(1.4, -30)
      // Normalize histogram
      .normalize()
      // Sharpen text edges
      .sharpen({ sigma: 1.5, m1: 1.5, m2: 0.7 })
      // Remove noise
      .median(1)
      .toBuffer();

    return processed;
  } catch (err) {
    console.error('Preprocessing error:', err.message);
    return buffer; // return original on failure
  }
};

const generateFileName = (levelKey) => {
  const ts  = Date.now();
  const rnd = Math.random().toString(36).substring(2, 8);
  return `${levelKey}_${ts}_${rnd}`;
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('document');
    const levelKey = formData.get('levelKey') || 'general';

    /* ── Validation ─────────────────────────────────────────────────────── */
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG and PDF allowed.' },
        { status: 400 }
      );
    }

    const maxMB = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '10');
    if (file.size > maxMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Max ${maxMB} MB.` },
        { status: 400 }
      );
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /* ── Optional: Upload to Cloudinary ─────────────────────────────────── */
    let fileUrl  = null;
    let publicId = null;

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const { uploadToCloudinary } = await import('../../../lib/cloudinary');
        const fileName    = generateFileName(levelKey);
        const uploadResult = await uploadToCloudinary(buffer, levelKey, fileName);
        fileUrl  = uploadResult.secure_url;
        publicId = uploadResult.public_id;
        console.log('✅ Cloudinary upload:', fileUrl);
      } catch (uploadErr) {
        console.warn('⚠️ Cloudinary upload failed:', uploadErr.message);
        // Continue without upload — OCR still works
      }
    }

    /* ── Preprocess image ────────────────────────────────────────────────── */
    const processedBuffer = await preprocessImage(buffer);

    /* ── Run Tesseract OCR ───────────────────────────────────────────────── */
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(
      processedBuffer,
      'eng',   // English only — Gujarati text cleaned in ocrProcessor
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR [${levelKey}]: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Tesseract page segmentation: 6 = assume uniform block of text
        tessedit_pageseg_mode     : '6',
        // Preserve more characters for Indian marksheets
        tessedit_char_whitelist   :
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
          '0123456789.,:-_/\\&()% \n\t',
        // Improve number recognition
        classify_bln_numeric_mode : '1',
      }
    );

    console.log('OCR confidence:', confidence.toFixed(1) + '%');
    console.log('Raw OCR text (first 500 chars):\n', text.substring(0, 500));

    /* ── Parse OCR text ──────────────────────────────────────────────────── */
    const marksheetData = processMarksheetData(text);

    console.log('Extracted subjects:', marksheetData.subjects.length);
    console.log('Total marks:', marksheetData.totalMarks);
    console.log('Obtained marks:', marksheetData.obtainedMarks);

    return NextResponse.json({
      success    : true,
      rawText    : text,
      confidence,
      levelKey,
      fileUrl,
      publicId,
      data       : marksheetData,
    });

  } catch (error) {
    console.error('OCR Route Error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', message: error.message },
      { status: 500 }
    );
  }
}