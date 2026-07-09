// Rule-based Subclass 500 (Student) visa probability scoring engine, aligned
// to Australian Department of Home Affairs (DHA) Genuine Student (GS)
// assessment practice: academic readiness, English proficiency (per DHA's
// accepted-test bands), financial capacity against the DHA's published
// 12-month living-cost benchmark, visa/compliance history, and the PIC 4001
// (character) / PIC 4007 (health) requirements that apply to every
// Australian visa application.

export const BREAKDOWN_LABELS = {
    academic: { label: "Academic readiness", max: 18 },
    work: { label: "Work experience", max: 10 },
    english: { label: "English language", max: 18 },
    financial: { label: "Financial capacity (DHA)", max: 26 },
    visa_history: { label: "Visa history & compliance", max: 20 },
    personal: { label: "Personal & intent (GS)", max: 8 },
};

function englishPoints(test, score) {
    // Bands aligned to DHA-accepted English tests for Subclass 500.
    if (test === "IELTS") {
        if (score >= 7.5) return 18;
        if (score >= 7.0) return 16;
        if (score >= 6.5) return 13;
        if (score >= 6.0) return 9;
        if (score >= 5.5) return 5;
        return 2;
    }
    if (test === "PTE") {
        if (score >= 79) return 18;
        if (score >= 65) return 15;
        if (score >= 58) return 11;
        if (score >= 50) return 7;
        return 2;
    }
    if (test === "TOEFL") {
        if (score >= 100) return 18;
        if (score >= 90) return 15;
        if (score >= 79) return 11;
        if (score >= 60) return 7;
        return 2;
    }
    if (test === "Duolingo") {
        if (score >= 125) return 15;
        if (score >= 110) return 11;
        if (score >= 95) return 7;
        return 2;
    }
    return 0; // none
}

function academicPoints(form) {
    // 0-18: qualification level + grade + continuity of study (gap years),
    // all of which feed directly into the DHA's course-progression / GS test.
    let pts = 0;
    const q = (form.highest_qualification || "").toLowerCase();
    if (q.includes("phd")) pts += 10;
    else if (q.includes("master")) pts += 9;
    else if (q.includes("bachelor")) pts += 7;
    else if (q.includes("diploma")) pts += 5;
    else pts += 3;

    const g = form.grade_percentage;
    if (g >= 80) pts += 6;
    else if (g >= 70) pts += 5;
    else if (g >= 60) pts += 3;
    else if (g >= 50) pts += 2;
    else pts += 1;

    if (form.gap_years <= 1) pts += 2;
    else if (form.gap_years <= 3) pts += 1;
    else if (form.gap_years > 5) pts -= 1;

    return Math.max(Math.min(pts, 18), 0);
}

function workPoints(form) {
    // 0-10: relevant work experience supports the "course-career fit" limb
    // of the Genuine Student test.
    let pts = 0;
    const y = form.work_experience_years;
    if (y >= 3) pts += 6;
    else if (y >= 1) pts += 4;
    else if (y > 0) pts += 2;
    if (form.work_relevant_to_course) pts += 4;
    return Math.min(pts, 10);
}

function financialPoints(form) {
    // 0-26. DHA 12-month living cost benchmark (from 10 May 2024) is AUD
    // 29,710 for the primary applicant — plus tuition (~AUD 35-50k) and
    // travel. Recommended INR-equivalent total of tuition + living + travel
    // for a 1-yr Master's: ~60-80 lakh.
    const funds = form.liquid_funds_inr + form.loan_sanctioned_inr + 0.4 * form.property_assets_inr;
    let pts;
    if (funds >= 7000000) pts = 18;      // 70L+
    else if (funds >= 5000000) pts = 14; // 50L
    else if (funds >= 3500000) pts = 9;  // 35L
    else if (funds >= 2000000) pts = 5;  // 20L
    else pts = 2;

    if (form.annual_family_income_inr >= 1800000) pts += 5;
    else if (form.annual_family_income_inr >= 1000000) pts += 3;
    else if (form.annual_family_income_inr >= 500000) pts += 2;

    if (form.income_proof_available) pts += 3;
    return Math.min(pts, 26);
}

function visaHistoryPoints(form) {
    // 0-20: prior visa/compliance record (0-12) plus the two mandatory
    // Public Interest Criteria that apply to every Australian visa —
    // PIC 4001 (character) and PIC 4007 (health) (0-8).
    let pts = 12;
    if (form.previous_visa_refusal) {
        const reason = (form.refusal_reason || "").toLowerCase();
        if (reason.includes("gte") || reason.includes("genuine") || reason.includes("gs") || reason.includes("fraud")) {
            pts -= 10;
        } else {
            pts -= 6;
        }
    }
    pts = Math.max(Math.min(pts, 12), 0);

    if (form.character_declaration) pts += 4;
    if (form.health_declaration) pts += 4;

    return Math.max(Math.min(pts, 20), 0);
}

function personalPoints(form) {
    // 0-8 - age & intent clarity (both feed the GS "circumstances" limb).
    let pts = 0;
    if (form.age >= 18 && form.age <= 25) pts += 5;
    else if (form.age <= 30) pts += 4;
    else if (form.age <= 35) pts += 2;
    else pts += 1;

    if (form.intended_university && form.intended_course) pts += 3;
    else if (form.intended_course) pts += 1;

    return Math.min(pts, 8);
}

export function computeScore(form) {
    const breakdown = {
        academic: academicPoints(form),
        work: workPoints(form),
        english: englishPoints(form.english_test, form.english_score),
        financial: financialPoints(form),
        visa_history: visaHistoryPoints(form),
        personal: personalPoints(form),
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

    if (breakdown.english >= 14) {
        strengths.push("Strong English proficiency");
    } else {
        weaknesses.push("English score below competitive range");
        recommendations.push("Retake IELTS/PTE aiming for IELTS 7.0+ / PTE 65+ to strengthen Genuine Student standing.");
    }

    if (breakdown.academic >= 13) {
        strengths.push("Solid academic record");
    } else if (breakdown.academic < 9) {
        weaknesses.push("Academic profile is weak / has large gap");
        recommendations.push("Document the reason for gap years with evidence (work, courses, family) and address any backlogs.");
    }

    if (breakdown.financial >= 19) {
        strengths.push("Adequate financial backing");
    } else {
        weaknesses.push("Financial documentation may not satisfy DHA requirements (AUD 29,710 + tuition + travel)");
        recommendations.push("Build/maintain liquid funds of at least INR 50-70 lakh (covering AUD 29,710 living + tuition + travel) and keep 3+ months of bank statements + 3 yrs ITR.");
    }

    if (breakdown.work >= 6) {
        strengths.push("Relevant work experience supports Genuine Student narrative");
    }
    if (form.previous_visa_refusal) {
        weaknesses.push("Previous visa refusal in history");
        recommendations.push("Address the prior refusal upfront in your Genuine Student statement with corrective evidence.");
    }

    if (!form.income_proof_available) {
        weaknesses.push("Income proof (ITR/Form 16) missing");
        recommendations.push("Collect 3 years of ITR / Form 16 / salary slips of sponsor before lodging.");
    }

    if (!form.character_declaration) {
        weaknesses.push("Character requirement (PIC 4001) not yet confirmed");
        recommendations.push("Arrange a Police Clearance Certificate and be ready to declare any past convictions truthfully — undisclosed issues are a common refusal reason.");
    }
    if (!form.health_declaration) {
        weaknesses.push("Health requirement (PIC 4007) not yet confirmed");
        recommendations.push("Book your Immigration Medical Examination (IME) with a panel physician early — health clearance delays are a common cause of processing delays.");
    }

    const summary =
        `Based on the submitted profile, the estimated Subclass 500 approval likelihood is ${total}/100 ` +
        `(${tier}). This score weighs Australian DHA Genuine Student criteria — academic readiness, English ` +
        `proficiency, financial capacity against the AUD 29,710 living-cost benchmark, visa/compliance history, ` +
        `and the mandatory character (PIC 4001) and health (PIC 4007) requirements. This is a guidance estimate; ` +
        `the final outcome depends on the Department of Home Affairs assessment.`;

    return { score: total, tier, breakdown, summary, strengths, weaknesses, recommendations };
}
