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
                if (l.has_backlogs && (l.backlog_count === undefined || l.backlog_count === null || l.backlog_count === "")) {
                    errors[`edu_${l.key}_bl`] = `Enter the number of backlogs for ${l.label}.`;
                }
            });
        }
    }

    if (step === 2) {
        errors.english_test = required(form.english_test);
        if (form.english_test && form.english_test !== "Not Yet Taken") {
            const range = ENGLISH_SCORE_RANGES[form.english_test] || [0, 999];
            errors.overall_score = inRange(form.overall_score, range[0], range[1], `${form.english_test} overall score`);
            errors.exam_attempts = inRange(form.exam_attempts, 1, 20, "Number of attempts");
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
                errors[`sponsor_${s.id}`] = required(s.employment_type, "Select an employment type.") || nonNegative(s.annual_income_inr, `${s.relation || "Sponsor"}'s annual income`);
                const incomeError = nonNegative(s.annual_income_inr, `${s.relation}'s annual income`);
                if (incomeError) errors[`sponsor_${s.id}`] = incomeError;
            });
        }
    }

    if (step === 7) {
        (form.sponsors || []).filter((s) => s.applicable).forEach((s) => {
            if ((s.docs || []).length < 2) errors[`sponsor_docs_${s.id}`] = `Please select at least two documents for ${s.relation}.`;
        });
    }

    if (step === 4) {
        if (form.work1_status && !["Not Applicable", "Unemployed", "Student"].includes(form.work1_status)) {
            errors.work1_employer = required(form.work1_employer, "Enter employer name for Employment 1.");
            errors.work1_date_of_joining = required(form.work1_date_of_joining, "Enter date of joining for Employment 1.");
        }
        if (form.work2_status && !["", "Not Applicable", "Unemployed", "Student"].includes(form.work2_status)) {
            errors.work2_employer = required(form.work2_employer, "Enter employer name for Employment 2.");
            errors.work2_date_of_joining = required(form.work2_date_of_joining, "Enter date of joining for Employment 2.");
        }
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
        errors.education_loan_required = required(form.education_loan_required, "Please answer this question.");
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
    for (let s = 0; s <= 10; s++) errors = { ...errors, ...validateCalculatorStep(s, form) };
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
