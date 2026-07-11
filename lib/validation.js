// Shared validation helpers. Used on every form in the app (calculator,
// course inquiry, counselling booking) so error rules and messages stay
// consistent. Since there is no separate server in this project, this is
// also the "backend" validation layer — every write path (Firestore) runs
// these same functions right before saving, not just on the UI.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STANDARD_EMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "ymail.com", "icloud.com", "me.com", "proton.me", "protonmail.com", "aol.com"]);
const DISPOSABLE_EMAIL_DOMAINS = new Set(["mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com", "yopmail.com", "trashmail.com", "sharklasers.com", "dispostable.com"]);
// Accepts optional +country code, spaces/dashes, 7-15 digits overall.
export const PHONE_RE = /^\+?[0-9][0-9\s-]{6,14}[0-9]$/;

export function required(value, message = "This field is required.") {
    if (value === undefined || value === null) return message;
    if (typeof value === "string" && value.trim() === "") return message;
    return null;
}

export function isEmail(value) {
    if (!value || !EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
    const domain = value.trim().toLowerCase().split("@")[1];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return "Temporary or disposable email addresses are not accepted.";
    if (!STANDARD_EMAIL_DOMAINS.has(domain)) return "Use a standard email provider such as Gmail, Outlook, Yahoo, or iCloud.";
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
    "Not Yet Taken": [0, 0],
};

export function validateCalculatorStep(step, form) {
    const errors = {};

    if (step === 0) {
        errors.first_name = required(form.first_name) || minLen(form.first_name, 2, "First name") || maxLen(form.first_name, 50, "First name");
        errors.last_name = required(form.last_name) || minLen(form.last_name, 1, "Last name") || maxLen(form.last_name, 50, "Last name");
        errors.email = required(form.email) || isEmail(form.email);
        errors.phone = required(form.phone) || isPhone(form.phone);
        errors.dob = required(form.dob, "Date of birth is required.");
        if (!errors.dob) errors.dob = inRange(form.age, 10, 65, "Age (from date of birth)");
        errors.nationality = required(form.nationality) || maxLen(form.nationality, 50, "Nationality");
        errors.intake_year = inRange(form.intake_year, new Date().getFullYear(), new Date().getFullYear() + 5, "Intake year");
        errors.intended_course = required(form.intended_course) || maxLen(form.intended_course, 120, "Intended course");
        errors.highest_qualification = required(form.highest_qualification, "Select your highest completed qualification.");
        if (!form.privacy_consent) errors.privacy_consent = "You must accept the Privacy Policy and Terms of Service to continue.";
    }

    if (step === 1) {
        const applicable = (form.education || []).filter((l) => l.applicable);
        if (applicable.length === 0) {
            errors.education = "Add marks for at least one completed education level.";
        } else {
            applicable.forEach((l) => {
                if (!l.marks_obtained || !l.marks_total) {
                    errors[`edu_${l.key}`] = `Enter marks obtained and total marks for ${l.label}.`;
                } else if (Number(l.marks_obtained) > Number(l.marks_total)) {
                    errors[`edu_${l.key}`] = `${l.label}: marks obtained cannot exceed total marks.`;
                }
                errors[`edu_${l.key}_stream`] = required(l.stream, `Enter the stream / course for ${l.label}.`);
                const birthYear = new Date(form.dob).getFullYear();
                const offsets = { y10: 15, y12: 17, graduate: 20, postgraduate: 22, phd: 25 };
                const expected = birthYear + (offsets[l.key] || 15);
                const minYear = expected - 3;
                const maxYear = Math.min(expected + 8, new Date().getFullYear());
                errors[`edu_${l.key}_start`] = inRange(l.start_year, minYear - 6, maxYear, `${l.label} start year`);
                errors[`edu_${l.key}_end`] = inRange(l.end_year, minYear, maxYear, `${l.label} end year`);
                if (!errors[`edu_${l.key}_start`] && !errors[`edu_${l.key}_end`] && Number(l.end_year) < Number(l.start_year)) errors[`edu_${l.key}_end`] = `${l.label}: end year cannot be before start year.`;
                if (l.has_backlogs && (l.backlog_count === undefined || l.backlog_count === null || l.backlog_count === "")) {
                    errors[`edu_${l.key}_bl`] = `Enter the number of backlogs for ${l.label}.`;
                }
            });
        }
    }

    if (step === 2) {
        errors.english_test = required(form.english_test);
        if (form.english_test === "Tentative") {
            errors.tentative_exam_date = required(form.tentative_exam_date, "Tentative exam date is required.");
        } else if (form.english_test) {
            const range = ENGLISH_SCORE_RANGES[form.english_test] || [0, 999];
            errors.exam_date = required(form.exam_date, "Exam date is required.");
            errors.overall_score = inRange(form.overall_score, range[0], range[1], `${form.english_test} overall score`);
            errors.exam_attempts = inRange(form.exam_attempts, 1, 20, "Number of attempts");
            const componentMax = form.english_test === "TOEFL" ? 30 : range[1];
            ["listening", "reading", "writing", "speaking"].forEach((field) => {
                errors[field] = required(form[field], `Enter your ${field} score.`) || inRange(form[field], range[0], componentMax, `${field[0].toUpperCase()}${field.slice(1)} score`);
            });
        }
    }

    if (step === 3) {
        errors.is_married = required(form.is_married, "Please answer this question.");
        if (form.has_child) errors.child_count = inRange(form.child_count, 1, 20, "Number of children");
        if (form.is_married === true && form.spouse_will_accompany === true) {
            errors.spouse_activity = required(form.spouse_activity, "Please select spouse's present activity.");
        }
    }

    if (step === 6) {
        const applicable = (form.sponsors || []).filter((s) => s.applicable);
        if (applicable.length === 0) {
            errors.sponsors = "At least one sponsor (typically Father or Mother) is required.";
        } else {
            applicable.forEach((s) => {
                errors[`sponsor_relation_${s.id}`] = required(s.relation, "Select the sponsor's relation.");
                if (s.relation === "Other") errors[`sponsor_relation_${s.id}`] = required(s.other_relation, "Specify the sponsor relationship.");
                errors[`sponsor_${s.id}`] = required(s.employment_type, "Select an employment type.") || required(String(s.annual_income_inr ?? ""), "Enter annual income.") || nonNegative(s.annual_income_inr, `${s.relation || "Sponsor"}'s annual income`);
                const incomeError = nonNegative(s.annual_income_inr, `${s.relation}'s annual income`);
                if (incomeError) errors[`sponsor_${s.id}`] = incomeError;
            });
        }
    }

    if (step === 7) {
        (form.sponsors || []).filter((s) => s.applicable).forEach((s) => {
            (s.docs || []).forEach((doc) => {
                if (!doc.status) errors[`sponsor_doc_${s.id}_${doc.key}`] = `Mark whether ${doc.label} is available.`;
                if (doc.year_required && doc.status === "yes") errors[`sponsor_doc_year_${s.id}_${doc.key}`] = inRange(doc.year_established, 1950, new Date().getFullYear(), `${doc.label} year established`);
            });
        });
    }

    if (step === 4) {
        (form.employment_records || []).forEach((record) => {
            if (!["Not Applicable", "Unemployed", "Student"].includes(record.status)) {
                errors[`employment_${record.id}_employer`] = required(record.employer, "Enter the employer name.");
                errors[`employment_${record.id}_joining`] = required(record.date_of_joining, "Enter the date of joining.");
            }
        });
    }

    if (step === 5) {
        errors.course_in_line_with_previous_education = required(form.course_in_line_with_previous_education, "Please answer this question.");
        errors.applied_visa_before = required(form.applied_visa_before, "Please select an option.");
        errors.previous_visa_refusal = required(form.previous_visa_refusal, "Please answer this question.");
        if (form.previous_visa_refusal === true) {
            errors.refusal_country = required(form.refusal_country, "Please specify the country of refusal.");
            errors.refusal_reason = required(form.refusal_reason, "Please describe the stated reason for refusal.") ||
                minLen(form.refusal_reason, 5, "Refusal reason");
        }
    }

    if (step === 8) {
        errors.mist_account_holder_name = required(form.mist_account_holder_name, "Enter the Mist account holder's name.");
        errors.mist_account_holder_relation = required(form.mist_account_holder_relation, "Enter the account holder's relation to the student.");
        errors.mist_fund_source = required(form.mist_fund_source, "Select the primary source of funds.");
        errors.mist_amount_inr = required(form.mist_amount_inr, "Enter the amount to verify.") || nonNegative(form.mist_amount_inr, "Mist verification amount");
        errors.mist_transfer_timeline = required(form.mist_transfer_timeline, "Select the expected transfer timeline.");
        if (form.education_loan_required === true) {
            errors.loan_type = required(form.loan_type, "Please select a loan type.");
            errors.lender_bank_name = required(form.lender_bank_name, "Please enter the lender / bank name.");
            errors.loan_amount_inr = nonNegative(form.loan_amount_inr, "Loan amount") || required(form.loan_amount_inr && String(form.loan_amount_inr), "Loan amount is required.");
            errors.annual_interest_rate = inRange(form.annual_interest_rate, 0.1, 30, "Annual interest rate");
            errors.loan_tenure_years = inRange(form.loan_tenure_years, 1, 30, "Loan tenure (years)");
        }
    }

    if (step === 8) {
        ["savings", "fixed_deposits", "investments", "other_funds"].forEach((key) => {
            if (form[`${key}_available`]) {
                errors[`${key}_amount_inr`] = required(form[`${key}_amount_inr`], "Enter the available amount.") || nonNegative(form[`${key}_amount_inr`], "Fund amount");
            }
        });
    }


    Object.keys(errors).forEach((k) => { if (!errors[k]) delete errors[k]; });
    return errors;
}

export function validateCalculatorForm(form) {
    let errors = {};
    for (let s = 0; s < 10; s++) errors = { ...errors, ...validateCalculatorStep(s, form) };
    return errors;
}

export function validateCourseInquiry(inquiry) {
    const errors = {};
    errors.name = required(inquiry?.name) || minLen(inquiry?.name, 2, "Name") || maxLen(inquiry?.name, 50, "Name");
    errors.email = required(inquiry?.email) || isEmail(inquiry?.email);
    errors.phone = required(inquiry?.phone) || isPhone(inquiry?.phone);
    errors.field_of_interest = required(inquiry?.field_of_interest) || maxLen(inquiry?.field_of_interest, 120, "Field of interest");
    errors.message = maxLen(inquiry?.message, 500, "Message");
    Object.keys(errors).forEach((k) => { if (!errors[k]) delete errors[k]; });
    return errors;
}

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
