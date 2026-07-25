const MINIMUM_AGE_BY_TEST = {
    IELTS: 18,
    PTE: 16,
    TOEFL: 16,
    Duolingo: 14,
    Tentative: 18,
};

// How long a COMPLETED test score stays acceptable for a student visa /
// university application, per test. IELTS, PTE Academic, TOEFL iBT and
// Duolingo scores are accepted for 2 years from the test date. (The 3-year
// windows quoted online apply only to Australia PR / skilled-migration
// pathways, not to student admissions.)
const SCORE_VALIDITY_YEARS = {
    IELTS: 2,
    PTE: 2,
    TOEFL: 2,
    Duolingo: 2,
};

// Local-time ISO (YYYY-MM-DD). toISOString() would shift the date for
// timezones ahead of UTC (e.g. early-morning in IST).
const toLocalIso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayIso = () => toLocalIso(new Date());

const isValidDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || "") &&
    !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

const shiftYears = (iso, years) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setFullYear(d.getFullYear() + years);
    return toLocalIso(d);
};

export const minimumEnglishTestAge = (test) => MINIMUM_AGE_BY_TEST[test] || 18;
export const englishScoreValidityYears = (test) => SCORE_VALIDITY_YEARS[test] || 2;

// The two floors a completed exam date must sit above, separately — the UI
// compares these to decide WHICH explanation to show (age vs validity).
export function englishExamDateFloors(dob, test, { today = todayIso() } = {}) {
    return {
        eligibleFrom: isValidDate(dob) ? shiftYears(dob, minimumEnglishTestAge(test)) : null,
        validityFloor: shiftYears(today, -englishScoreValidityYears(test)),
    };
}

export function englishExamDateBounds(dob, test, { tentative = false, today = todayIso() } = {}) {
    if (tentative) {
        // A planned exam must sit in the future (and after the minimum age).
        if (!isValidDate(dob)) return { min: today, max: "" };
        const eligibleFrom = shiftYears(dob, minimumEnglishTestAge(test));
        return { min: today > eligibleFrom ? today : eligibleFrom, max: "" };
    }

    // A completed exam must be (a) after the minimum test age and (b) inside
    // the score-validity window for that test.
    const max = today;
    const validityFloor = shiftYears(today, -englishScoreValidityYears(test));
    if (!isValidDate(dob)) return { min: validityFloor, max };

    const eligibleFrom = shiftYears(dob, minimumEnglishTestAge(test));
    return { min: eligibleFrom > validityFloor ? eligibleFrom : validityFloor, max };
}

export function validateEnglishExamDate(date, dob, test, options = {}) {
    const { tentative = false, today = todayIso() } = options;
    if (!isValidDate(date)) return "Enter a valid exam date.";
    const { min, max } = englishExamDateBounds(dob, test, { tentative, today });
    if (min && date < min) {
        if (isValidDate(dob) && date < shiftYears(dob, minimumEnglishTestAge(test))) {
            return `You must be at least ${minimumEnglishTestAge(test)} years old on the exam date.`;
        }
        if (tentative) return "Enter a future exam date.";
        const years = englishScoreValidityYears(test);
        return `${test} scores are valid for ${years} years only — enter a ${test} exam date within the last ${years} years.`;
    }
    if (max && date > max) return "Exam date cannot be in the future.";
    return null;
}
