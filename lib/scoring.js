// Rule-based Subclass 500 (Student) visa probability scoring engine.
// Rebuilt to match the current calculator intake form while keeping the
// score grounded in DHA Genuine Student criteria: academic consistency,
// English proficiency, financial capacity, visa/compliance history, work-course
// relevance, and course continuity / genuine intent.

export const BREAKDOWN_LABELS = {
    academic: { label: "Academic & backlogs", max: 15 },
    english: { label: "English language", max: 15 },
    work: { label: "Work experience", max: 10 },
    financial: { label: "Financial capacity (DHA)", max: 25 },
    visa_history: { label: "Visa history & compliance", max: 15 },
    intent: { label: "Course continuity & intent", max: 10 },
    family: { label: "Marital & family factors", max: 10 },
};

export const EDUCATION_LEVELS = [
    { key: "y10", label: "10th / Year 10" },
    { key: "y12", label: "12th / HSC / Equivalent" },
    { key: "graduate", label: "Graduation / Bachelor" },
    { key: "postgraduate", label: "Postgraduate / Master" },
];

export const SPONSOR_SLOTS = [
    { id: "sponsor_1", relation: "", defaultApplicable: false },
    { id: "sponsor_2", relation: "", defaultApplicable: false },
    { id: "sponsor_3", relation: "", defaultApplicable: false },
    { id: "sponsor_4", relation: "", defaultApplicable: false },
];

export const DOCS = [
    { key: "itr", label: "ITR / Form 16" },
    { key: "salary_slip", label: "Salary slip" },
    { key: "bank_statement", label: "Bank statement" },
    { key: "affidavit", label: "Sponsor affidavit" },
];

function englishPoints(test, score) {
    if (test === "IELTS") {
        if (score >= 7.5) return 15;
        if (score >= 7.0) return 13;
        if (score >= 6.5) return 11;
        if (score >= 6.0) return 8;
        if (score >= 5.5) return 5;
        return 2;
    }
    if (test === "PTE") {
        if (score >= 79) return 15;
        if (score >= 65) return 13;
        if (score >= 58) return 9;
        if (score >= 50) return 6;
        return 2;
    }
    if (test === "TOEFL") {
        if (score >= 100) return 15;
        if (score >= 90) return 13;
        if (score >= 79) return 9;
        if (score >= 60) return 6;
        return 2;
    }
    if (test === "Duolingo") {
        if (score >= 125) return 13;
        if (score >= 110) return 9;
        if (score >= 95) return 6;
        return 2;
    }
    return 0;
}

function englishScorePoints(form) {
    let pts = englishPoints(form.english_test, Number(form.overall_score) || 0);
    if (Number(form.exam_attempts) >= 3) pts = Math.max(pts - 2, 0);
    return Math.min(pts, 15);
}

function academicPoints(form) {
    let pts = 0;
    const education = Array.isArray(form.education) ? form.education : [];
    const applicable = education.filter((item) => item?.applicable);
    if (applicable.length === 0) return 0;

    const highest = applicable
        .slice()
        .sort((a, b) => (a.end_year || 0) - (b.end_year || 0))
        .pop();

    const highestKey = (highest?.key || "").toLowerCase();
    if (highestKey.includes("post")) pts += 6;
    else if (highestKey.includes("gradu")) pts += 5;
    else if (highestKey.includes("y12") || highestKey.includes("12")) pts += 3;
    else pts += 2;

    const marks = applicable
        .map((item) => Number(item?.marks_obtained) || 0)
        .filter(Boolean);
    const totals = applicable
        .map((item) => Number(item?.marks_total) || 0)
        .filter(Boolean);
    const percent = totals.length > 0 ? (marks.reduce((sum, value) => sum + value, 0) / totals.reduce((sum, value) => sum + value, 0)) * 100 : 0;

    if (percent >= 75) pts += 4;
    else if (percent >= 65) pts += 3;
    else if (percent >= 55) pts += 2;
    else if (percent >= 50) pts += 1;

    const backlogCount = applicable.reduce((sum, item) => sum + (item?.has_backlogs ? Number(item?.backlog_count) || 0 : 0), 0);
    const uncleared = applicable.some((item) => item?.has_backlogs && !item?.backlogs_cleared);
    if (backlogCount === 0) pts += 3;
    else if (backlogCount <= 2 && !uncleared) pts += 2;
    else if (backlogCount <= 5 && !uncleared) pts += 1;
    else if (uncleared) pts -= 2;

    return Math.max(Math.min(pts, 15), 0);
}

function workPoints(form) {
    let pts = 0;
    const work1 = ["Employed", "Self-employed"].includes(form.work1_status);
    const work2 = ["Employed", "Self-employed"].includes(form.work2_status);

    if (work1 || work2) pts += 3;
    if (form.work_relevant_to_course) pts += 3;
    if (form.work1_itr_filed || form.work2_itr_filed) pts += 2;
    if (form.work_verification_done) pts += 2;

    return Math.min(pts, 10);
}

function financialPoints(form) {
    const sponsors = Array.isArray(form.sponsors) ? form.sponsors.filter((s) => s?.applicable) : [];
    const sponsorIncome = sponsors.reduce((sum, s) => sum + (Number(s?.annual_income_inr) || 0), 0);
    const proofCount = sponsors.reduce((sum, s) => sum + (Array.isArray(s?.docs) ? s.docs.length : 0), 0);
    const loanAmount = form.education_loan_required ? (Number(form.loan_amount_inr) || 0) : 0;

    let pts = 1;
    const funds = sponsorIncome + loanAmount;
    if (funds >= 6000000) pts = 14;
    else if (funds >= 4000000) pts = 11;
    else if (funds >= 2500000) pts = 7;
    else if (funds >= 1500000) pts = 4;

    if (sponsorIncome >= 1800000) pts += 6;
    else if (sponsorIncome >= 1000000) pts += 4;
    else if (sponsorIncome >= 500000) pts += 2;

    if (proofCount >= 4) pts += 3;
    else if (proofCount >= 2) pts += 2;
    if (form.education_loan_required && Number(form.loan_amount_inr) > 0) pts += 2;

    return Math.min(pts, 25);
}

function visaHistoryPoints(form) {
    let pts = 8;
    if (form.previous_visa_refusal) {
        const reason = (form.refusal_reason || "").toLowerCase();
        if (reason.includes("gte") || reason.includes("genuine") || reason.includes("gs") || reason.includes("fraud")) {
            pts -= 7;
        } else {
            pts -= 4;
        }
    }
    pts = Math.max(Math.min(pts, 8), 0);

    if (form.character_declaration) pts += 4;
    if (form.health_declaration) pts += 3;

    return Math.max(Math.min(pts, 15), 0);
}

function intentPoints(form) {
    let pts = 0;
    if (form.course_in_line_with_previous_education) pts += 5;
    else pts += 1;

    if (form.intended_university && form.intended_course) pts += 3;
    else if (form.intended_course) pts += 2;

    if (form.age >= 18 && form.age <= 30) pts += 2;
    else if (form.age <= 35) pts += 1;

    return Math.min(pts, 10);
}

function familyPoints(form) {
    let pts = 6;
    if (form.is_married) {
        pts = 4;
        if (form.spouse_will_accompany) {
            pts -= 2;
            if (form.spouse_qualification || form.spouse_activity === "Working") pts += 2;
        } else {
            pts += 2;
        }
        if (form.has_child && form.spouse_will_accompany) pts -= 1;
    }
    return Math.max(Math.min(pts, 10), 0);
}

export function computeScore(form) {
    const breakdown = {
        academic: academicPoints(form),
        english: englishScorePoints(form),
        work: workPoints(form),
        financial: financialPoints(form),
        visa_history: visaHistoryPoints(form),
        intent: intentPoints(form),
        family: familyPoints(form),
    };
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    let tier;
    if (total >= 80) tier = "Excellent";
    else if (total >= 65) tier = "Strong";
    else if (total >= 45) tier = "Moderate";
    else tier = "Low";

    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (breakdown.english >= 12) {
        strengths.push("Strong English proficiency");
    } else {
        weaknesses.push("English score below competitive range");
        recommendations.push("Retake IELTS/PTE aiming for IELTS 7.0+ / PTE 65+ to strengthen Genuine Student standing.");
    }

    if (breakdown.academic >= 11) {
        strengths.push("Solid, consistent academic record");
    } else if (breakdown.academic < 7) {
        weaknesses.push("Academic profile is weak or has unresolved backlogs");
        recommendations.push("Clear pending backlogs and document any gap years with evidence before lodging.");
    }

    if (breakdown.financial >= 19) {
        strengths.push("Adequate financial backing across sponsors and savings");
    } else {
        weaknesses.push("Financial documentation may not satisfy DHA requirements");
        recommendations.push("Build combined liquid funds and sponsor income to at least INR 50-70 lakh equivalent and keep 3+ months of bank statements plus 3 years of ITR for each sponsor.");
    }

    if (breakdown.work >= 7) {
        strengths.push("Relevant, verifiable work experience supports the course-career link");
    }

    if (form.previous_visa_refusal) {
        weaknesses.push("Previous visa refusal in history");
        recommendations.push("Address the prior refusal upfront in your Genuine Student statement with corrective evidence.");
    }
    if (!form.character_declaration) {
        weaknesses.push("Character requirement (PIC 4001) not yet confirmed");
        recommendations.push("Arrange a Police Clearance Certificate and be ready to declare any past convictions truthfully.");
    }
    if (!form.health_declaration) {
        weaknesses.push("Health requirement (PIC 4007) not yet confirmed");
        recommendations.push("Book your Immigration Medical Examination (IME) with a panel physician early to avoid delays.");
    }

    if (!form.course_in_line_with_previous_education) {
        weaknesses.push("Intended course does not clearly follow from prior education/work");
        recommendations.push("Prepare a strong Statement of Purpose explaining the course-career link, or consider a more aligned course.");
    }

    if (form.is_married && form.spouse_will_accompany) {
        recommendations.push("Budget separately for your spouse's living costs and dependent children in your financial evidence.");
    }

    const summary =
        `Based on the submitted profile, the estimated Subclass 500 approval likelihood is ${total}/100 ` +
        `(${tier}). This score weighs Australian DHA Genuine Student criteria — academic consistency and ` +
        `backlog history, English proficiency, financial capacity, work-course relevance, visa/compliance ` +
        `history including the mandatory character (PIC 4001) and health (PIC 4007) requirements, ` +
        `course continuity, and family/dependant factors. This is a guidance estimate; the final outcome ` +
        `depends on the Department of Home Affairs assessment.`;

    return { score: total, tier, breakdown, summary, strengths, weaknesses, recommendations };
}
