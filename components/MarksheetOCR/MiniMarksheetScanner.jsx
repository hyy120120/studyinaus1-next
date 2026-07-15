'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

/* ── Distinction helpers ───────────────────────────────────────────────── */
const getDistinction = (pct) => {
  if (pct >= 90) return { code:'HD', label:'High Distinction', tw:'text-purple-700 bg-purple-50 border-purple-200' };
  if (pct >= 75) return { code:'D',  label:'Distinction',      tw:'text-blue-700   bg-blue-50   border-blue-200'   };
  if (pct >= 65) return { code:'M',  label:'Merit',            tw:'text-green-700  bg-green-50  border-green-200'  };
  if (pct >= 33) return { code:'P',  label:'Pass',             tw:'text-yellow-700 bg-yellow-50 border-yellow-200' };
  return               { code:'F',  label:'Fail',             tw:'text-red-700    bg-red-50    border-red-200'    };
};

/* ── Image quality checker (client-side pre-check) ─────────────────────── */
const checkImageQuality = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ ok: true, warning: null });
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      console.log(`Client image size: ${w}x${h}`);

      if (w < 600 || h < 800) {
        resolve({
          ok     : false,
          warning: `Image resolution too low (${w}×${h}px). Please use a higher quality scan or photo.`,
        });
      } else if (w < 1000 || h < 1200) {
        resolve({
          ok     : true,
          warning: `Image resolution is low (${w}×${h}px). Results may be inaccurate. A higher quality image is recommended.`,
        });
      } else {
        resolve({ ok: true, warning: null });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: true, warning: null });
    };
    img.src = url;
  });
};

/* ════════════════════════════════════════════════════════════════════════
   MINI MARKSHEET SCANNER
════════════════════════════════════════════════════════════════════════ */
const MiniMarksheetScanner = ({ levelKey, levelLabel, onDataExtracted }) => {
  const [state, setState] = useState({
    isOpen       : false,
    isLoading    : false,
    isComplete   : false,
    error        : null,
    warnings     : [],
    confidence   : 0,
    fileUrl      : null,
    scannedData  : null,
    preview      : null,
    board        : null,
    loadingStep  : '',
  });

  const toggle = () =>
    setState(p => ({ ...p, isOpen: !p.isOpen, error: null }));

  const handleFile = useCallback(async (file) => {
    /* ── Client-side quality check ──────────────────────────────────── */
    const quality = await checkImageQuality(file);

    if (!quality.ok) {
      setState(p => ({
        ...p,
        error: quality.warning,
      }));
      return;
    }

    /* ── Preview ─────────────────────────────────────────────────────── */
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setState(p => ({ ...p, preview: e.target.result }));
      reader.readAsDataURL(file);
    }

    setState(p => ({
      ...p,
      isLoading   : true,
      error       : null,
      isComplete  : false,
      warnings    : quality.warning ? [quality.warning] : [],
      loadingStep : 'Uploading document…',
    }));

    try {
      /* ── Show progressive loading steps ────────────────────────────── */
      const steps = [
        { msg: 'Preprocessing image…',   delay: 500  },
        { msg: 'Running OCR engine…',    delay: 3000 },
        { msg: 'Extracting marks…',      delay: 8000 },
        { msg: 'Calculating results…',   delay: 12000 },
      ];

      const stepTimers = steps.map(({ msg, delay }) =>
        setTimeout(() =>
          setState(p => p.isLoading ? { ...p, loadingStep: msg } : p),
          delay
        )
      );

      /* ── API call ────────────────────────────────────────────────────── */
      const fd = new FormData();
      fd.append('document', file);
      fd.append('levelKey', levelKey);

      const res = await fetch('/api/ocr', { method: 'POST', body: fd });

      // Clear step timers
      stepTimers.forEach(clearTimeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'OCR failed');
      }

      /* ── Build extracted data ────────────────────────────────────────── */
      const data = result.data;

      const extracted = {
        marks_obtained : data.obtainedMarks  || '',
        marks_total    : data.totalMarks     || '',
        percentage     : data.percentage     || 0,
        distinction    : data.distinction    || '',
        board          : data.board          || '',
        studentName    : data.studentInfo?.name        || '',
        rollNumber     : data.studentInfo?.rollNumber  || '',
        passout_year   : data.studentInfo?.examYear    || '',
        school         : data.studentInfo?.school      || '',
        subjects       : data.subjects       || [],
        fileUrl        : result.fileUrl,
      };

      /* ── Collect warnings ────────────────────────────────────────────── */
      const warnings = [...(result.warnings || [])];
      if (result.confidence < 60) {
        warnings.push(
          `OCR confidence: ${result.confidence.toFixed(0)}% — ` +
          'results may be inaccurate. Consider uploading a clearer image.'
        );
      }
      if (data.subjects.length === 0) {
        warnings.push(
          'Could not detect individual subjects. ' +
          'Marks have been estimated from totals.'
        );
      }

      /* ── Fire parent callback ────────────────────────────────────────── */
      if (onDataExtracted) onDataExtracted(extracted);

      setState(p => ({
        ...p,
        isLoading   : false,
        isComplete  : true,
        confidence  : result.confidence,
        fileUrl     : result.fileUrl,
        scannedData : extracted,
        board       : data.board,
        warnings,
        loadingStep : '',
      }));

    } catch (err) {
      setState(p => ({
        ...p,
        isLoading   : false,
        error       : err.message,
        loadingStep : '',
      }));
    }
  }, [levelKey, onDataExtracted]);

  /* ── Dropzone ─────────────────────────────────────────────────────────── */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop   : files => files[0] && handleFile(files[0]),
    accept   : {
      'image/*'        : ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
    },
    maxFiles : 1,
    maxSize  : 15 * 1024 * 1024,
    disabled : state.isLoading,
  });

  const reset = () => setState({
    isOpen:true, isLoading:false, isComplete:false,
    error:null, warnings:[], confidence:0, fileUrl:null,
    scannedData:null, preview:null, board:null, loadingStep:'',
  });

  const dist = state.scannedData
    ? getDistinction(state.scannedData.percentage)
    : null;

  /* ── Confidence color ────────────────────────────────────────────────── */
  const confColor = state.confidence >= 80
    ? 'text-green-600' : state.confidence >= 60
    ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="col-span-full">

      {/* ── Trigger button ──────────────────────────────────────────────── */}
      {!state.isOpen && !state.isComplete && (
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
            border-2 border-dashed border-blue-300 rounded-xl text-sm
            text-blue-600 font-medium hover:border-blue-500 hover:bg-blue-50
            transition-all duration-200 group"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1
                 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          📷 Scan {levelLabel} Marksheet — Auto-fill marks
        </button>
      )}

      {/* ── Success banner ──────────────────────────────────────────────── */}
      {state.isComplete && !state.isOpen && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 p-3
            bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center gap-2.5">
              {state.preview && (
                <img src={state.preview} alt="scanned"
                  className="w-10 h-10 object-cover rounded-lg
                    border border-green-200 flex-shrink-0"
                />
              )}
              <div>
                <p className="text-xs font-semibold text-green-700">
                  ✅ Marksheet Scanned
                  {state.board && (
                    <span className="ml-1 font-normal text-green-600">
                      ({state.board})
                    </span>
                  )}
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  <span className={`font-medium ${confColor}`}>
                    {state.confidence.toFixed(0)}% confidence
                  </span>
                  {' · '}
                  {state.scannedData?.marks_obtained}/
                  {state.scannedData?.marks_total} marks
                  {state.scannedData?.subjects?.length > 0 && (
                    <> · {state.scannedData.subjects.length} subjects</>
                  )}
                </p>
                {state.fileUrl && (
                  <a href={state.fileUrl} target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline"
                  >
                    View saved file ↗
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dist && (
                <span className={`text-xs font-bold px-2 py-1
                  rounded-lg border ${dist.tw}`}
                >
                  {dist.code} · {state.scannedData?.percentage}%
                </span>
              )}
              <button type="button" onClick={reset}
                className="text-xs text-gray-500 hover:text-gray-700
                  underline whitespace-nowrap"
              >
                Rescan
              </button>
            </div>
          </div>

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="space-y-1">
              {state.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2
                  bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
                  <p className="text-xs text-amber-700">{w}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Scanner panel ───────────────────────────────────────────────── */}
      {state.isOpen && (
        <div className="border border-blue-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5
            bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <p className="text-white text-sm font-semibold">
              📄 Scan {levelLabel} Marksheet
            </p>
            <button type="button" onClick={toggle}
              className="text-white/70 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3 bg-blue-50/20">

            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center
                cursor-pointer transition-all duration-200 select-none bg-white
                ${isDragActive
                  ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                  : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                }
                ${state.isLoading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />

              {state.isLoading ? (
                /* Loading state */
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <svg className="animate-spin w-10 h-10 text-blue-500"
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      {state.loadingStep || 'Processing…'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This may take 10–20 seconds
                    </p>
                  </div>
                  {/* Progress steps */}
                  <div className="flex gap-4 text-xs text-gray-400">
                    {['Upload','Preprocess','OCR','Parse'].map((s,i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          state.loadingStep.toLowerCase().includes(
                            ['upload','preprocess','ocr','extract'][i]
                          ) ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                        }`} />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : isDragActive ? (
                <p className="text-blue-600 font-semibold">Drop to scan!</p>
              ) : (
                /* Upload prompt */
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100
                    flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-blue-500" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16
                           6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Drag &amp; drop marksheet here
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      or{' '}
                      <span className="text-blue-500 underline">
                        click to browse
                      </span>
                      {' '}· JPG, PNG, PDF · max 15 MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {state.preview && !state.isLoading && (
              <div className="rounded-lg overflow-hidden border
                border-gray-200 max-h-48 bg-gray-50"
              >
                <img src={state.preview} alt="preview"
                  className="w-full h-full object-contain" />
              </div>
            )}

            {/* Error */}
            {state.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50
                border border-red-200 rounded-lg"
              >
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707
                       7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293
                       1.293a1 1 0 101.414 1.414L10 11.414l1.293
                       1.293a1 1 0 001.414-1.414L11.414 10l1.293
                       -1.293a1 1 0 00-1.414-1.414L10 8.586
                       8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-red-700">
                    Scan Failed
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {state.error}
                  </p>
                </div>
              </div>
            )}

            {/* Quality tips */}
            {!state.isLoading && (
              <div className="bg-amber-50 border border-amber-100
                rounded-lg p-3"
              >
                <p className="text-xs font-semibold text-amber-800 mb-1.5">
                  📋 Tips for best accuracy:
                </p>
                <ul className="text-xs text-amber-700 space-y-1
                  list-disc list-inside"
                >
                  <li>
                    <strong>Use original PDF</strong> if available
                    (best accuracy)
                  </li>
                  <li>
                    <strong>Photo</strong> — good lighting, flat surface,
                    no shadows
                  </li>
                  <li>
                    <strong>Keep straight</strong> — avoid tilt or rotation
                  </li>
                  <li>
                    <strong>Full page</strong> — include all subjects
                    in the frame
                  </li>
                  <li>
                    Minimum recommended: <strong>1000×1200 px</strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniMarksheetScanner;