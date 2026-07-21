const CURRENT_YEAR = new Date().getFullYear();

// Ages and durations represent the normal Indian education pathway. They are
// used ONLY to compute the minimum (earliest realistic) year for each level.
// When the previous level's completion year is known, the next level is
// anchored to THAT (12th after 10th passout, graduation after 12th, …);
// DOB-based minimums are only a fallback when no previous year exists — the
// 10th passout, being the first level, is always anchored to DOB.
// There is intentionally no age-based maximum: older applicants (e.g. born
// 1980, finished 10th in 2009) must be able to enter late years. The only
// ceiling everywhere is the current year, because a completed education
// cannot end in the future.
const EDUCATION_SCHEDULE = {
    y10: { minCompletionAge: 15, maxCompletionAge: 18, duration: 10, usesPassoutYear: true },
    y12: { minCompletionAge: 17, maxCompletionAge: 21, duration: 2, usesPassoutYear: true },
    graduate: { minCompletionAge: 19, maxCompletionAge: 28, duration: 3 },
    postgraduate: { minCompletionAge: 20, maxCompletionAge: 32, duration: 2 },
    phd: { minCompletionAge: 23, maxCompletionAge: 38, duration: 3 },
};

// Number("") is 0 — an empty year input must NOT be mistaken for year 0,
// so blank/unset values become null instead of integers here.
const asYear = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
};

export const isSchoolQualification = (key) => ["y10", "y12"].includes(key);

export const educationCompletionYear = (level) =>
    isSchoolQualification(level?.key) ? level?.passout_year : level?.end_year;

const isYearInRange = (year, range) => {
    const numericYear = Number(year);
    return Number.isInteger(numericYear) && numericYear >= range.min && numericYear <= range.max;
};

export function educationTimeline(dob, key, startYear = "", previousEndYear = "") {
    const birthYear = new Date(dob).getFullYear();
    const schedule = EDUCATION_SCHEDULE[key];
    if (!birthYear || !schedule) return {
        start: { min: 1950, max: CURRENT_YEAR }, end: { min: 1950, max: CURRENT_YEAR }, passout: { min: 1950, max: CURRENT_YEAR },
    };

    const priorEnd = asYear(previousEndYear);
    const selectedStart = asYear(startYear);

    if (schedule.usesPassoutYear) {
        // 12th passout is anchored to the 10th passout year (+2 years for the
        // 2-year programme) whenever it is known; with no previous year the
        // 10th-style DOB minimum applies.
        const passout = key === "y12" && priorEnd !== null
            ? { min: priorEnd + 2, max: CURRENT_YEAR }
            : { min: birthYear + schedule.minCompletionAge, max: CURRENT_YEAR };
        return { start: { min: 0, max: -1 }, end: { min: 0, max: -1 }, passout };
    }

    // Higher levels (graduation, post-graduation, PhD) anchor off the
    // previous level's completion year whenever it is known; DOB only when
    // there is nothing to chain from.
    const start = priorEnd !== null
        ? { min: priorEnd, max: CURRENT_YEAR - schedule.duration }
        : { min: birthYear + schedule.minCompletionAge - schedule.duration, max: CURRENT_YEAR - schedule.duration };
    const endMin = selectedStart !== null
        ? selectedStart + schedule.duration
        : priorEnd !== null
            ? priorEnd + schedule.duration
            : birthYear + schedule.minCompletionAge;
    const end = { min: endMin, max: CURRENT_YEAR };
    return { start, end, passout: { min: 0, max: -1 } };
}

// The dropdowns offer only the most realistic years — the earliest realistic
// year (computed from DOB and the previous level) plus the next couple.
// Anything else stays possible through the "Other year" type-in in the UI,
// and validation still checks the full min..max range, so nobody is blocked.
const MAX_YEAR_OPTIONS = 3;

export function educationYears(range, { limit = MAX_YEAR_OPTIONS } = {}) {
    if (!Number.isInteger(range?.min) || !Number.isInteger(range?.max) || range.max < range.min) return [];
    return Array.from({ length: Math.min(limit, range.max - range.min + 1) }, (_, index) => String(range.min + index));
}

export function normaliseEducationTimeline(education, dob) {
    let previousEndYear = "";
    return education.map((level) => {
        if (!level.applicable) return level;
        if (isSchoolQualification(level.key)) {
            const timeline = educationTimeline(dob, level.key, "", previousEndYear);
            const passout_year = isYearInRange(level.passout_year, timeline.passout) ? level.passout_year : "";
            if (passout_year) previousEndYear = passout_year;
            return { ...level, start_year: "", end_year: "", passout_year };
        }
        const initialRange = educationTimeline(dob, level.key, level.start_year, previousEndYear);
        const start_year = isYearInRange(level.start_year, initialRange.start) ? level.start_year : "";
        const finalRange = educationTimeline(dob, level.key, start_year, previousEndYear);
        const end_year = isYearInRange(level.end_year, finalRange.end) ? level.end_year : "";
        if (end_year) previousEndYear = end_year;
        return { ...level, start_year, end_year };
    });
}
