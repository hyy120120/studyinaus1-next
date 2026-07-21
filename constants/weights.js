// Central weights, thresholds and option lists for the Sponsor Loan
// Eligibility Engine. Tune the lending policy HERE — components and
// calculators never hard-code these numbers.

// Sponsor Strength Score (out of 100)
export const SCORING_WEIGHTS = {
    income: 30,
    cibil: 20,
    assets: 20,
    occupation: 10,
    itr: 10,
    foir: 10,
};

// Normalisation targets — reaching these gives full marks for that part.
export const SCORING_TARGETS = {
    monthlyIncomeForFullMarks: 150000, // ₹1.5L/month ⇒ full income marks
    assetValueForFullMarks: 5000000,   // ₹50L total assets ⇒ full asset marks
    itrYearsForFullMarks: 3,           // 3+ years of ITR ⇒ full ITR marks
    cibilMin: 650,                     // below ⇒ zero CIBIL marks
    cibilMax: 900,                     // at/above ⇒ full CIBIL marks
    foirComfort: 30,                   // FOIR ≤ 30% ⇒ full FOIR marks
    foirMax: 60,                       // FOIR ≥ 60% ⇒ zero FOIR marks
};

// Occupation quality as % of the 10 occupation points.
export const OCCUPATION_SCORES = {
    salaried: 100,
    professional: 90,
    business: 75,
    self_employed: 65,
    retired: 50,
    other: 50,
    agriculturist: 40,
};

// --- Sponsor form option lists ------------------------------------------
export const RELATIONSHIP_OPTIONS = [
    { value: "father", label: "Father" },
    { value: "mother", label: "Mother" },
    { value: "spouse", label: "Spouse" },
    { value: "brother", label: "Brother" },
    { value: "sister", label: "Sister" },
    { value: "uncle", label: "Uncle" },
    { value: "aunt", label: "Aunt" },
    { value: "grandfather", label: "Grandfather" },
    { value: "grandmother", label: "Grandmother" },
    { value: "guardian", label: "Guardian" },
    { value: "other", label: "Other" },
];

export const OCCUPATION_OPTIONS = [
    { value: "salaried", label: "Salaried" },
    { value: "professional", label: "Professional (Doctor / CA / Architect)" },
    { value: "business", label: "Business Owner" },
    { value: "self_employed", label: "Self-Employed" },
    { value: "retired", label: "Retired / Pensioner" },
    { value: "agriculturist", label: "Agriculturist" },
    { value: "other", label: "Other" },
];

export const COMPANY_TYPE_OPTIONS = [
    { value: "govt_psu", label: "Government / PSU" },
    { value: "mnc", label: "MNC" },
    { value: "private_limited", label: "Private Limited" },
    { value: "proprietorship", label: "Proprietorship" },
    { value: "partnership", label: "Partnership / LLP" },
    { value: "startup", label: "Startup" },
    { value: "other", label: "Other" },
];

export const ITR_YEAR_OPTIONS = ["0", "1", "2", "3+"];

// Approval probability bands, evaluated top-down.
export const APPROVAL_BANDS = [
    { key: "very_high", label: "Very High", minScore: 85 },
    { key: "high", label: "High", minScore: 70 },
    { key: "medium", label: "Medium", minScore: 55 },
    { key: "low", label: "Low", minScore: 40 },
    { key: "very_low", label: "Very Low", minScore: 0 },
];
