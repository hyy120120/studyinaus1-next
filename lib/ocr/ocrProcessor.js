/* ═══════════════════════════════════════════════════════════════════════════
   UNIVERSAL MARKSHEET OCR PROCESSOR
   
   Supports:
   ── INDIAN BOARDS ──────────────────────────────────────────────────────────
   ✅ CBSE (Central Board)
   ✅ ICSE / ISC
   ✅ Gujarat Board (GSEB) — Gujarati script
   ✅ Maharashtra Board (SSC/HSC) — Marathi script  
   ✅ UP Board — Hindi/Devanagari script
   ✅ Rajasthan Board (RBSE)
   ✅ Tamil Nadu Board (TNBSE) — Tamil script
   ✅ Karnataka Board (KSEEB) — Kannada script
   ✅ Andhra / Telangana (BSEAP/BSETS) — Telugu script
   ✅ Kerala Board (DHSE) — Malayalam script
   ✅ Bihar Board (BSEB)
   ✅ West Bengal Board (WBBSE)
   ✅ Punjab Board (PSEB) — Punjabi/Gurmukhi
   ✅ Delhi Board
   ✅ All State University marksheets
   ✅ IIT / NIT / Central University marksheets (CGPA/GPA format)
   
   ── FOREIGN COUNTRIES ──────────────────────────────────────────────────────
   ✅ Australia (ATAR, HSC, VCE, QCE, WACE, SACE, TCE)
   ✅ United Kingdom (A-Levels, GCSEs, Scottish Highers)
   ✅ United States (GPA, SAT, AP scores, transcripts)
   ✅ Canada (Ontario, BC, Alberta transcripts)
   ✅ New Zealand (NCEA)
   ✅ Singapore (O-Level, A-Level, IB)
   ✅ UAE / Middle East (CBSE + local boards)
   ✅ Germany (Abitur — 1–6 scale)
   ✅ France (Baccalauréat — /20 scale)
   ✅ Netherlands (/10 scale)
   ✅ China (百分制 — /100 scale)
   ✅ IB (International Baccalaureate — /45 points)
   ✅ Cambridge International (A* to U grades)
   
   ── FORMATS HANDLED ────────────────────────────────────────────────────────
   ✅ Marks format      : 85/100, 85 out of 100
   ✅ Percentage format : 85%, 85.00%
   ✅ GPA format        : 3.8/4.0, 8.5/10
   ✅ Grade format      : A+, A, B+, HD, D, Merit, Pass
   ✅ Points format     : IB 38/45
   ✅ German scale      : 1.0 to 6.0
   ✅ French scale      : 14/20, 16.5/20
   ✅ CGPA              : 8.5 CGPA, 9.2/10
   ✅ Letter grades     : A+, A, A-, B+, B etc.
   ✅ Descriptive       : Excellent, Very Good, Good, Pass
   ✅ Mixed scripts     : All Indian languages cleaned automatically
   ✅ Table format      : column-based marksheets
   ✅ List format       : subject-per-line marksheets
   ✅ Watermarked docs  : enhanced preprocessing
═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 1 — DISTINCTION / GRADE SYSTEM
═══════════════════════════════════════════════════════════════════════════ */

export const calculateDistinction = (percentage) => {
  if (percentage >= 90) return 'HD';
  if (percentage >= 75) return 'D';
  if (percentage >= 65) return 'M';
  if (percentage >= 33) return 'P';
  return 'F';
};

export const getDistinctionLabel = (code) => {
  const map = {
    HD: 'High Distinction',
    D : 'Distinction',
    M : 'Merit',
    P : 'Pass',
    F : 'Fail',
  };
  return map[code] ?? 'Fail';
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 2 — LANGUAGE / SCRIPT DETECTION & CLEANING
═══════════════════════════════════════════════════════════════════════════ */

// Detect which country/board this marksheet is likely from
const detectMarksheetOrigin = (text) => {
  const upper = text.toUpperCase();

  // Indian boards
  if (/CBSE|CENTRAL BOARD|AISSE|AISSCE|SECONDARY SCHOOL EXAMINATION/.test(upper)) return 'CBSE';
  if (/ICSE|\bISC\b|COUNCIL FOR THE INDIAN|INDIAN CERTIFICATE OF SECONDARY/.test(upper)) return 'ICSE';
  if (/GUJARAT|GSEB|GANDHINAGAR|VADODARA/.test(upper))    return 'GUJARAT';
  if (/MAHARASHTRA|MUMBAI|PUNE|MSBSHSE/.test(upper))      return 'MAHARASHTRA';
  if (/UTTAR PRADESH|UP BOARD|ALLAHABAD/.test(upper))     return 'UP';
  if (/TAMIL NADU|TNBSE|CHENNAI/.test(upper))             return 'TAMILNADU';
  if (/KARNATAKA|KSEEB|BANGALORE/.test(upper))            return 'KARNATAKA';
  if (/ANDHRA|TELANGANA|BSEAP|HYDERABAD/.test(upper))     return 'ANDHRA';
  if (/KERALA|DHSE|THIRUVANANTHAPURAM/.test(upper))       return 'KERALA';
  if (/RAJASTHAN|RBSE|AJMER/.test(upper))                 return 'RAJASTHAN';
  if (/WEST BENGAL|WBBSE|KOLKATA/.test(upper))            return 'WESTBENGAL';
  if (/PUNJAB|PSEB|MOHALI/.test(upper))                   return 'PUNJAB';
  if (/BIHAR|BSEB|PATNA/.test(upper))                     return 'BIHAR';

  // Foreign
  if (/AUSTRALIA|ATAR|VCE|HSC|WACE|SACE|QCE|TCE/.test(upper))   return 'AUSTRALIA';
  if (/A-LEVEL|GCSE|SCOTTISH|EDEXCEL|AQA|OCR/.test(upper))      return 'UK';
  if (/GPA|TRANSCRIPT|CUMULATIVE|SEMESTER|CREDIT/.test(upper))   return 'USA';
  if (/ONTARIO|BRITISH COLUMBIA|ALBERTA/.test(upper))            return 'CANADA';
  if (/NCEA|NEW ZEALAND/.test(upper))                            return 'NEWZEALAND';
  if (/INTERNATIONAL BACCALAUREATE|IB DIPLOMA/.test(upper))      return 'IB';
  if (/CAMBRIDGE|IGCSE|O LEVEL|A LEVEL/.test(upper))             return 'CAMBRIDGE';
  if (/ABITUR|GYMNASIUM|BUNDESLAND/.test(upper))                 return 'GERMANY';
  if (/BACCALAURÉAT|BAC|LYCÉE/.test(upper))                      return 'FRANCE';
  if (/SINGAPORE|SEAB|MOE/.test(upper))                          return 'SINGAPORE';

  return 'GENERIC';
};

// Remove all non-Latin scripts but preserve structure
const removeNonLatinScripts = (text) => {
  return text
    // ── Indian scripts ────────────────────────────────────────────────────
    .replace(/[\u0A00-\u0A7F]/g, ' ')   // Gujarati
    .replace(/[\u0900-\u097F]/g, ' ')   // Devanagari (Hindi, Marathi, Sanskrit)
    .replace(/[\u0B80-\u0BFF]/g, ' ')   // Tamil
    .replace(/[\u0C00-\u0C7F]/g, ' ')   // Telugu
    .replace(/[\u0C80-\u0CFF]/g, ' ')   // Kannada
    .replace(/[\u0D00-\u0D7F]/g, ' ')   // Malayalam
    .replace(/[\u0A80-\u0AFF]/g, ' ')   // Gujarati extended
    .replace(/[\u0980-\u09FF]/g, ' ')   // Bengali
    .replace(/[\u0A00-\u0A7F]/g, ' ')   // Gurmukhi (Punjabi)
    .replace(/[\u0B00-\u0B7F]/g, ' ')   // Odia
    // ── East Asian scripts ────────────────────────────────────────────────
    .replace(/[\u4E00-\u9FFF]/g, ' ')   // CJK (Chinese, Japanese, Korean)
    .replace(/[\u3040-\u309F]/g, ' ')   // Hiragana
    .replace(/[\u30A0-\u30FF]/g, ' ')   // Katakana
    .replace(/[\uAC00-\uD7AF]/g, ' ')   // Korean Hangul
    // ── Arabic / Persian / Urdu ───────────────────────────────────────────
    .replace(/[\u0600-\u06FF]/g, ' ')   // Arabic / Urdu
    .replace(/[\u0750-\u077F]/g, ' ')   // Arabic supplement
    // ── Other scripts ─────────────────────────────────────────────────────
    .replace(/[\u0370-\u03FF]/g, ' ')   // Greek
    .replace(/[\u0400-\u04FF]/g, ' ')   // Cyrillic
    .replace(/[\u0E00-\u0E7F]/g, ' ')   // Thai
    // ── Cleanup ───────────────────────────────────────────────────────────
    .replace(/[^\x00-\x7F]/g, ' ')      // any remaining non-ASCII
    .replace(/[ \t]{2,}/g, ' ')         // collapse spaces
    .trim();
};

const cleanText = (text) => {
  return removeNonLatinScripts(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 3 — FORMAT DETECTION
═══════════════════════════════════════════════════════════════════════════ */

const detectFormat = (text, origin) => {
  const upper = text.toUpperCase();

  // IB format (points out of 45) — check before GPA since IB text can mention "points"
  if (/IB DIPLOMA|INTERNATIONAL BACCALAUREATE/.test(upper)) return 'IB';

  // German Abitur (grades 1-6, lower is better)
  if (origin === 'GERMANY' || /ABITUR|ZEUGNIS/.test(upper)) return 'GERMAN';

  // French Bac (/20) — must be an actual score like "14/20" or "16,5 / 20",
  // not just any "/20" substring (which also appears inside dates like 04/04/2002)
  if (origin === 'FRANCE' || /BACCALAURÉAT/.test(upper) ||
      /\b\d{1,2}(?:[.,]\d{1,2})?\s*\/\s*20\b/.test(upper)) return 'FRENCH';

  // Cambridge letter grades
  if (/A\*|A-LEVEL|GCSE|IGCSE/.test(upper))             return 'CAMBRIDGE';

  // Australian ATAR
  if (/ATAR|AUSTRALIAN TERTIARY/.test(upper))            return 'ATAR';

  // CBSE — uses either marks/100 or the 9-point grade scale (A1,A2,B1,B2,C1,C2,D,E1,E2)
  if (origin === 'CBSE') return 'CBSE';

  // ICSE / ISC — subject + single mark out of 100, no explicit "max marks" column
  if (origin === 'ICSE') return 'ICSE';

  // GPA formats (Indian universities / general CGPA marksheets)
  if (/\bCGPA\b|\bGPA\b/.test(upper))                   return 'GPA';

  // US GPA /4.0
  if (/4\.0|GRADE POINT AVERAGE/.test(upper))            return 'US_GPA';

  // Standard percentage/marks
  return 'STANDARD';
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 4 — MAIN ENTRY POINT
═══════════════════════════════════════════════════════════════════════════ */

export const processMarksheetData = (rawText) => {
  // Step 1: Detect origin before cleaning
  const origin = detectMarksheetOrigin(rawText);
  console.log('Detected origin:', origin);

  // Step 2: Clean text (remove non-Latin scripts)
  const text  = cleanText(rawText);
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  // Step 3: Detect format
  const format = detectFormat(text, origin);
  console.log('Detected format:', format);

  // Step 4: Extract student info
  const studentInfo = extractStudentInfo(text, origin);

  // Step 5: Extract subjects using format-specific parser
  let subjects = [];

  switch (format) {
    case 'GPA':       subjects = extractGPASubjects(lines, text);       break;
    case 'IB':        subjects = extractIBSubjects(lines, text);         break;
    case 'GERMAN':    subjects = extractGermanSubjects(lines, text);     break;
    case 'FRENCH':    subjects = extractFrenchSubjects(lines, text);     break;
    case 'CAMBRIDGE': subjects = extractCambridgeSubjects(lines, text);  break;
    case 'ATAR':      subjects = extractATARSubjects(lines, text);       break;
    case 'US_GPA':    subjects = extractUSGPASubjects(lines, text);      break;
    case 'CBSE':      subjects = extractCBSESubjects(lines, text);       break;
    case 'ICSE':      subjects = extractICSESubjects(lines, text);       break;
    default:          subjects = extractStandardSubjects(lines, text);   break;
  }

  // Step 6: Fallback — if no subjects found, try all parsers
  if (subjects.length === 0) {
    subjects = tryAllParsers(lines, text);
  }

  // Step 7: Calculate totals
  const totals = extractTotals(text, subjects, format);

  const finalObtained = totals.obtained ||
    subjects.reduce((s, x) => s + (x.obtainedMarks || 0), 0);
  const finalTotal = totals.total ||
    subjects.reduce((s, x) => s + (x.maxMarks || 0), 0);

  const percentage = finalTotal > 0
    ? (finalObtained / finalTotal) * 100
    : totals.percentage || 0;

  const distinction = calculateDistinction(percentage);

  return {
    origin,
    format,
    studentInfo,
    subjects,
    obtainedMarks    : finalObtained,
    totalMarks       : finalTotal,
    percentage       : parseFloat(percentage.toFixed(2)),
    distinction,
    distinctionLabel : getDistinctionLabel(distinction),
    result           : totals.result || (percentage >= 33 ? 'PASS' : 'FAIL'),
    rawGPA           : totals.gpa || null,
    rawATAR          : totals.atar || null,
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 5 — STUDENT INFO EXTRACTION
═══════════════════════════════════════════════════════════════════════════ */

const extractStudentInfo = (text, origin) => {
  const info = {
    name        : '',
    rollNumber  : '',
    seatNumber  : '',
    studentId   : '',
    class       : '',
    school      : '',
    board       : '',
    examYear    : '',
    fatherName  : '',
    motherName  : '',
    result      : '',
    percentage  : '',
    gpa         : '',
    atar        : '',
    dob         : '',
  };

  // ── Name patterns (universal) ─────────────────────────────────────────────
  // NOTE: [ \t] is used instead of \s between keyword and value so a match can
  // never accidentally cross a line break onto unrelated text.
  const namePatterns = [
    /candidate['s\s]*name[ \t]*[:\-.]?[ \t]*([A-Z][A-Z \t]{3,60})/i,
    /student['s\s]*name[ \t]*[:\-.]?[ \t]*([A-Z][A-Z \t]{3,60})/i,
    /name[ \t]+of[ \t]+(?:the[ \t]+)?student[ \t]*[:\-.]?[ \t]*([A-Z][A-Z \t]{3,60})/i,
    // CBSE-style: "This is to certify that ANANYA MISHRA"
    /certify[ \t]+that[ \t]+([A-Z][A-Z \t]{3,60})/i,
    /name[ \t]*[:\-][ \t]*([A-Z][A-Z \t]{3,50})/i,
    // After "Mr/Ms/Mrs"
    /(?:Mr|Ms|Mrs|Dr|Prof)\.?[ \t]+([A-Z][A-Za-z \t]{3,50})/,
    // ICSE-style bare "Name KRINA NISHIT KHOKHANI" (no colon at all) — kept as
    // a late fallback since it's the loosest pattern
    /\bname[ \t]+([A-Z][A-Z \t]{3,60})/i,
    // After seat number (Gujarat-style boards), same line only — most fragile,
    // kept last
    /[A-Z][ \t]*\d{5,8}[ \t]+([A-Z][A-Z \t]{5,50})\b/,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) {
      const candidate = m[1].trim().replace(/[ \t]{2,}/g, ' ');
      if (candidate && !isNonNameWord(candidate)) {
        info.name = candidate.substring(0, 70);
        break;
      }
    }
  }

  // ── Roll / Seat / Student ID ──────────────────────────────────────────────
  const idPatterns = [
    { key: 'seatNumber',  pattern: /seat\s*no\.?\s*[:\-.]?\s*([A-Z]?\s*\d{4,8})/i },
    { key: 'rollNumber',  pattern: /roll\s*no\.?\s*[:\-.]?\s*([A-Z0-9\-\/]{3,15})/i },
    { key: 'rollNumber',  pattern: /roll\s*number\s*[:\-.]?\s*([A-Z0-9\-\/]{3,15})/i },
    { key: 'studentId',   pattern: /unique\s*id\s*[:\-.]?\s*([A-Z0-9\-\/]{3,20})/i },
    { key: 'studentId',   pattern: /(?:student|enrollment|enrolment)\s*(?:id|no|number)\s*[:\-.]?\s*([A-Z0-9\-\/]{3,20})/i },
    { key: 'studentId',   pattern: /(?:registration|reg)\s*(?:no|number)\s*[:\-.]?\s*([A-Z0-9\-\/]{3,20})/i },
    { key: 'studentId',   pattern: /(?:admission|adm)\s*(?:no|number)\s*[:\-.]?\s*([A-Z0-9\-\/]{3,20})/i },
    // Standalone seat number like "B 327103"
    { key: 'seatNumber',  pattern: /\b([A-Z]\s*\d{6})\b/ },
  ];
  for (const { key, pattern } of idPatterns) {
    if (!info[key]) {
      const m = text.match(pattern);
      if (m) info[key] = m[1].replace(/\s/g, '').trim();
    }
  }

  // ── Class / Grade / Year ──────────────────────────────────────────────────
  const classPatterns = [
    /(?:class|grade|std|standard|form)\s*[:\-.]?\s*([A-Z0-9\s\-]{1,20})/i,
    /(?:year)\s*(?:of\s+study)?\s*[:\-.]?\s*(\d{1,2}(?:st|nd|rd|th)?)/i,
    /\b(class\s+(?:x|xi|xii|\d{1,2}))\b/i,
  ];
  for (const p of classPatterns) {
    const m = text.match(p);
    if (m) { info.class = m[1].trim().substring(0, 20); break; }
  }

  // ── School / College / University ────────────────────────────────────────
  const schoolPatterns = [
    /(?:school|college|university|institute|institution)\s*(?:name|of)?\s*[:\-.]?\s*([A-Za-z\s,\.]{5,80})/i,
    /(?:name\s+of\s+(?:school|college|institution))\s*[:\-.]?\s*([A-Za-z\s,\.]{5,80})/i,
  ];
  for (const p of schoolPatterns) {
    const m = text.match(p);
    if (m) {
      const s = m[1].trim().split('\n')[0];
      if (s.length > 4) { info.school = s.substring(0, 80); break; }
    }
  }

  // ── Board / Exam body ─────────────────────────────────────────────────────
  const boardPatterns = [
    /(?:board|examination\s+board|examining\s+body)\s*[:\-.]?\s*([A-Za-z\s]{5,60})/i,
  ];
  for (const p of boardPatterns) {
    const m = text.match(p);
    if (m) { info.board = m[1].trim().substring(0, 60); break; }
  }

  // ── Exam year ─────────────────────────────────────────────────────────────
  const yearPatterns = [
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
    /(?:year|session|batch|academic\s+year)\s*[:\-.]?\s*(\d{4}(?:\s*[-–]\s*\d{4})?)/i,
    /\b(20\d{2}|19\d{2})\b/,
  ];
  for (const p of yearPatterns) {
    const m = text.match(p);
    if (m) { info.examYear = m[1].trim(); break; }
  }

  // ── Date of Birth ─────────────────────────────────────────────────────────
  const dobMatch = text.match(
    /(?:date\s+of\s+birth|dob|d\.o\.b)\s*[:\-.]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  );
  if (dobMatch) info.dob = dobMatch[1];

  // ── Father / Mother name ──────────────────────────────────────────────────
  // Colon is optional since boards like CBSE print "Father's / Guardian's Name
  // MANOJ KUMAR MISHRA" with no punctuation. [ \t] keeps matches on one line.
  const fatherMatch =
    text.match(/father(?:'s)?(?:[ \t]*\/[ \t]*guardian's)?[ \t]*name[ \t]*[:\-]?[ \t]*([A-Z][A-Za-z \t]{3,50})/i) ||
    text.match(/\bshri\.?[ \t]+([A-Z][A-Za-z \t]{3,50})/i); // ICSE: "Shri NISHIT KHOKHANI" = father
  if (fatherMatch) info.fatherName = fatherMatch[1].trim();

  const motherMatch =
    text.match(/mother(?:'s)?[ \t]*name[ \t]*[:\-]?[ \t]*([A-Z][A-Za-z \t]{3,50})/i) ||
    text.match(/\bsmt\.?[ \t]+([A-Z][A-Za-z \t]{3,50})/i); // ICSE: "Smt MEGHANA KHOKHANI" = mother
  if (motherMatch) info.motherName = motherMatch[1].trim();

  // ── Result ────────────────────────────────────────────────────────────────
  const resultMatch = text.match(
    /\b(PASS|FAIL|ATKT|COMPARTMENT|DISTINCTION|MERIT|ABSENT|WITHHELD)\b/i
  );
  if (resultMatch) {
    const r = resultMatch[1].toUpperCase();
    info.result = ['DISTINCTION', 'MERIT'].includes(r) ? 'PASS' : r;
  }

  // ── GPA / CGPA / ATAR ────────────────────────────────────────────────────
  const gpaMatch = text.match(
    /(?:cgpa|gpa|grade\s+point\s+average)\s*[:\-.]?\s*(\d+(?:\.\d{1,2})?)/i
  );
  if (gpaMatch) info.gpa = gpaMatch[1];

  const atarMatch = text.match(
    /(?:atar|australian\s+tertiary\s+admission\s+rank)\s*[:\-.]?\s*(\d{1,2}(?:\.\d{1,2})?)/i
  );
  if (atarMatch) info.atar = atarMatch[1];

  const pctMatch = text.match(
    /(?:percentage|percent|%)\s*[:\-.]?\s*(\d{2,3}(?:\.\d{1,2})?)/i
  ) || text.match(/(\d{2,3}(?:\.\d{1,2})?)\s*%/);
  if (pctMatch) info.percentage = pctMatch[1];

  return info;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 6 — STANDARD SUBJECT PARSER
   (Indian boards, most international boards with marks/percentage)
═══════════════════════════════════════════════════════════════════════════ */

const extractStandardSubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const result = parseStandardLine(line);
    if (result && !isDuplicate(subjects, result.name)) {
      subjects.push(result);
    }
  }

  // If line-by-line got nothing, try block scan
  if (subjects.length === 0) {
    return scanTextBlock(fullText);
  }

  return subjects;
};

const parseStandardLine = (line) => {
  const t = line.trim();
  if (t.length < 4) return null;

  const patterns = [
    // "01_GUJARATI FL        100    58"   Indian board with code prefix
    /^(?:\d{1,3}[_\-.\s]+)?([A-Z][A-Z\s&\-_\.\/\(\)]{2,45}?)\s{2,}(\d{1,3})\s{1,10}(\d{1,3})(?:\s|$)/,

    // "Mathematics           100    91"   Clean format
    /^([A-Z][A-Za-z\s&\-_\.\/\(\)]{2,45}?)\s{2,}(\d{1,3})\s{1,8}(\d{1,3})(?:\s|$)/,

    // "English : 70/100"   Colon separator
    /([A-Za-z][A-Za-z\s&\-_\.]{2,45}?)\s*[:\-]\s*(\d{1,3})\s*[\/\\out of]\s*(\d{1,3})/i,

    // "Science    85   100"   Tab or multi-space
    /^(?:\d{1,3}[_\-.\s]+)?([A-Z][A-Z\s&\-_\.]{2,40}?)\s+(\d{1,3})\s+(\d{1,3})\s*$/,

    // "Physics|85|100"   Pipe-separated (some PDFs)
    /([A-Za-z][A-Za-z\s&]{2,40}?)\s*\|\s*(\d{1,3})\s*\|\s*(\d{1,3})/,

    // "Chemistry,85,100"   Comma-separated
    /([A-Za-z][A-Za-z\s&]{2,40}?),\s*(\d{1,3}),\s*(\d{1,3})/,

    // "History (85/100)"   Parentheses
    /([A-Za-z][A-Za-z\s&]{2,40}?)\s*\(\s*(\d{1,3})\s*\/\s*(\d{1,3})\s*\)/,

    // "Geography 85%"   Percentage only
    /([A-Za-z][A-Za-z\s&]{3,40}?)\s+(\d{2,3}(?:\.\d{1,2})?)\s*%/,
  ];

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (!match) continue;

    const rawName = match[1];
    let n1        = parseFloat(match[2]);
    let n2        = match[3] ? parseFloat(match[3]) : null;

    const name = cleanSubjectName(rawName);
    if (!name || name.length < 2)    continue;
    if (isNonSubject(name))          continue;
    if (isNaN(n1))                   continue;

    // Percentage-only pattern
    if (n2 === null) {
      const pct  = n1;
      const dist = calculateDistinction(pct);
      return {
        name,
        maxMarks         : 100,
        obtainedMarks    : pct,
        percentage       : parseFloat(pct.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : pct >= 33,
        isPercentageOnly : true,
      };
    }

    if (isNaN(n2)) continue;

    // Determine total vs obtained
    let maxMarks, obtainedMarks;
    if (n2 <= n1) {
      maxMarks = n1; obtainedMarks = n2;
    } else {
      maxMarks = n2; obtainedMarks = n1;
    }

    // Validation
    if (maxMarks < 1 || maxMarks > 1000) continue;
    if (obtainedMarks < 0)               continue;
    if (obtainedMarks > maxMarks)        continue;

    const pct  = (obtainedMarks / maxMarks) * 100;
    const dist = calculateDistinction(pct);

    return {
      name,
      maxMarks      : Math.round(maxMarks),
      obtainedMarks : Math.round(obtainedMarks),
      percentage    : parseFloat(pct.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed      : obtainedMarks >= maxMarks * 0.33,
    };
  }

  return null;
};

/* ─── Block scanner fallback ─────────────────────────────────────────────── */
const scanTextBlock = (text) => {
  const subjects = [];
  const pattern  =
    /([A-Z][A-Z\s&\-_\.]{3,45}?)\s{2,}(\d{1,3})\s{1,8}(\d{1,3})/g;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const name = cleanSubjectName(match[1]);
    const n1   = parseInt(match[2]);
    const n2   = parseInt(match[3]);

    if (!name || name.length < 3) continue;
    if (isNonSubject(name))       continue;
    if (isNaN(n1) || isNaN(n2))  continue;
    if (isDuplicate(subjects, name)) continue;

    const maxMarks      = n2 <= n1 ? n1 : n2;
    const obtainedMarks = n2 <= n1 ? n2 : n1;

    if (maxMarks < 1 || maxMarks > 1000) continue;
    if (obtainedMarks > maxMarks)        continue;

    const pct  = (obtainedMarks / maxMarks) * 100;
    const dist = calculateDistinction(pct);

    subjects.push({
      name,
      maxMarks,
      obtainedMarks,
      percentage       : parseFloat(pct.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed         : obtainedMarks >= maxMarks * 0.33,
    });
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 7 — GPA PARSER
   (Indian universities, US transcripts)
═══════════════════════════════════════════════════════════════════════════ */

const extractGPASubjects = (lines, fullText) => {
  const subjects = [];

  // Patterns for GPA-based marksheets
  const gpaPatterns = [
    // "Mathematics  4  A+  10.0  3.0"  (subject, credits, grade, points, earned)
    /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d{1,2})\s+([A-F][+\-]?|[OS])\s+(\d+(?:\.\d)?)/,

    // "Physics  A  8.5"  (subject, letter grade, points)
    /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+([A-F][+\-]?)\s+(\d+(?:\.\d{1,2})?)/,

    // "Chemistry  8.5/10"  (subject, GPA/scale)
    /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d+(?:\.\d{1,2})?)\s*\/\s*(10|4(?:\.0)?)/,

    // "Subject  85  B+"  (marks + letter grade)
    /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d{2,3})\s+([A-F][+\-]?[+\-]?)/,
  ];

  for (const line of lines) {
    const t = line.trim();
    if (t.length < 5) continue;

    for (const pattern of gpaPatterns) {
      const match = t.match(pattern);
      if (!match) continue;

      const name = cleanSubjectName(match[1]);
      if (!name || name.length < 3) continue;
      if (isNonSubject(name))       continue;
      if (isDuplicate(subjects, name)) continue;

      // Try to extract a percentage equivalent
      let percentage = 0;
      let maxMarks   = 100;
      let obtained   = 0;

      // If we have marks/100 style
      if (!isNaN(parseFloat(match[2])) && parseFloat(match[2]) <= 100) {
        obtained   = parseFloat(match[2]);
        maxMarks   = 100;
        percentage = obtained;
      }
      // If we have GPA/10
      else if (match[3] && (match[3] === '10' || match[3] === '4.0')) {
        const gpaScale = parseFloat(match[3]);
        const gpaVal   = parseFloat(match[2]);
        percentage = (gpaVal / gpaScale) * 100;
        maxMarks   = Math.round(gpaScale * 10);
        obtained   = Math.round(gpaVal * 10);
      }
      // Letter grade to percentage
      else if (match[2] && /^[A-F][+\-]?$/.test(match[2])) {
        percentage = letterGradeToPercentage(match[2]);
        maxMarks   = 100;
        obtained   = percentage;
      }

      if (percentage === 0) continue;

      const dist = calculateDistinction(percentage);
      subjects.push({
        name,
        maxMarks         : Math.round(maxMarks),
        obtainedMarks    : Math.round(obtained),
        percentage       : parseFloat(percentage.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : percentage >= 33,
        letterGrade      : match[3] || '',
      });
      break;
    }
  }

  // Fallback to standard
  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 8 — IB (INTERNATIONAL BACCALAUREATE) PARSER
   Total = 45 points, each subject = 1-7 points
═══════════════════════════════════════════════════════════════════════════ */

const extractIBSubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();

    // "Mathematics: Analysis  HL  6"  or  "Biology  SL  5"
    const ibPattern =
      /([A-Za-z][A-Za-z\s&\-:]{3,50}?)\s+(HL|SL|SL1|SL2)?\s*[:\-]?\s*([1-7])(?:\s|$)/i;

    const match = t.match(ibPattern);
    if (!match) continue;

    const name  = cleanSubjectName(match[1]);
    const level = match[2] || '';
    const score = parseInt(match[3]);

    if (!name || name.length < 3) continue;
    if (isNonSubject(name))       continue;
    if (isNaN(score) || score < 1 || score > 7) continue;
    if (isDuplicate(subjects, name)) continue;

    const percentage = (score / 7) * 100;
    const dist       = calculateDistinction(percentage);

    subjects.push({
      name             : level ? `${name} (${level})` : name,
      maxMarks         : 7,
      obtainedMarks    : score,
      percentage       : parseFloat(percentage.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed         : score >= 3,
      ibLevel          : level,
      ibScore          : score,
    });
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 9 — CAMBRIDGE / A-LEVEL / GCSE PARSER
   Grades: A*, A, B, C, D, E, U (A-Level) | A*-G (GCSE)
═══════════════════════════════════════════════════════════════════════════ */

const extractCambridgeSubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();

    // "Mathematics  9601  A*"  or  "Physics  A"  or  "English Language  B"
    const patterns = [
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+\d{4}\s+(A\*|[A-GU])(?:\s|$)/i,
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(A\*\*?|[A-GU])(?:\s|$)/i,
      // With marks: "Biology  72  A"
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d{2,3})\s+(A\*\*?|[A-GU])(?:\s|$)/i,
    ];

    for (const pattern of patterns) {
      const match = t.match(pattern);
      if (!match) continue;

      const name        = cleanSubjectName(match[1]);
      let marks         = null;
      let letterGrade   = '';

      if (match.length === 4) {
        // Pattern with marks
        marks       = parseInt(match[2]);
        letterGrade = match[3].toUpperCase();
      } else {
        letterGrade = match[2].toUpperCase();
      }

      if (!name || name.length < 3) continue;
      if (isNonSubject(name))       continue;
      if (isDuplicate(subjects, name)) continue;

      const percentage = marks !== null
        ? marks
        : cambridgeGradeToPercentage(letterGrade);

      const dist = calculateDistinction(percentage);

      subjects.push({
        name,
        maxMarks         : 100,
        obtainedMarks    : marks || percentage,
        percentage       : parseFloat(percentage.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : !['U', 'F'].includes(letterGrade),
        letterGrade,
      });
      break;
    }
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 10 — GERMAN ABITUR PARSER
   Scale: 1 (best) to 6 (fail), passing < 5
═══════════════════════════════════════════════════════════════════════════ */

const extractGermanSubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();

    // "Mathematik  2"  or  "Mathematik  2,0"  or  "Englisch  1.5"
    const pattern =
      /([A-Za-zäöüÄÖÜß][A-Za-zäöüÄÖÜß\s\-]{2,40}?)\s+([1-6](?:[,\.]\d)?)\s*(?:Punkte|Noten)?/i;

    const match = t.match(pattern);
    if (!match) continue;

    const name         = cleanSubjectName(match[1]);
    const germanGrade  = parseFloat(match[2].replace(',', '.'));

    if (!name || name.length < 2) continue;
    if (isNaN(germanGrade))        continue;
    if (germanGrade < 1 || germanGrade > 6) continue;
    if (isNonSubject(name))        continue;
    if (isDuplicate(subjects, name)) continue;

    // Convert German grade to percentage (1=100%, 6=0%)
    const percentage = Math.max(0, ((6 - germanGrade) / 5) * 100);
    const dist       = calculateDistinction(percentage);

    subjects.push({
      name,
      maxMarks         : 6,
      obtainedMarks    : germanGrade,
      percentage       : parseFloat(percentage.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed         : germanGrade <= 4,
      germanGrade,
      note             : `Grade ${germanGrade}/6 (German scale: 1=best, 6=fail)`,
    });
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 11 — FRENCH BAC PARSER
   Scale: 0-20, passing ≥ 10
═══════════════════════════════════════════════════════════════════════════ */

const extractFrenchSubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();

    // "Mathématiques  16/20"  or  "Histoire  12,5/20"
    const patterns = [
      /([A-Za-zéèêëàâùûüîïçæœÉÈÊËÀÂÙÛÜÎÏÇ][A-Za-zéèêëàâùûüîïçæœ\s\-]{2,40}?)\s+(\d{1,2}(?:[,\.]\d{1,2})?)\s*\/\s*20/i,
      /([A-Za-zéèêë][A-Za-zéèêëàâùûüîïçæœ\s\-]{2,40}?)\s+(\d{1,2}(?:[,\.]\d)?)\s*$/,
    ];

    for (const pattern of patterns) {
      const match = t.match(pattern);
      if (!match) continue;

      const name      = cleanSubjectName(match[1]);
      const frScore   = parseFloat(match[2].replace(',', '.'));

      if (!name || name.length < 2) continue;
      if (isNaN(frScore))            continue;
      if (frScore < 0 || frScore > 20) continue;
      if (isNonSubject(name))        continue;
      if (isDuplicate(subjects, name)) continue;

      const percentage = (frScore / 20) * 100;
      const dist       = calculateDistinction(percentage);

      subjects.push({
        name,
        maxMarks         : 20,
        obtainedMarks    : frScore,
        percentage       : parseFloat(percentage.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : frScore >= 10,
        frenchScore      : frScore,
        note             : `${frScore}/20 (French scale)`,
      });
      break;
    }
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 12 — AUSTRALIAN ATAR / VCE / HSC PARSER
═══════════════════════════════════════════════════════════════════════════ */

const extractATARSubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();

    // "Mathematical Methods  40  35  38.00"  (VCE style)
    // "Mathematics Advanced  90"  (HSC raw score)
    // "Biology  E  34  90.00"  (various)
    const patterns = [
      /([A-Za-z][A-Za-z\s&\-]{3,50}?)\s+(\d{1,3}(?:\.\d{1,2})?)\s+(\d{1,3}(?:\.\d{1,2})?)\s+(\d{2,3}(?:\.\d{1,2})?)/,
      /([A-Za-z][A-Za-z\s&\-]{3,50}?)\s+(\d{2,3}(?:\.\d{1,2})?)\s+(\d{2,3}(?:\.\d{1,2})?)/,
      /([A-Za-z][A-Za-z\s&\-]{3,50}?)\s+(\d{2,3}(?:\.\d{1,2})?)/,
    ];

    for (const pattern of patterns) {
      const match = t.match(pattern);
      if (!match) continue;

      const name = cleanSubjectName(match[1]);
      if (!name || name.length < 3) continue;
      if (isNonSubject(name))       continue;
      if (isDuplicate(subjects, name)) continue;

      // Take the last number as the "score"
      const numbers = [match[2], match[3], match[4]]
        .filter(Boolean)
        .map(parseFloat)
        .filter((n) => !isNaN(n) && n >= 0 && n <= 100);

      if (numbers.length === 0) continue;

      const score      = numbers[numbers.length - 1];
      const percentage = score; // HSC marks are already % equivalent
      const dist       = calculateDistinction(percentage);

      subjects.push({
        name,
        maxMarks         : 100,
        obtainedMarks    : Math.round(score),
        percentage       : parseFloat(percentage.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : percentage >= 33,
      });
      break;
    }
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 13 — US GPA PARSER (/4.0 scale)
═══════════════════════════════════════════════════════════════════════════ */

const extractUSGPASubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();

    // "Calculus AB  4  A  4.0  4.0"  (AP style)
    // "English  B+  3.3  3"  (transcript style)
    const patterns = [
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+([A-F][+\-]?)\s+(\d+(?:\.\d{1,2})?)\s+(\d+(?:\.\d)?)/,
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d)\s+([A-F][+\-]?)\s+(\d+(?:\.\d{1,2})?)/,
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+([A-F][+\-]?)\s+(\d+(?:\.\d{1,2})?)/,
    ];

    for (const pattern of patterns) {
      const match = t.match(pattern);
      if (!match) continue;

      const name = cleanSubjectName(match[1]);
      if (!name || name.length < 3) continue;
      if (isNonSubject(name))        continue;
      if (isDuplicate(subjects, name)) continue;

      // Find the letter grade
      const lgMatch = t.match(/\b([A-F][+\-]?)\b/);
      if (!lgMatch) continue;

      const letterGrade = lgMatch[1].toUpperCase();
      const percentage  = letterGradeToPercentage(letterGrade);
      const dist        = calculateDistinction(percentage);

      subjects.push({
        name,
        maxMarks         : 100,
        obtainedMarks    : percentage,
        percentage       : parseFloat(percentage.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : !['D-', 'F'].includes(letterGrade),
        letterGrade,
      });
      break;
    }
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 13B — CBSE PARSER
   Handles both formats CBSE issues:
   a) Marks-based (Class XII, and older Class X): "086 English Lang & Lit 80 20 100 A1"
      (subject code, subject name, theory, practical/internal, total, grade)
   b) Grade-only (Class X since 2017): "086 English Language And Literature A1"
      (subject code, subject name, 9-point grade — no numeric marks printed at all)
═══════════════════════════════════════════════════════════════════════════ */

const CBSE_GRADES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'D', 'E1', 'E2'];
const CBSE_GRADE_RE = CBSE_GRADES.join('|');

const extractCBSESubjects = (lines, fullText) => {
  const subjects = [];

  for (const line of lines) {
    const t = line.trim();
    if (t.length < 4) continue;

    // (a) subject code + name + theory + practical/internal + total [+ "in words" + grade]
    //     e.g. "041 MATHEMATICS 80 20 100 ONE HUNDRED A1"
    //     The "total in words" text (if present) sits between the total and the grade,
    //     so the grade is pulled separately from the end of the line rather than
    //     requiring it to immediately follow the third number.
    let match = t.match(
      /^(?:\d{2,3}[_\-.\s]+)?([A-Za-z][A-Za-z\s&\-\.\/\(\)]{2,45}?)\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\b/i
    );
    if (match) {
      const name  = cleanSubjectName(match[1]);
      const total = parseInt(match[4], 10);
      const gradeAtEnd = t.match(new RegExp(`\\b(${CBSE_GRADE_RE})\\s*$`, 'i'));
      if (name && name.length >= 2 && !isNonSubject(name) && !isDuplicate(subjects, name) &&
          !isNaN(total) && total >= 0 && total <= 100) {
        const pct  = total; // CBSE totals are already /100
        const dist = calculateDistinction(pct);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : total,
          percentage       : parseFloat(pct.toFixed(2)),
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : pct >= 33,
          cbseGrade        : gradeAtEnd ? gradeAtEnd[1].toUpperCase() : '',
        });
        continue;
      }
    }

    // (b) subject code + name + single mark out of 100
    //     e.g. "041 MATHEMATICS 91"
    match = t.match(
      /^(?:\d{2,3}[_\-.\s]+)?([A-Za-z][A-Za-z\s&\-\.\/\(\)]{2,45}?)\s+(\d{1,3})\s*$/i
    );
    if (match) {
      const name  = cleanSubjectName(match[1]);
      const marks = parseInt(match[2], 10);
      if (name && name.length >= 2 && !isNonSubject(name) && !isDuplicate(subjects, name) &&
          !isNaN(marks) && marks >= 0 && marks <= 100) {
        const dist = calculateDistinction(marks);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : marks,
          percentage       : parseFloat(marks.toFixed(2)),
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : marks >= 33,
        });
        continue;
      }
    }

    // (c) subject code + name + 9-point grade only, no numeric marks
    //     e.g. "041 MATHEMATICS A1"
    match = t.match(
      new RegExp(`^(?:\\d{2,3}[_\\-.\\s]+)?([A-Za-z][A-Za-z\\s&\\-\\.\\/\\(\\)]{2,45}?)\\s+(${CBSE_GRADE_RE})(?:\\s|$)`, 'i')
    );
    if (match) {
      const name  = cleanSubjectName(match[1]);
      const grade = match[2].toUpperCase();
      if (name && name.length >= 2 && !isNonSubject(name) && !isDuplicate(subjects, name)) {
        const percentage = cbseGradeToPercentage(grade);
        const dist        = calculateDistinction(percentage);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : percentage,
          percentage       : parseFloat(percentage.toFixed(2)),
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : !['E1', 'E2'].includes(grade),
          cbseGrade        : grade,
          isGradeOnly      : true,
          note             : `Grade ${grade} (CBSE 9-point scale, no numeric marks on marksheet)`,
        });
      }
    }
  }

  if (subjects.length === 0) return extractStandardSubjects(lines, fullText);
  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 13C — ICSE / ISC PARSER
   ICSE marksheets typically list a subject once with a single mark out of 100
   (no printed "max marks" column), e.g. "ENGLISH 85" or "HISTORY & CIVICS 78".
   Some also show "INTERNAL 20 EXTERNAL 80 TOTAL 100" style breakdowns.
═══════════════════════════════════════════════════════════════════════════ */

const NUMBER_WORD_RE =
  '(?:ZERO|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|' +
  'THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|' +
  'THIRTY|FORTY|FIFTY|SIXTY|SEVENTY|EIGHTY|NINETY|HUNDRED)';

const extractICSESubjects = (lines, fullText) => {
  const groupSubjects = [];
  const componentSubjects = [];

  for (const line of lines) {
    const t = line.trim();
    if (t.length < 4) continue;

    // (a) The reliable, official per-subject row: name + percentage number +
    //     its spelled-out word form, e.g. "ENGLISH 96 NINE SIX" or
    //     "ECONOMIC APPLICATIONS 100 100 ONE HUNDRED" (total marks + % + words).
    //     This is the row ICSE marksheets use for the actual subject-level
    //     percentage — sub-component rows (individual papers) never have the
    //     trailing word form, so this pattern cleanly separates the two.
    const groupMatch = t.match(new RegExp(
      `^([A-Za-z][A-Za-z,&\\s\\-\\.\\/\\(\\)]{2,45}?)\\s+(?:\\d{1,3}\\s+)?(\\d{1,3})\\s+(?:${NUMBER_WORD_RE}\\s*)+$`,
      'i'
    ));
    if (groupMatch) {
      const name = cleanSubjectName(groupMatch[1]);
      const pct  = parseInt(groupMatch[2], 10);
      if (name && name.length >= 2 && !isNonSubject(name) && !isDuplicate(groupSubjects, name) &&
          !isNaN(pct) && pct >= 0 && pct <= 100) {
        const dist = calculateDistinction(pct);
        groupSubjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : pct,
          percentage       : parseFloat(pct.toFixed(2)),
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : pct >= 33,
        });
        continue;
      }
    }

    // (b) Fallback candidates: internal/external/total breakdown, or a bare
    //     "name  marks" line — kept aside and only used if no group rows (a)
    //     were found anywhere in the document (older ICSE layouts that don't
    //     print the words column at all).
    let compMatch = t.match(
      /^([A-Za-z][A-Za-z\s&\-\.\/\(\)]{2,45}?)\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*$/
    );
    if (compMatch) {
      const name  = cleanSubjectName(compMatch[1]);
      const total = parseInt(compMatch[4], 10);
      if (name && name.length >= 2 && !isNonSubject(name) && !isDuplicate(componentSubjects, name) &&
          !isNaN(total) && total >= 0 && total <= 100) {
        const dist = calculateDistinction(total);
        componentSubjects.push({
          name, maxMarks: 100, obtainedMarks: total,
          percentage: parseFloat(total.toFixed(2)), distinction: dist,
          distinctionLabel: getDistinctionLabel(dist), isPassed: total >= 33,
        });
        continue;
      }
    }

    compMatch = t.match(/^([A-Za-z][A-Za-z\s&\-\.\/\(\)]{2,45}?)\s{1,10}(\d{1,3})\s*$/);
    if (compMatch) {
      const name  = cleanSubjectName(compMatch[1]);
      const marks = parseInt(compMatch[2], 10);
      if (name && name.length >= 2 && !isNonSubject(name) && !isDuplicate(componentSubjects, name) &&
          !isNaN(marks) && marks >= 0 && marks <= 100) {
        const dist = calculateDistinction(marks);
        componentSubjects.push({
          name, maxMarks: 100, obtainedMarks: marks,
          percentage: parseFloat(marks.toFixed(2)), distinction: dist,
          distinctionLabel: getDistinctionLabel(dist), isPassed: marks >= 33,
        });
      }
    }
  }

  if (groupSubjects.length > 0) return groupSubjects;
  if (componentSubjects.length > 0) return componentSubjects;
  return extractStandardSubjects(lines, fullText);
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 14 — TOTALS EXTRACTION
═══════════════════════════════════════════════════════════════════════════ */

const extractTotals = (text, subjects, format) => {
  const result = {
    obtained   : 0,
    total      : 0,
    percentage : 0,
    result     : '',
    gpa        : null,
    atar       : null,
  };

  // ── CGPA / GPA ───────────────────────────────────────────────────────────
  const cgpaMatch = text.match(
    /(?:cgpa|overall\s+gpa|cumulative\s+gpa)\s*[:\-.]?\s*(\d+(?:\.\d{1,2})?)/i
  );
  if (cgpaMatch) {
    result.gpa = parseFloat(cgpaMatch[1]);
    // Convert to percentage
    const scale = result.gpa > 4 ? 10 : 4;
    result.percentage = (result.gpa / scale) * 100;
  }

  // ── ATAR ─────────────────────────────────────────────────────────────────
  const atarMatch = text.match(
    /atar\s*[:\-.]?\s*(\d{1,2}(?:\.\d{1,2})?)/i
  );
  if (atarMatch) {
    result.atar = parseFloat(atarMatch[1]);
    result.percentage = result.atar; // ATAR is already percentile
  }

  // ── Fraction format "463/650" ─────────────────────────────────────────────
  // Guard against false positives from dates like "04/04/2002" (which would
  // otherwise misread as "4 out of 2002"): reject matches immediately preceded
  // by another "dd/" (i.e. part of a longer dd/mm/yyyy date) and reject any
  // denominator that looks like a calendar year.
  if (!result.obtained) {
    const fracRe = /(\d{2,4})\s*\/\s*(\d{3,4})\b/g;
    let fm;
    while ((fm = fracRe.exec(text)) !== null) {
      const a = parseInt(fm[1], 10);
      const b = parseInt(fm[2], 10);
      const precedingChar = text.slice(0, fm.index).match(/(\d{1,2})\s*\/\s*$/);
      const looksLikeDate = precedingChar || (b >= 1900 && b <= 2100 && a <= 31);
      if (looksLikeDate) continue;
      if (b > a && b <= 9999 && a > 0) {
        result.obtained = a;
        result.total    = b;
        break;
      }
    }
  }

  // ── "Total Marks Obtained: 503" ───────────────────────────────────────────
  if (!result.obtained) {
    const totObtMatch = text.match(
      /total\s*marks?\s*obtained\s*(?:in\s*words)?\s*[:\-.]?\s*(\d{2,4})/i
    );
    if (totObtMatch) result.obtained = parseInt(totObtMatch[1]);
  }

  // ── "Total: 650" ──────────────────────────────────────────────────────────
  if (!result.total) {
    const totMatch = text.match(
      /total\s*(?:marks?|subjects?)?\s*[:\-.]?\s*(\d{3,4})(?!\s*\/)/i
    );
    if (totMatch) {
      const t2 = parseInt(totMatch[1]);
      if (t2 > (result.obtained || 0)) result.total = t2;
    }
  }

  // ── Percentage from text ──────────────────────────────────────────────────
  if (!result.percentage) {
    const pctMatch = text.match(
      /percentage\s*[:\-.]?\s*(\d{2,3}(?:\.\d{1,2})?)/i
    ) || text.match(/(\d{2,3}(?:\.\d{1,2})?)\s*%/);
    if (pctMatch) result.percentage = parseFloat(pctMatch[1]);
  }

  // ── Result keyword ────────────────────────────────────────────────────────
  const resMatch = text.match(
    /\b(PASS|FAIL|ATKT|DISTINCTION|MERIT|COMPARTMENT|ABSENT)\b/i
  );
  if (resMatch) {
    const r = resMatch[1].toUpperCase();
    result.result = ['DISTINCTION', 'MERIT'].includes(r) ? 'PASS' : r;
  }

  // ── Fallback: sum from parsed subjects ────────────────────────────────────
  if (!result.obtained && subjects.length > 0) {
    result.obtained = subjects.reduce(
      (s, x) => s + (x.obtainedMarks || 0), 0
    );
  }
  if (!result.total && subjects.length > 0) {
    result.total = subjects.reduce((s, x) => s + (x.maxMarks || 0), 0);
  }

  return result;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 15 — TRY ALL PARSERS FALLBACK
═══════════════════════════════════════════════════════════════════════════ */

const tryAllParsers = (lines, fullText) => {
  const parsers = [
    () => extractStandardSubjects(lines, fullText),
    () => extractCBSESubjects(lines, fullText),
    () => extractICSESubjects(lines, fullText),
    () => extractGPASubjects(lines, fullText),
    () => extractCambridgeSubjects(lines, fullText),
    () => extractFrenchSubjects(lines, fullText),
    () => extractGermanSubjects(lines, fullText),
    () => extractATARSubjects(lines, fullText),
    () => extractUSGPASubjects(lines, fullText),
    () => extractIBSubjects(lines, fullText),
  ];

  for (const parser of parsers) {
    try {
      const result = parser();
      if (result && result.length > 0) return result;
    } catch {
      continue;
    }
  }

  return [];
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 16 — HELPER UTILITIES
═══════════════════════════════════════════════════════════════════════════ */

// Clean and normalise subject name
const cleanSubjectName = (raw) => {
  if (!raw) return '';

  return raw
    .replace(/^\d{1,3}[_\-.\s]+/, '')    // Remove "01_" prefix codes
    .replace(/[_]+/g, ' ')               // Underscores → spaces
    .replace(/[^\w\s&\-\/\(\)\.]/g, '')  // Remove special chars
    .replace(/\s{2,}/g, ' ')             // Collapse spaces
    .trim()
    .split(' ')
    .map((w) => {
      if (!w) return '';
      // Keep short abbreviations uppercase
      if (w.length <= 3 && /^[A-Z]+$/.test(w)) return w;
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ')
    // Fix common abbreviations
    .replace(/\bSl\b/gi, 'SL')
    .replace(/\bFl\b/gi, 'FL')
    .replace(/\bHl\b/gi, 'HL')
    .replace(/\bIt\b/gi, 'IT')
    .replace(/\bEve\b/gi, 'EVE')
    .replace(/\bEvs\b/gi, 'EVS')
    .trim();
};

// Check if a name is a known non-subject word
const isNonSubject = (name) => {
  const NON_SUBJECTS = new Set([
    'TOTAL', 'GRAND TOTAL', 'TOTAL MARKS', 'OBTAINED', 'MARKS OBTAINED',
    'RESULT', 'PASS', 'FAIL', 'PERCENTAGE', 'GRADE', 'SEAT NO',
    'SEAT NUMBER', 'ROLL NO', 'CANDIDATE', 'NAME', 'DATE', 'MONTH',
    'YEAR', 'CENTRE', 'CENTER', 'SCHOOL', 'BOARD', 'STATEMENT',
    'SUBJECT', 'INDEX', 'MAXIMUM', 'MINIMUM', 'MARKS', 'NOTE',
    'IMPORTANT', 'SR NO', 'SR NUMBER', 'GRAND', 'SUB TOTAL',
    // Number words (from "MARKS OBTAINED IN WORDS")
    'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO', 'ONE',
    'TWO', 'THREE', 'FOUR', 'HUNDRED', 'ONLY', 'TEN', 'ELEVEN',
    'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY', 'THIRTY',
    'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY',
    // Common non-subject text
    'MONTH YEAR', 'OF EXAM', 'THEORY', 'PRACTICAL', 'INTERNAL',
    'EXTERNAL', 'WRITTEN', 'ORAL', 'PROJECT', 'VIVA',
    'SCHOOL INDEX', 'CENTRE NO', 'SR OF STATEMENT',
    // CBSE / ICSE marksheet boilerplate
    'SCHOLASTIC', 'CO SCHOLASTIC', 'CO-SCHOLASTIC', 'SCHOLASTIC AREA',
    'PART A', 'PART B', 'PART C', 'PART 1', 'PART 2', 'PART 3',
    'GRADE POINT', 'CREDIT POINT', 'QUALIFYING EXAM', 'PROVISIONAL',
    'DUPLICATE', 'CERTIFICATE', 'THIS CERTIFICATE', 'SPECIMEN',
    'GENUINENESS', 'VERIFICATION', 'SUBJECT CODE', 'SUBJECT NAME',
    'BEST FIVE', 'BEST OF FIVE', 'ADDITIONAL SUBJECT', 'CO CURRICULAR',
    'REGISTRATION NO', 'ENROLMENT NO', 'ENROLLMENT NO', 'MOTHER TONGUE',
    'ACADEMIC YEAR', 'DIVISION', 'AGGREGATE',
    // Seen on real CBSE / ICSE marksheets
    'STATEMENT OF MARKS', 'DAUGHTER OF', 'SON OF', 'POSITIONAL GRADE',
    'MAX MARKS', 'SUB CODE', 'IN WORDS', 'TOTAL IN WORDS', 'UNIQUE ID',
    'INTERNAL ASSESSMENT', 'SUBJECTS TOTAL MARKS', 'PERCENTAGE MARKS',
    'CHIEF EXECUTIVE', 'CONTROLLER OF EXAMINATIONS', 'COUNCIL FOR',
  ]);

  const upper = name.toUpperCase().trim();

  // Exact match
  if (NON_SUBJECTS.has(upper)) return true;

  // Starts with non-subject word
  for (const ns of NON_SUBJECTS) {
    if (upper.startsWith(ns + ' ') || upper.endsWith(' ' + ns)) return true;
  }

  // Pure number
  if (/^\d+$/.test(upper)) return true;

  // Too short
  if (upper.length < 2) return true;

  // Only special chars
  if (/^[\W\d]+$/.test(upper)) return true;

  return false;
};

// Check if a name is a person name (not a subject)
const isNonNameWord = (name) => {
  const SKIP = ['TOTAL', 'MARKS', 'PASS', 'FAIL', 'RESULT',
                'SUBJECT', 'OBTAINED', 'PERCENTAGE', 'GRADE', 'BOARD'];
  return SKIP.some((w) => name.toUpperCase().startsWith(w));
};

// Check duplicates
const isDuplicate = (subjects, name) =>
  subjects.some(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );

// Cambridge grade → percentage
const cambridgeGradeToPercentage = (grade) => {
  const map = {
    'A*': 95, 'A': 85, 'B': 75, 'C': 65,
    'D' : 55, 'E': 45, 'U': 15, 'G': 35, 'F': 25,
  };
  return map[grade.toUpperCase()] ?? 50;
};

// CBSE 9-point grade → percentage (approximate midpoint of each grade band)
const cbseGradeToPercentage = (grade) => {
  const map = {
    A1: 95, A2: 85, B1: 75, B2: 65,
    C1: 55, C2: 45, D1: 38, D2: 33,
    D : 38, E1: 20, E2: 10,
  };
  return map[grade.toUpperCase()] ?? 50;
};

// US letter grade → percentage
const letterGradeToPercentage = (grade) => {
  const map = {
    'A+': 97, 'A': 93, 'A-': 90,
    'B+': 87, 'B': 83, 'B-': 80,
    'C+': 77, 'C': 73, 'C-': 70,
    'D+': 67, 'D': 63, 'D-': 60,
    'F' : 30, 'O': 95, 'S': 75,
    // Indian grade letters
    'E' : 45,
  };
  return map[grade.toUpperCase()] ?? 50;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 17 — CALCULATE PERCENTAGE (used by hook)
═══════════════════════════════════════════════════════════════════════════ */

export const calculatePercentage = (subjects) => {
  if (!subjects || subjects.length === 0) {
    return {
      totalMarks   : 0,
      obtainedMarks: 0,
      percentage   : 0,
      distinction  : 'N/A',
      result       : 'N/A',
    };
  }

  const totalMarks    = subjects.reduce((s, sub) => s + (sub.maxMarks || 0), 0);
  const obtainedMarks = subjects.reduce((s, sub) => s + (sub.obtainedMarks || 0), 0);
  const percentage    = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
  const distinction   = calculateDistinction(percentage);
  const hasFailed     = subjects.some((sub) => !sub.isPassed);

  return {
    totalMarks,
    obtainedMarks,
    percentage  : parseFloat(percentage.toFixed(2)),
    distinction,
    result      : hasFailed ? 'FAIL' : percentage >= 33 ? 'PASS' : 'FAIL',
  };
};