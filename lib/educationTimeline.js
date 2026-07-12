const CURRENT_YEAR = new Date().getFullYear();

// Ages and durations represent the normal Indian education pathway, with a
// small allowance for delayed completion or a change in programme.
const EDUCATION_SCHEDULE = {
    y10: { minCompletionAge: 15, maxCompletionAge: 18, duration: 10, usesPassoutYear: true },
    y12: { minCompletionAge: 17, maxCompletionAge: 21, duration: 2, usesPassoutYear: true },
    graduate: { minCompletionAge: 19, maxCompletionAge: 28, duration: 3 },
    postgraduate: { minCompletionAge: 20, maxCompletionAge: 32, duration: 2 },
    phd: { minCompletionAge: 23, maxCompletionAge: 38, duration: 3 },
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

    const priorEnd = Number(previousEndYear);
    if (schedule.usesPassoutYear) {
        const passout = key === "y12" && Number.isInteger(priorEnd)
            ? { min: Math.max(birthYear + schedule.minCompletionAge, priorEnd + 2), max: Math.min(birthYear + schedule.maxCompletionAge, CURRENT_YEAR, priorEnd + 4) }
            : { min: birthYear + schedule.minCompletionAge, max: Math.min(birthYear + schedule.maxCompletionAge, CURRENT_YEAR) };
        return { start: { min: 0, max: -1 }, end: { min: 0, max: -1 }, passout };
    }

    const firstStart = birthYear + schedule.minCompletionAge - schedule.duration;
    const lastStart = Math.min(birthYear + schedule.maxCompletionAge - schedule.duration, CURRENT_YEAR - schedule.duration);
    const start = { min: Math.max(firstStart, Number.isInteger(priorEnd) ? priorEnd : firstStart), max: lastStart };
    const selectedStart = Number(startYear);
    const end = {
        min: Math.max(birthYear + schedule.minCompletionAge, Number.isInteger(selectedStart) ? selectedStart + schedule.duration : firstStart + schedule.duration),
        max: Math.min(birthYear + schedule.maxCompletionAge, CURRENT_YEAR, Number.isInteger(selectedStart) ? selectedStart + schedule.duration + 3 : CURRENT_YEAR),
    };
    return { start, end, passout: { min: 0, max: -1 } };
}

export function educationYears(range) {
    if (range.max < range.min) return [];
    return Array.from({ length: range.max - range.min + 1 }, (_, index) => String(range.min + index));
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
