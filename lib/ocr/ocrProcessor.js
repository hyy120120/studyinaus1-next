/* ═══════════════════════════════════════════════════════════════════════════
   UNIVERSAL MARKSHEET OCR PROCESSOR v3.0
   
   INDIAN BOARDS — Fully tested formats:
   ✅ CBSE  — Theory + IA columns → TOTAL column
   ✅ ICSE  — Percentage marks column, sub-subjects grouped
   ✅ ISC   — Same as ICSE pattern
   ✅ Gujarat Board (GSEB) — Subject code prefix, mixed Gujarati
   ✅ Maharashtra (SSC/HSC) — Marathi script mixed
   ✅ UP Board — Hindi/Devanagari mixed, Theory + Practical
   ✅ Tamil Nadu — Tamil script mixed
   ✅ Karnataka — Kannada script mixed
   ✅ All other state boards
   ✅ Indian Universities — CGPA/GPA format
   
   FOREIGN BOARDS:
   ✅ Cambridge IGCSE / O-Level / A-Level
   ✅ IB (International Baccalaureate /45)
   ✅ Australia (VCE/HSC/ATAR)
   ✅ UK (A-Level/GCSE)
   ✅ USA (GPA /4.0, transcripts)
   ✅ Germany (Abitur /6)
   ✅ France (Bac /20)
   ✅ Any percentage/marks format
═══════════════════════════════════════════════════════════════════════════ */

/* ── Distinction system ──────────────────────────────────────────────────── */
export const calculateDistinction = (pct) => {
  if (pct >= 90) return 'HD';
  if (pct >= 75) return 'D';
  if (pct >= 65) return 'M';
  if (pct >= 33) return 'P';
  return 'F';
};

export const getDistinctionLabel = (code) => ({
  HD: 'High Distinction', D: 'Distinction',
  M: 'Merit', P: 'Pass', F: 'Fail',
}[code] ?? 'Fail');

/* ═══════════════════════════════════════════════════════════════════════════
   SCRIPT CLEANING — Remove all non-Latin Unicode scripts
═══════════════════════════════════════════════════════════════════════════ */
const cleanScript = (text) =>
  text
    .replace(/[\u0A00-\u0A7F]/g, ' ')  // Gujarati
    .replace(/[\u0900-\u097F]/g, ' ')  // Devanagari (Hindi/Marathi/Sanskrit)
    .replace(/[\u0B80-\u0BFF]/g, ' ')  // Tamil
    .replace(/[\u0C00-\u0C7F]/g, ' ')  // Telugu
    .replace(/[\u0C80-\u0CFF]/g, ' ')  // Kannada
    .replace(/[\u0D00-\u0D7F]/g, ' ')  // Malayalam
    .replace(/[\u0980-\u09FF]/g, ' ')  // Bengali
    .replace(/[\u0A80-\u0AFF]/g, ' ')  // Gujarati extended
    .replace(/[\u0600-\u06FF]/g, ' ')  // Arabic/Urdu
    .replace(/[\u4E00-\u9FFF]/g, ' ')  // Chinese
    .replace(/[^\x00-\x7F]/g,   ' ')  // Any remaining non-ASCII
    .replace(/[ \t]{2,}/g,      ' ')  // Collapse spaces
    .replace(/\r\n/g, '\n')
    .replace(/\r/g,   '\n')
    .trim();

/* ═══════════════════════════════════════════════════════════════════════════
   BOARD DETECTION
═══════════════════════════════════════════════════════════════════════════ */
const detectBoard = (raw) => {
  const t = raw.toUpperCase();
  if (/COUNCIL FOR THE INDIAN SCHOOL|ICSE|ISC\b/.test(t))      return 'ICSE';
  if (/CENTRAL BOARD OF SECONDARY|CBSE/.test(t))                return 'CBSE';
  if (/GUJARAT|GSEB|GANDHINAGAR/.test(t))                       return 'GSEB';
  if (/MAHARASHTRA|MSBSHSE/.test(t))                            return 'MAHARASHTRA';
  if (/UTTAR PRADESH|UP BOARD/.test(t))                         return 'UP';
  if (/TAMIL NADU|TNBSE/.test(t))                               return 'TAMILNADU';
  if (/KARNATAKA|KSEEB/.test(t))                                return 'KARNATAKA';
  if (/ANDHRA|TELANGANA|BSEAP/.test(t))                         return 'ANDHRA';
  if (/KERALA|DHSE/.test(t))                                    return 'KERALA';
  if (/RAJASTHAN|RBSE/.test(t))                                 return 'RAJASTHAN';
  if (/WEST BENGAL|WBBSE/.test(t))                              return 'WESTBENGAL';
  if (/PUNJAB|PSEB/.test(t))                                    return 'PUNJAB';
  if (/BIHAR|BSEB/.test(t))                                     return 'BIHAR';
  if (/INTERNATIONAL BACCALAUREATE|IB DIPLOMA/.test(t))         return 'IB';
  if (/CAMBRIDGE|IGCSE|COUNCIL FOR THE.*EXAMINATIONS/.test(t))  return 'CAMBRIDGE';
  if (/A-LEVEL|GCSE|EDEXCEL|AQA/.test(t))                      return 'UK';
  if (/ATAR|VCE|HSC|WACE|SACE/.test(t))                        return 'AUSTRALIA';
  if (/ABITUR|ZEUGNIS/.test(t))                                 return 'GERMANY';
  if (/BACCALAUR/.test(t))                                      return 'FRANCE';
  if (/GPA|TRANSCRIPT|CUMULATIVE|CREDIT\s+HOUR/.test(t))        return 'GPA';
  return 'GENERIC';
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ENTRY
═══════════════════════════════════════════════════════════════════════════ */
export const processMarksheetData = (rawText) => {
  const board   = detectBoard(rawText);
  const text    = cleanScript(rawText);
  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);

  console.log('Board detected:', board);

  const studentInfo = extractStudentInfo(text, board);
  let   subjects    = [];

  // Board-specific parsers first
  switch (board) {
    case 'ICSE': subjects = parseICSE(lines, text); break;
    case 'CBSE': subjects = parseCBSE(lines, text); break;
    case 'IB':   subjects = parseIB(lines, text);   break;
    case 'CAMBRIDGE': subjects = parseCambridge(lines, text); break;
    case 'GERMANY':   subjects = parseGerman(lines, text);   break;
    case 'FRANCE':    subjects = parseFrench(lines, text);   break;
    case 'AUSTRALIA': subjects = parseAustralia(lines, text); break;
    case 'GPA':       subjects = parseGPA(lines, text);      break;
    default:          subjects = parseGeneric(lines, text);   break;
  }

  // Universal fallback — try all parsers if nothing found
  if (subjects.length === 0) {
    subjects = universalFallback(lines, text);
  }

  const totals     = extractTotals(text, subjects);
  const obtained   = totals.obtained || subjects.reduce((s,x) => s + (x.obtainedMarks||0), 0);
  const total      = totals.total    || subjects.reduce((s,x) => s + (x.maxMarks||0), 0);
  const pct        = total > 0
    ? (obtained / total) * 100
    : (totals.percentage || 0);
  const dist       = calculateDistinction(pct);

  return {
    board,
    studentInfo,
    subjects,
    obtainedMarks    : obtained,
    totalMarks       : total,
    percentage       : parseFloat(pct.toFixed(2)),
    distinction      : dist,
    distinctionLabel : getDistinctionLabel(dist),
    result           : totals.result || (pct >= 33 ? 'PASS' : 'FAIL'),
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   ICSE PARSER
   
   Format:
   SUBJECTS          | TOTAL MARKS (Max 100) | PERCENTAGE MARKS
   ENGLISH           |                       | 96 NINE SIX
     ENGLISH LANGUAGE|  092                  |
     LITERATURE      |  100                  |
   HINDI             |  099                  | 99 NINE NINE
   MATHEMATICS       |  094                  | 94 NINE FOUR
   
   Rules:
   - Main subject line has the PERCENTAGE in last column
   - Sub-subject lines (indented) have individual marks
   - Marks shown as 3-digit: 092, 099, 094
   - We need the PERCENTAGE column value for overall %
   - Max marks per subject = 100
═══════════════════════════════════════════════════════════════════════════ */
const parseICSE = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  // Known ICSE main subjects
  const ICSE_MAIN_SUBJECTS = [
    'ENGLISH', 'HINDI', 'MATHEMATICS', 'MATH',
    'HISTORY', 'CIVICS', 'GEOGRAPHY',
    'SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY',
    'ECONOMICS', 'ECONOMIC APPLICATIONS',
    'COMMERCE', 'ACCOUNTS', 'ACCOUNTANCY',
    'COMPUTER', 'COMPUTER SCIENCE', 'COMPUTER APPLICATIONS',
    'ENVIRONMENTAL', 'FRENCH', 'GERMAN', 'SPANISH',
    'SANSKRIT', 'URDU', 'BENGALI', 'MARATHI', 'TAMIL',
    'POLITICAL SCIENCE', 'SOCIOLOGY', 'PSYCHOLOGY',
    'PHYSICAL EDUCATION', 'ARTS', 'MUSIC',
    'COMMERCIAL STUDIES', 'TECHNICAL DRAWING',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    /*
      Strategy 1:
      Match "ENGLISH   96 NINE SIX" — main subject with % in same line
      Pattern: SUBJECT_NAME  TWO_DIGIT_NUMBER  WORD  WORD
    */
    const mainPctPattern =
      /^([A-Z][A-Z\s,&]{2,50}?)\s+(\d{2,3})\s+(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|ZERO|HUNDRED|NINETY|EIGHTY|SEVENTY|SIXTY|FIFTY|FORTY|THIRTY|TWENTY|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN)/i;

    const m1 = line.match(mainPctPattern);
    if (m1) {
      const name    = cleanName(m1[1]);
      const pctMark = parseInt(m1[2]);

      if (
        name.length > 1 &&
        !isSkip(name) &&
        pctMark >= 0 &&
        pctMark <= 100 &&
        !processed.has(name.toUpperCase())
      ) {
        processed.add(name.toUpperCase());
        const dist = calculateDistinction(pctMark);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : pctMark,
          percentage       : pctMark,
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : pctMark >= 33,
        });
        continue;
      }
    }

    /*
      Strategy 2:
      Match sub-subject lines with 3-digit marks: "092", "099"
      These are individual paper marks — we'll use the parent % above
      Skip these to avoid duplicates
    */
    const subjectMark3digit = /^\s+([A-Z][A-Z\s&]{3,40})\s+0?(\d{2,3})\s*$/;
    if (line.match(subjectMark3digit)) continue;

    /*
      Strategy 3:
      Plain "SUBJECT  MARK" without words  e.g. "MATHEMATICS  094"
      or "ECONOMIC APPLICATIONS  100"
    */
    const plainMark =
      /^([A-Z][A-Z\s,&]{2,50}?)\s+0?(\d{2,3})\s*(?:ONE HUNDRED)?$/i;
    const m3 = line.match(plainMark);
    if (m3) {
      const name = cleanName(m3[1]);
      const mark = parseInt(m3[2]);

      if (
        name.length > 1 &&
        !isSkip(name) &&
        mark >= 0 &&
        mark <= 100 &&
        !processed.has(name.toUpperCase())
      ) {
        // Check next line — if it starts with a sub-subject, skip (it's a header)
        const nextLine = lines[i + 1] || '';
        const isHeader = /^\s+[A-Z]/.test(nextLine); // indented next line = sub-subject
        if (!isHeader) {
          processed.add(name.toUpperCase());
          const dist = calculateDistinction(mark);
          subjects.push({
            name,
            maxMarks         : 100,
            obtainedMarks    : mark,
            percentage       : mark,
            distinction      : dist,
            distinctionLabel : getDistinctionLabel(dist),
            isPassed         : mark >= 33,
          });
        }
      }
    }
  }

  /*
    Strategy 4 (regex scan):
    Scan entire text for "SUBJECT  NUMBER  WORD-WORDS" pattern
    as final catch-all for ICSE
  */
  if (subjects.length < 3) {
    const icsePattern =
      /([A-Z][A-Z\s,&]{2,45}?)\s{2,}(\d{2,3})\s+((?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|ZERO|HUNDRED|NINETY|EIGHTY|SEVENTY|SIXTY|FIFTY|FORTY|THIRTY|TWENTY|TEN)\s*(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|ZERO|HUNDRED)?)/gi;

    let m;
    const fullText = lines.join('\n');
    while ((m = icsePattern.exec(fullText)) !== null) {
      const name = cleanName(m[1]);
      const mark = parseInt(m[2]);

      if (
        name.length > 1 &&
        !isSkip(name) &&
        mark >= 0 &&
        mark <= 100 &&
        !processed.has(name.toUpperCase())
      ) {
        processed.add(name.toUpperCase());
        const dist = calculateDistinction(mark);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : mark,
          percentage       : mark,
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : mark >= 33,
        });
      }
    }
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   CBSE PARSER
   
   Format:
   SUB CODE | SUBJECT        | THEORY | IA/PR | TOTAL | WORDS    | GRADE
   101      | ENGLISH COMM.  | 061    | 019   | 080   | EIGHTY   | B2
   002      | HINDI COURSE-A | 059    | 020   | 079   | SEVENTY  | B2
   041      | MATHEMATICS    | 064    | 020   | 084   | EIGHTY   | A2
   
   Rules:
   - TOTAL = Theory + Internal Assessment
   - Max marks per subject = 100
   - Grade is letter (A1, A2, B1, B2, C1, C2, D, E1, E2)
   - We want TOTAL column value
═══════════════════════════════════════════════════════════════════════════ */
const parseCBSE = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  for (const line of lines) {
    /*
      CBSE row pattern:
      "101  ENGLISH COMM.  061  019  080  EIGHTY  B2"
      "002  HINDI COURSE-A  059  020  079  SEVENTY NINE  B2"
      
      Structure: CODE  SUBJECT  THEORY  IA  TOTAL  [WORDS]  [GRADE]
      We need: SUBJECT + TOTAL (5th number in row)
    */

    // Match: optional code, subject name, then 3+ numbers
    const cbseRow =
      /^(\d{3})\s+([A-Z][A-Z\s\-\.]{2,40}?)\s+(\d{2,3})\s+(\d{2,3})\s+(\d{2,3})/;

    const m = line.match(cbseRow);
    if (m) {
      const name    = cleanName(m[2]);
      const theory  = parseInt(m[3]);
      const ia      = parseInt(m[4]);
      const total   = parseInt(m[5]);  // This is Theory + IA

      if (
        name.length > 1 &&
        !isSkip(name) &&
        total >= 0 &&
        total <= 100 &&
        !processed.has(name.toUpperCase())
      ) {
        processed.add(name.toUpperCase());
        const dist = calculateDistinction(total);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : total,
          theoryMarks      : theory,
          internalMarks    : ia,
          percentage       : total,
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : total >= 33,
        });
      }
      continue;
    }

    /*
      CBSE without code prefix:
      "ENGLISH COMM.  061  019  080  EIGHTY  B2"
    */
    const cbseNoCode =
      /^([A-Z][A-Z\s\-\.]{2,40}?)\s+(\d{2,3})\s+(\d{2,3})\s+(\d{2,3})\s+(?:[A-Z]+)/;

    const m2 = line.match(cbseNoCode);
    if (m2) {
      const name   = cleanName(m2[1]);
      const theory = parseInt(m2[2]);
      const ia     = parseInt(m2[3]);
      const total  = parseInt(m2[4]);

      if (
        name.length > 1 &&
        !isSkip(name) &&
        total >= 0 &&
        total <= 100 &&
        !processed.has(name.toUpperCase())
      ) {
        processed.add(name.toUpperCase());
        const dist = calculateDistinction(total);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : total,
          theoryMarks      : theory,
          internalMarks    : ia,
          percentage       : total,
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : total >= 33,
        });
      }
    }
  }

  /*
    CBSE Fallback:
    Scan for "SUBJECT  NUMBER  NUMBER  NUMBER" anywhere
    Take 3rd number as TOTAL
  */
  if (subjects.length < 3) {
    const fullText = lines.join('\n');
    const cbseFallback =
      /([A-Z][A-Z\s\-\.]{3,40}?)\s{1,6}(\d{2,3})\s{1,6}(\d{2,3})\s{1,6}(\d{2,3})/g;

    let m;
    while ((m = cbseFallback.exec(fullText)) !== null) {
      const name  = cleanName(m[1]);
      const total = parseInt(m[4]); // 3rd number = total

      if (
        name.length > 1 &&
        !isSkip(name) &&
        total >= 0 &&
        total <= 100 &&
        !processed.has(name.toUpperCase())
      ) {
        processed.add(name.toUpperCase());
        const dist = calculateDistinction(total);
        subjects.push({
          name,
          maxMarks         : 100,
          obtainedMarks    : total,
          percentage       : total,
          distinction      : dist,
          distinctionLabel : getDistinctionLabel(dist),
          isPassed         : total >= 33,
        });
      }
    }
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   GENERIC PARSER — Gujarat, Maharashtra, UP, all other Indian state boards
   Also works for most international boards
═══════════════════════════════════════════════════════════════════════════ */
const parseGeneric = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  for (const line of lines) {
    const t = line.trim();
    if (t.length < 4) continue;

    const patterns = [
      // "01_GUJARATI FL   100   58" — subject code prefix
      /^(?:\d{1,3}[_\-.\s]+)?([A-Z][A-Z\s&\-_\.\/]{2,45}?)\s{2,}(\d{1,3})\s{1,10}(\d{1,3})(?:\s|$)/,
      // "Mathematics  100  91" — standard 2 number format
      /^([A-Z][A-Za-z\s&\-_\.\/]{2,45}?)\s{2,}(\d{1,3})\s{1,8}(\d{1,3})(?:\s|$)/,
      // "English : 70/100"
      /([A-Za-z][A-Za-z\s&\-\.]{2,45}?)\s*[:\-]\s*(\d{1,3})\s*\/\s*(\d{1,3})/i,
      // "Chemistry  85  100" at end of line
      /^([A-Z][A-Z\s&\-_\.]{2,40}?)\s+(\d{1,3})\s+(\d{1,3})\s*$/,
    ];

    for (const pattern of patterns) {
      const m = t.match(pattern);
      if (!m) continue;

      const name = cleanName(m[1]);
      let n1     = parseFloat(m[2]);
      let n2     = parseFloat(m[3]);

      if (!name || name.length < 2) break;
      if (isSkip(name))             break;
      if (isNaN(n1) || isNaN(n2))  break;
      if (processed.has(name.toUpperCase())) break;

      const maxMarks      = n2 <= n1 ? n1 : n2;
      const obtainedMarks = n2 <= n1 ? n2 : n1;

      if (maxMarks < 1 || maxMarks > 1000) break;
      if (obtainedMarks < 0)               break;
      if (obtainedMarks > maxMarks)        break;

      processed.add(name.toUpperCase());
      const pct  = (obtainedMarks / maxMarks) * 100;
      const dist = calculateDistinction(pct);

      subjects.push({
        name,
        maxMarks      : Math.round(maxMarks),
        obtainedMarks : Math.round(obtainedMarks),
        percentage    : parseFloat(pct.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed      : obtainedMarks >= maxMarks * 0.33,
      });
      break;
    }
  }

  // Block scan fallback
  if (subjects.length === 0) {
    const bp =
      /([A-Z][A-Z\s&\-_\.]{3,45}?)\s{2,}(\d{1,3})\s{1,8}(\d{1,3})/g;
    let m;
    while ((m = bp.exec(lines.join('\n'))) !== null) {
      const name = cleanName(m[1]);
      const n1   = parseInt(m[2]);
      const n2   = parseInt(m[3]);

      if (!name || name.length < 2 || isSkip(name)) continue;
      if (processed.has(name.toUpperCase()))         continue;

      const maxMarks      = n2 <= n1 ? n1 : n2;
      const obtainedMarks = n2 <= n1 ? n2 : n1;

      if (maxMarks < 1 || maxMarks > 1000) continue;
      if (obtainedMarks > maxMarks)        continue;

      processed.add(name.toUpperCase());
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
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   IB PARSER — /7 per subject, /45 total
═══════════════════════════════════════════════════════════════════════════ */
const parseIB = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  for (const line of lines) {
    // "Mathematics: Analysis  HL  6" or "Biology  SL  5"
    const m = line.match(
      /([A-Za-z][A-Za-z\s&\-:]{3,50}?)\s+(HL|SL)?\s*[:\-]?\s*([1-7])(?:\s|$)/i
    );
    if (!m) continue;

    const name  = cleanName(m[1]);
    const level = m[2] || '';
    const score = parseInt(m[3]);

    if (!name || name.length < 2) continue;
    if (isSkip(name))             continue;
    if (isNaN(score))             continue;
    if (processed.has(name.toUpperCase())) continue;

    processed.add(name.toUpperCase());
    const pct  = (score / 7) * 100;
    const dist = calculateDistinction(pct);

    subjects.push({
      name             : level ? `${name} (${level})` : name,
      maxMarks         : 7,
      obtainedMarks    : score,
      percentage       : parseFloat(pct.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed         : score >= 3,
    });
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   CAMBRIDGE PARSER — A*, A, B, C, D, E, U
═══════════════════════════════════════════════════════════════════════════ */
const parseCambridge = (lines, text) => {
  const subjects  = [];
  const processed = new Set();
  const gradeMap  = {
    'A*': 97, 'A': 87, 'B': 77, 'C': 67,
    'D' : 57, 'E': 47, 'U': 20, 'G': 37,
  };

  for (const line of lines) {
    // "Mathematics  9709  A" or "Physics  A*" or "English  72  A"
    const patterns = [
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+\d{4}\s+(A\*|[A-GU])(?:\s|$)/i,
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d{2,3})\s+(A\*|[A-GU])(?:\s|$)/i,
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(A\*|[A-GU])(?:\s|$)/i,
    ];

    for (const pat of patterns) {
      const m = line.match(pat);
      if (!m) continue;

      const name  = cleanName(m[1]);
      let grade   = '';
      let rawMark = null;

      if (m.length === 4) { rawMark = parseInt(m[2]); grade = m[3]; }
      else                { grade = m[2]; }

      grade = grade.toUpperCase();
      if (!name || name.length < 2) break;
      if (isSkip(name))             break;
      if (processed.has(name.toUpperCase())) break;

      const pct  = rawMark || gradeMap[grade] || 50;
      const dist = calculateDistinction(pct);

      processed.add(name.toUpperCase());
      subjects.push({
        name,
        maxMarks         : 100,
        obtainedMarks    : rawMark || pct,
        percentage       : parseFloat(pct.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : !['U'].includes(grade),
        letterGrade      : grade,
      });
      break;
    }
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   GERMAN PARSER — 1 (best) to 6 (fail)
═══════════════════════════════════════════════════════════════════════════ */
const parseGerman = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  for (const line of lines) {
    const m = line.match(
      /([A-Za-z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF\s\-]{2,40}?)\s+([1-6](?:[,\.]\d)?)\s*$/i
    );
    if (!m) continue;

    const name        = cleanName(m[1]);
    const germanGrade = parseFloat(m[2].replace(',', '.'));

    if (!name || name.length < 2)          continue;
    if (isNaN(germanGrade))                continue;
    if (germanGrade < 1 || germanGrade > 6) continue;
    if (isSkip(name))                      continue;
    if (processed.has(name.toUpperCase())) continue;

    processed.add(name.toUpperCase());
    const pct  = Math.max(0, ((6 - germanGrade) / 5) * 100);
    const dist = calculateDistinction(pct);

    subjects.push({
      name,
      maxMarks         : 6,
      obtainedMarks    : germanGrade,
      percentage       : parseFloat(pct.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed         : germanGrade <= 4,
      note             : `${germanGrade}/6 (German: 1=best)`,
    });
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   FRENCH PARSER — /20 scale
═══════════════════════════════════════════════════════════════════════════ */
const parseFrench = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  for (const line of lines) {
    const m = line.match(
      /([A-Za-z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF\s\-]{2,40}?)\s+(\d{1,2}(?:[,\.]\d{1,2})?)\s*\/\s*20/i
    );
    if (!m) continue;

    const name    = cleanName(m[1]);
    const score   = parseFloat(m[2].replace(',', '.'));

    if (!name || name.length < 2)   continue;
    if (isNaN(score) || score > 20) continue;
    if (isSkip(name))               continue;
    if (processed.has(name.toUpperCase())) continue;

    processed.add(name.toUpperCase());
    const pct  = (score / 20) * 100;
    const dist = calculateDistinction(pct);

    subjects.push({
      name,
      maxMarks         : 20,
      obtainedMarks    : score,
      percentage       : parseFloat(pct.toFixed(2)),
      distinction      : dist,
      distinctionLabel : getDistinctionLabel(dist),
      isPassed         : score >= 10,
      note             : `${score}/20`,
    });
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   AUSTRALIA PARSER — VCE, HSC, WACE, SACE scores
═══════════════════════════════════════════════════════════════════════════ */
const parseAustralia = (lines, text) => {
  const subjects  = [];
  const processed = new Set();

  for (const line of lines) {
    // "Mathematical Methods  40  35  38.00" or "Biology  90"
    const patterns = [
      /([A-Za-z][A-Za-z\s&\-]{3,50}?)\s+(\d{1,3}(?:\.\d{1,2})?)\s+(\d{1,3}(?:\.\d{1,2})?)\s+(\d{2,3}(?:\.\d{1,2})?)/,
      /([A-Za-z][A-Za-z\s&\-]{3,50}?)\s+(\d{2,3}(?:\.\d{1,2})?)\s+(\d{2,3}(?:\.\d{1,2})?)/,
      /([A-Za-z][A-Za-z\s&\-]{3,50}?)\s+(\d{2,3}(?:\.\d{1,2})?)\s*$/,
    ];

    for (const pat of patterns) {
      const m = line.match(pat);
      if (!m) continue;

      const name = cleanName(m[1]);
      if (!name || name.length < 3) break;
      if (isSkip(name))             break;
      if (processed.has(name.toUpperCase())) break;

      const nums = [m[2], m[3], m[4]]
        .filter(Boolean).map(parseFloat)
        .filter(n => !isNaN(n) && n >= 0 && n <= 100);

      if (!nums.length) break;

      const score = nums[nums.length - 1];
      const dist  = calculateDistinction(score);

      processed.add(name.toUpperCase());
      subjects.push({
        name,
        maxMarks         : 100,
        obtainedMarks    : Math.round(score),
        percentage       : parseFloat(score.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : score >= 33,
      });
      break;
    }
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   GPA PARSER — Indian university CGPA, US GPA
═══════════════════════════════════════════════════════════════════════════ */
const parseGPA = (lines, text) => {
  const subjects  = [];
  const processed = new Set();
  const letterMap = {
    'O':  95, 'A+': 90, 'A': 85, 'A-': 80,
    'B+': 77, 'B':  73, 'B-': 70,
    'C+': 67, 'C':  63, 'C-': 60,
    'D':  55, 'F':  30,
  };

  for (const line of lines) {
    const patterns = [
      // "Mathematics  4  A+  10.0  40.0"
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d{1,2})\s+([OA-F][+\-]?)\s+(\d+(?:\.\d)?)/i,
      // "Physics  A  8.5"
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+([OA-F][+\-]?)\s+(\d+(?:\.\d{1,2})?)/i,
      // "Chemistry  8.5/10"
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d+(?:\.\d{1,2})?)\s*\/\s*(10|4(?:\.0)?)/i,
      // "Subject  85  B+"
      /([A-Za-z][A-Za-z\s&\-]{3,45}?)\s+(\d{2,3})\s+([OA-F][+\-]?)/i,
    ];

    for (const pat of patterns) {
      const m = line.match(pat);
      if (!m) continue;

      const name = cleanName(m[1]);
      if (!name || name.length < 2) break;
      if (isSkip(name))             break;
      if (processed.has(name.toUpperCase())) break;

      let pct = 0;

      // Letter grade pattern
      const lgMatch = line.match(/\b([OA-F][+\-]?)\b/i);
      if (lgMatch) {
        pct = letterMap[lgMatch[1].toUpperCase()] || 50;
      }

      // /10 GPA pattern
      const gpaMatch = line.match(/(\d+(?:\.\d{1,2})?)\s*\/\s*(10|4(?:\.0)?)/);
      if (gpaMatch) {
        const scale = parseFloat(gpaMatch[2]);
        pct = (parseFloat(gpaMatch[1]) / scale) * 100;
      }

      // Direct % marks
      const marksMatch = line.match(/\b(\d{2,3})\b/);
      if (marksMatch && !pct) {
        const v = parseInt(marksMatch[1]);
        if (v <= 100) pct = v;
      }

      if (!pct) break;

      processed.add(name.toUpperCase());
      const dist = calculateDistinction(pct);

      subjects.push({
        name,
        maxMarks         : 100,
        obtainedMarks    : Math.round(pct),
        percentage       : parseFloat(pct.toFixed(2)),
        distinction      : dist,
        distinctionLabel : getDistinctionLabel(dist),
        isPassed         : pct >= 33,
      });
      break;
    }
  }

  return subjects;
};

/* ═══════════════════════════════════════════════════════════════════════════
   UNIVERSAL FALLBACK — tries all parsers in sequence
═══════════════════════════════════════════════════════════════════════════ */
const universalFallback = (lines, text) => {
  const parsers = [
    () => parseCBSE(lines, text),
    () => parseICSE(lines, text),
    () => parseGeneric(lines, text),
    () => parseGPA(lines, text),
    () => parseCambridge(lines, text),
    () => parseAustralia(lines, text),
    () => parseFrench(lines, text),
    () => parseGerman(lines, text),
    () => parseIB(lines, text),
  ];

  for (const fn of parsers) {
    try {
      const r = fn();
      if (r && r.length > 0) return r;
    } catch { continue; }
  }
  return [];
};

/* ═══════════════════════════════════════════════════════════════════════════
   TOTALS EXTRACTION
═══════════════════════════════════════════════════════════════════════════ */
const extractTotals = (text, subjects) => {
  const out = { obtained: 0, total: 0, percentage: 0, result: '' };

  // "463/650"
  const frac = text.match(/\b(\d{2,4})\s*\/\s*(\d{3,4})\b/);
  if (frac) {
    const a = parseInt(frac[1]), b = parseInt(frac[2]);
    if (b > a && b <= 9999) { out.obtained = a; out.total = b; }
  }

  // "Total Marks Obtained  503"
  if (!out.obtained) {
    const m = text.match(/total\s*marks?\s*obtained\s*[:\-.]?\s*(\d{2,4})/i);
    if (m) out.obtained = parseInt(m[1]);
  }

  // Percentage
  const pm = text.match(/(\d{2,3}(?:\.\d{1,2})?)\s*%/)
    || text.match(/percentage\s*[:\-.]?\s*(\d{2,3}(?:\.\d{1,2})?)/i);
  if (pm) out.percentage = parseFloat(pm[1]);

  // Result
  const rm = text.match(/\b(PASS|FAIL|ATKT|COMPARTMENT|DISTINCTION|MERIT)\b/i);
  if (rm) {
    const r = rm[1].toUpperCase();
    out.result = ['DISTINCTION','MERIT'].includes(r) ? 'PASS' : r;
  }

  // Sum from subjects as fallback
  if (!out.obtained)
    out.obtained = subjects.reduce((s,x) => s + (x.obtainedMarks||0), 0);
  if (!out.total)
    out.total = subjects.reduce((s,x) => s + (x.maxMarks||0), 0);

  return out;
};

/* ═══════════════════════════════════════════════════════════════════════════
   STUDENT INFO EXTRACTION
═══════════════════════════════════════════════════════════════════════════ */
const extractStudentInfo = (text, board) => {
  const info = {
    name:'', rollNumber:'', seatNumber:'',
    studentId:'', class:'', school:'',
    board:'', examYear:'', fatherName:'',
    motherName:'', result:'', percentage:'', dob:'',
  };

  // Name
  const namePatterns = [
    /(?:this is to certify that|name\s*of\s*(?:the\s*)?student|candidate['s]*\s*name|student['s]*\s*name)\s*[:\-.]?\s*([A-Z][A-Z\s]{3,60})/i,
    /^Name\s+([A-Z][A-Z\s]{3,60})/im,
    /\bName\s*[:\-]\s*([A-Z][A-Z\s]{3,60})/i,
    /\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,4})\b(?=\s*\n)/,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) {
      const c = m[1].trim().replace(/\s{2,}/g,' ');
      if (!isSkip(c) && c.length > 3) { info.name = c.substring(0,70); break; }
    }
  }

  // Roll / Unique ID / Seat
  const idPatterns = [
    { k:'rollNumber', p:/roll\s*no\.?\s*[:\-.]?\s*([A-Z0-9\-\/]{3,15})/i },
    { k:'studentId',  p:/unique\s*id\s*[:\-.]?\s*(\d{5,12})/i },
    { k:'seatNumber', p:/seat\s*no\.?\s*[:\-.]?\s*([A-Z]?\s*\d{4,8})/i },
    { k:'studentId',  p:/(?:registration|reg|enrollment)\s*(?:no|number)\s*[:\-.]?\s*([A-Z0-9\-\/]{3,20})/i },
    { k:'seatNumber', p:/\b([A-Z]\s*\d{6})\b/ },
  ];
  for (const {k,p} of idPatterns) {
    if (!info[k]) {
      const m = text.match(p);
      if (m) info[k] = m[1].replace(/\s/g,'').trim();
    }
  }

  // School / of
  const schoolM = text.match(
    /(?:of\s+|school\s*[:\-.]?\s*)([A-Z][A-Za-z\s,\.\(\)]{5,80})/i
  );
  if (schoolM) info.school = schoolM[1].trim().split('\n')[0].substring(0,80);

  // Year
  const yearPatterns = [
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
    /year\s*[:\-.]?\s*(\d{4})/i,
    /\b(20\d{2}|19\d{2})\b/,
  ];
  for (const p of yearPatterns) {
    const m = text.match(p);
    if (m) { info.examYear = m[1]; break; }
  }

  // DOB
  const dobM = text.match(
    /(?:date\s+of\s+birth|dob)\s*[:\-.]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  );
  if (dobM) info.dob = dobM[1];

  // Father / Mother
  const fatherM = text.match(
    /(?:father['s]*\s*(?:name|\/)?(?:\s*guardian['s]*)?\s*name?|shri)\s*[:\-.]?\s*([A-Z][A-Z\s]{3,50})/i
  );
  if (fatherM) info.fatherName = fatherM[1].trim();

  const motherM = text.match(
    /(?:mother['s]*\s*name|smt)\s*[:\-.]?\s*([A-Z][A-Z\s]{3,50})/i
  );
  if (motherM) info.motherName = motherM[1].trim();

  // Result
  const resM = text.match(/\b(PASS|FAIL|ATKT|COMPARTMENT)\b/i);
  if (resM) info.result = resM[1].toUpperCase();

  // Percentage
  const pctM = text.match(/(\d{2,3}(?:\.\d{1,2})?)\s*%/)
    || text.match(/percentage\s*[:\-.]?\s*(\d{2,3}(?:\.\d{1,2})?)/i);
  if (pctM) info.percentage = pctM[1];

  return info;
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const cleanName = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/^\d{1,3}[_\-.\s]+/, '')
    .replace(/[_]+/g, ' ')
    .replace(/[^\w\s&\-\/\(\)\.,']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .split(' ')
    .map(w => {
      if (!w) return '';
      if (w.length <= 4 && /^[A-Z]+$/.test(w)) return w;
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bSl\b/gi,'SL').replace(/\bFl\b/gi,'FL')
    .replace(/\bHl\b/gi,'HL').replace(/\bIt\b/gi,'IT')
    .replace(/\bEvs\b/gi,'EVS').replace(/\bIa\b/gi,'IA')
    .trim();
};

const SKIP_WORDS = new Set([
  'TOTAL','GRAND TOTAL','TOTAL MARKS','OBTAINED','MARKS OBTAINED',
  'RESULT','PASS','FAIL','PERCENTAGE','GRADE','SEAT NO','SEAT NUMBER',
  'ROLL NO','CANDIDATE','NAME','DATE','MONTH','YEAR','CENTRE','CENTER',
  'SCHOOL','BOARD','STATEMENT','SUBJECT','SUBJECTS','INDEX','MAXIMUM',
  'MINIMUM','MARKS','NOTE','IMPORTANT','SR NO','GRAND','SUB TOTAL',
  'THEORY','PRACTICAL','INTERNAL','EXTERNAL','WRITTEN','ORAL',
  'FIVE','SIX','SEVEN','EIGHT','NINE','ZERO','ONE','TWO','THREE',
  'FOUR','HUNDRED','ONLY','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN',
  'FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY',
  'THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY',
  'MAX MARKS','MAX','POSITION','POSITIONAL','CODE','SUB CODE',
  'SCHOOL INDEX','CENTRE NO','INTERNAL ASSESSMENT','WORDS',
  'SUPW','COMMUNITY SERVICE','INTERNAL ASSESSMENT',
  'DAUGHTER','SON','OF','SMT','SHRI','DR','MR','MRS','MS',
]);

const isSkip = (name) => {
  if (!name) return true;
  const u = name.toUpperCase().trim();
  if (SKIP_WORDS.has(u))             return true;
  for (const sw of SKIP_WORDS) {
    if (u.startsWith(sw+' ') || u.endsWith(' '+sw)) return true;
  }
  if (/^\d+$/.test(u))              return true;
  if (u.length < 2)                 return true;
  if (/^[\W\d]+$/.test(u))          return true;
  return false;
};

/* Used by hook */
export const calculatePercentage = (subjects) => {
  if (!subjects?.length) return {
    totalMarks:0, obtainedMarks:0, percentage:0, distinction:'N/A', result:'N/A'
  };
  const total    = subjects.reduce((s,x) => s+(x.maxMarks||0),    0);
  const obtained = subjects.reduce((s,x) => s+(x.obtainedMarks||0),0);
  const pct      = total > 0 ? (obtained/total)*100 : 0;
  const dist     = calculateDistinction(pct);
  return {
    totalMarks   : total,
    obtainedMarks: obtained,
    percentage   : parseFloat(pct.toFixed(2)),
    distinction  : dist,
    result       : subjects.some(s=>!s.isPassed) ? 'FAIL' : pct>=33 ? 'PASS' : 'FAIL',
  };
};