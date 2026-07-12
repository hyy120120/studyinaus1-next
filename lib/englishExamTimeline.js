const MINIMUM_AGE_BY_TEST = {
    IELTS: 18,
    PTE: 16,
    TOEFL: 16,
    Duolingo: 14,
    Tentative: 18,
};

const isoDate = (date) => date.toISOString().slice(0, 10);
const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

export const minimumEnglishTestAge = (test) => MINIMUM_AGE_BY_TEST[test] || 18;

export function englishExamDateBounds(dob, test, { tentative = false, today = isoDate(new Date()) } = {}) {
    if (!isValidDate(dob)) return { min: tentative ? today : "", max: tentative ? "" : today };

    const eligibilityDate = new Date(`${dob}T00:00:00`);
    eligibilityDate.setFullYear(eligibilityDate.getFullYear() + minimumEnglishTestAge(test));
    const eligibleFrom = isoDate(eligibilityDate);

    return {
        min: tentative && today > eligibleFrom ? today : eligibleFrom,
        max: tentative ? "" : today,
    };
}

export function validateEnglishExamDate(date, dob, test, options) {
    if (!isValidDate(date)) return "Enter a valid exam date.";
    const { min, max } = englishExamDateBounds(dob, test, options);
    if (min && date < min) return `You must be at least ${minimumEnglishTestAge(test)} years old on the exam date.`;
    if (max && date > max) return "Exam date cannot be in the future.";
    return null;
}
