import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { processMarksheetData } from '../../../lib/ocr/ocrProcessor';

/* ══════════════════════════════════════════════════════════════════════════
   IMAGE PREPROCESSOR — Fixed for real-world marksheet photos
══════════════════════════════════════════════════════════════════════════ */
const preprocessImage = async (buffer) => {
  try {
    // Step 1: Get metadata safely
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      console.warn('Could not read metadata, using raw buffer');
      return buffer;
    }

    const originalW = metadata.width  || 1080;
    const originalH = metadata.height || 1350;
    console.log(`Original: ${originalW}x${originalH} ${metadata.format}`);

    // Step 2: Decode to raw pixels first (avoids format issues)
    let rawBuffer;
    try {
      rawBuffer = await sharp(buffer)
        .rotate()              // Auto-rotate based on EXIF
        .toColorspace('srgb')  // Normalize color space
        .removeAlpha()         // Remove alpha channel if present
        .toBuffer();
    } catch {
      rawBuffer = buffer;
    }

    // Step 3: Calculate safe target dimensions
    // Minimum 2500px wide for good OCR, max 4000px to avoid memory issues
    const targetW = Math.min(
      Math.max(originalW * 2, 2500),
      4000
    );

    console.log(`Target width: ${targetW}px`);

    // Step 4: Main preprocessing pipeline
    const processed = await sharp(rawBuffer)
      // Resize with safe settings
      .resize({
        width              : targetW,
        height             : undefined,  // maintain aspect ratio
        fit                : 'inside',
        withoutEnlargement : false,
        kernel             : sharp.kernel.lanczos3,
        fastShrinkOnLoad   : false,
      })
      // Convert to grayscale
      .grayscale()
      // Boost contrast for photos of documents
      // (handles yellow/orange/coloured paper backgrounds)
      .normalise()
      // Increase contrast
      .linear(1.8, -(128 * 0.8))
      // Sharpen text edges
      .sharpen({
        sigma : 2,
        m1    : 2,
        m2    : 0.5,
        x1    : 2,
        y2    : 10,
        y3    : 20,
      })
      // Convert to PNG (lossless, better for OCR)
      .png({
        compressionLevel : 1,  // minimal compression = faster
        adaptiveFiltering: true,
      })
      .toBuffer();

    // Log result size
    const resultMeta = await sharp(processed).metadata();
    console.log(`Processed: ${resultMeta.width}x${resultMeta.height} png`);

    return processed;

  } catch (err) {
    console.error('Preprocessing failed:', err.message);

    // Last resort fallback — minimal processing
    try {
      return await sharp(buffer)
        .grayscale()
        .normalise()
        .png()
        .toBuffer();
    } catch {
      return buffer; // return original if all else fails
    }
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   OCR RUNNER — with retry logic
══════════════════════════════════════════════════════════════════════════ */
const runOCR = async (imageBuffer, levelKey) => {
  /*
    Tesseract PSM modes:
    3  = Fully automatic (default)
    4  = Single column of text
    6  = Uniform block of text ← best for marksheets
    11 = Sparse text (grab what it can)
    12 = Sparse text with OSD
  */

  // Config optimized for Indian marksheets
  // DO NOT use char whitelist — it causes Tesseract to miss chars
  const config = {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(m.progress * 100);
        process.stdout.write(`\rOCR [${levelKey}]: ${pct}%`);
      }
    },
    // Page segmentation: assume single uniform block
    tessedit_pageseg_mode      : '6',
    // Improve number recognition
    classify_bln_numeric_mode  : '1',
    // Keep spaces between words
    preserve_interword_spaces  : '1',
    // Better accuracy (slower but worth it)
    tessedit_ocr_engine_mode   : '1',
  };

  // First attempt — standard
  let result = await Tesseract.recognize(imageBuffer, 'eng', config);
  console.log(`\nFirst attempt confidence: ${result.data.confidence.toFixed(1)}%`);

  // If confidence is very low, retry with different PSM
  if (result.data.confidence < 50) {
    console.log('Low confidence, retrying with PSM 4...');
    try {
      const retry = await Tesseract.recognize(imageBuffer, 'eng', {
        ...config,
        tessedit_pageseg_mode: '4',
      });
      console.log(`Retry confidence: ${retry.data.confidence.toFixed(1)}%`);

      // Use whichever gave better confidence
      if (retry.data.confidence > result.data.confidence) {
        result = retry;
      }
    } catch {
      console.warn('Retry failed, using first result');
    }
  }

  // If still very low, try PSM 11 (sparse text)
  if (result.data.confidence < 40) {
    console.log('Still low confidence, trying PSM 11 (sparse)...');
    try {
      const sparse = await Tesseract.recognize(imageBuffer, 'eng', {
        ...config,
        tessedit_pageseg_mode: '11',
      });
      console.log(`Sparse confidence: ${sparse.data.confidence.toFixed(1)}%`);

      if (sparse.data.confidence > result.data.confidence) {
        result = sparse;
      }
    } catch {
      console.warn('Sparse attempt failed');
    }
  }

  return result;
};

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE FILENAME
══════════════════════════════════════════════════════════════════════════ */
const generateFileName = (levelKey) => {
  const ts  = Date.now();
  const rnd = Math.random().toString(36).substring(2, 8);
  return `${levelKey}_${ts}_${rnd}`;
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN ROUTE HANDLER
══════════════════════════════════════════════════════════════════════════ */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('document');
    const levelKey = formData.get('levelKey') || 'general';

    /* ── Validation ────────────────────────────────────────────────────── */
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png',
      'image/webp', 'image/tiff', 'image/bmp',
      'application/pdf',
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Use JPEG, PNG, or PDF.` },
        { status: 400 }
      );
    }

    const maxMB = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '15');
    if (file.size > maxMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Max ${maxMB} MB.` },
        { status: 400 }
      );
    }

    /* ── Read file ─────────────────────────────────────────────────────── */
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`File: ${file.name} | Size: ${(file.size/1024).toFixed(1)}KB | Type: ${file.type}`);
    console.log(`Level: ${levelKey}`);

    /* ── Optional Cloudinary upload ────────────────────────────────────── */
    let fileUrl  = null;
    let publicId = null;

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY    &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const { uploadToCloudinary } = await import('../../../lib/cloudinary');
        const up = await uploadToCloudinary(
          buffer, levelKey, generateFileName(levelKey)
        );
        fileUrl  = up.secure_url;
        publicId = up.public_id;
        console.log('Cloudinary upload:', fileUrl);
      } catch (e) {
        console.warn('Cloudinary upload skipped:', e.message);
      }
    }

    /* ── Preprocess image ──────────────────────────────────────────────── */
    console.log('Preprocessing image...');
    const processedBuffer = await preprocessImage(buffer);

    /* ── Run OCR ───────────────────────────────────────────────────────── */
    console.log('Running OCR...');
    const ocrResult    = await runOCR(processedBuffer, levelKey);
    const { text, confidence } = ocrResult.data;

    console.log(`\nFinal confidence: ${confidence.toFixed(1)}%`);

    // Log cleaned text for debugging
    const cleanedForLog = text
      .replace(/[^\x20-\x7E\n]/g, '')   // printable ASCII only
      .replace(/\n{3,}/g, '\n\n')
      .substring(0, 800);
    console.log('Extracted text (800 chars):\n' + cleanedForLog);

    /* ── Parse OCR text ────────────────────────────────────────────────── */
    console.log('\nParsing marksheet data...');
    const marksheetData = processMarksheetData(text);

    console.log('Board:', marksheetData.board);
    console.log('Subjects found:', marksheetData.subjects.length);
    marksheetData.subjects.forEach(s => {
      console.log(`  ${s.name}: ${s.obtainedMarks}/${s.maxMarks} (${s.percentage}%)`);
    });
    console.log('Total:', marksheetData.obtainedMarks, '/', marksheetData.totalMarks);
    console.log('Percentage:', marksheetData.percentage + '%');
    console.log(`${'─'.repeat(50)}\n`);

    /* ── Warn if low confidence ────────────────────────────────────────── */
    const warnings = [];
    if (confidence < 60) {
      warnings.push(
        'OCR confidence is low. Please upload a clearer, well-lit image.'
      );
    }
    if (marksheetData.subjects.length === 0) {
      warnings.push(
        'No subjects could be extracted. Please verify the image quality.'
      );
    }

    return NextResponse.json({
      success    : true,
      rawText    : text,
      confidence : parseFloat(confidence.toFixed(2)),
      levelKey,
      fileUrl,
      publicId,
      warnings,
      data       : marksheetData,
    });

  } catch (error) {
    console.error('\n❌ OCR Route Error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      {
        error   : 'OCR processing failed',
        message : error.message,
      },
      { status: 500 }
    );
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   HEALTH CHECK
══════════════════════════════════════════════════════════════════════════ */
export async function GET() {
  return NextResponse.json({
    status  : 'ok',
    message : 'OCR API is running',
    version : '3.0',
  });
}