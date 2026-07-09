// Shared validation helpers. Used on every form in the app (calculator,
// course inquiry, counselling booking) so error rules and messages stay
// consistent. Since there is no separate server in this project, this is
// also the "backend" validation layer — every write path (Firestore) runs
// these same functions right before saving, not just on the UI.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts optional +country code, spaces/dashes, 7-15 digits overall.
export const PHONE_RE = /^\+?[0-9][0-9\s-]{6,14}[0-9]$/;

export function required(value, message = "This field is required.") {
    if (value === undefined || value === null) return message;
    if (typeof value === "string" && value.trim() === "") return message;
    return null;
}

export function isEmail(value) {
    if (!value || !EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
    return null;
}

export function isPhone(value) {
    if (!value || !PHONE_RE.test(value.trim())) return "Enter a valid phone number (7-15 digits).";
    return null;
}

export function minLen(value, n, label = "This field") {
    if (!value || value.trim().length < n) return `${label} must be at least ${n} characters.`;
    return null;
}

export function maxLen(value, n, label = "This field") {
    if (value && value.trim().length > n) return `${label} must be under ${n} characters.`;
    return null;
}

export function inRange(value, min, max, label = "Value") {
    const n = Number(value);
    if (Number.isNaN(n) || n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return null;
}

export function nonNegative(value, label = "Value") {
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) return `${label} cannot be negative.`;
    return null;
}

// --- Visa calculator form ---------------------------------------------

const ENGLISH_SCORE_RANGES = {
    IELTS: [0, 9],
    PTE: [10, 90],
    TOEFL: [0, 120],
    Duolingo: [10, 160],
    None: [0, 0],
};

export function validateCalculatorStep(step, form) {
    const errors = {};

    if (step === 0) {
        errors.full_name = required(form.full_name) || minLen(form.full_name, 2, "Full name") || maxLen(form.full_name, 80, "Full name");
        errors.email = required(form.email) || isEmail(form.email);
        errors.phone = required(form.phone) || isPhone(form.phone);
        errors.age = inRange(form.age, 15, 65, "Age");
        errors.nationality = required(form.nationality) || maxLen(form.nationality, 50, "Nationality");
        errors.intake_year = inRange(form.intake_year, new Date().getFullYear(), new Date().getFullYear() + 5, "Intake year");
        errors.intended_course = required(form.intended_course) || maxLen(form.intended_course, 120, "Intended course");
    }

    if (step === 1) {
        errors.highest_qualification = required(form.highest_qualification);
        errors.field_of_study = required(form.field_of_study) || maxLen(form.field_of_study, 80, "Field of study");
        errors.grade_percentage = inRange(form.grade_percentage, 1, 100, "Grade / percentage");
        errors.year_of_completion = inRange(form.year_of_completion, 1980, new Date().getFullYear(), "Year of completion");
        errors.gap_years = inRange(form.gap_years, 0, 40, "Gap years");
    }

    if (step === 2) {
        errors.work_experience_years = inRange(form.work_experience_years, 0, 45, "Work experience");
        if (form.current_job_title) errors.current_job_title = maxLen(form.current_job_title, 80, "Job title");
    }

    if (step === 3) {
        errors.english_test = required(form.english_test);
        const range = ENGLISH_SCORE_RANGES[form.english_test] || [0, 999];
        if (form.english_test !== "None") {
            errors.english_score = inRange(form.english_score, range[0], range[1], `${form.english_test} score`);
        }
    }

    if (step === 4) {
        errors.sponsor_relationship = required(form.sponsor_relationship);
        errors.annual_family_income_inr = nonNegative(form.annual_family_income_inr, "Annual family income");
    }

    if (step === 5) {
        errors.liquid_funds_inr = nonNegative(form.liquid_funds_inr, "Liquid funds");
        errors.loan_sanctioned_inr = nonNegative(form.loan_sanctioned_inr, "Loan sanctioned");
        errors.property_assets_inr = nonNegative(form.property_assets_inr, "Property / assets");
    }

    if (step === 6) {
        if (form.previous_visa_refusal) {
            errors.refusal_country = required(form.refusal_country, "Please specify the country of refusal.");
            errors.refusal_reason = required(form.refusal_reason, "Please describe the stated reason for refusal.") ||
                minLen(form.refusal_reason, 5, "Refusal reason");
        }
    }

    Object.keys(errors).forEach((k) => { if (!errors[k]) delete errors[k]; });
    return errors;
}

export function validateCalculatorForm(form) {
    let errors = {};
    for (let s = 0; s <= 6; s++) errors = { ...errors, ...validateCalculatorStep(s, form) };
    return errors;
}

// --- Course inquiry form ------------------------------------------------

export function validateCourseInquiry(inquiry) {
    const errors = {};
    errors.name = required(inquiry.name) || minLen(inquiry.name, 2, "Name") || maxLen(inquiry.name, 80, "Name");
    errors.email = required(inquiry.email) || isEmail(inquiry.email);
    errors.phone = required(inquiry.phone) || isPhone(inquiry.phone);
    errors.field_of_interest = required(inquiry.field_of_interest) || maxLen(inquiry.field_of_interest, 80, "Field of interest");
    if (inquiry.message) errors.message = maxLen(inquiry.message, 500, "Message");
    Object.keys(errors).forEach((k) => { if (!errors[k]) delete errors[k]; });
    return errors;
}

// --- Book a counselling session form ------------------------------------

export function validateBooking(booking) {
    const errors = {};
    errors.first_name = required(booking.first_name) || minLen(booking.first_name, 2, "First name") || maxLen(booking.first_name, 50, "First name");
    errors.last_name = required(booking.last_name) || minLen(booking.last_name, 1, "Last name") || maxLen(booking.last_name, 50, "Last name");
    errors.email = required(booking.email) || isEmail(booking.email);
    errors.mobile = required(booking.mobile) || isPhone(booking.mobile);
    errors.start_timeline = required(booking.start_timeline);
    errors.counselling_mode = required(booking.counselling_mode);
    errors.study_level = required(booking.study_level);
    errors.funding_source = required(booking.funding_source);
    Object.keys(errors).forEach((k) => { if (!errors[k]) delete errors[k]; });
    return errors;
}
