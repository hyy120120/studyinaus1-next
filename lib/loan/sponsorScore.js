// Sponsor Strength Score (0–100) with its six weighted parts plus the
// approval probability band a score maps to.

import { SCORING_WEIGHTS, SCORING_TARGETS, OCCUPATION_SCORES, APPROVAL_BANDS } from "@/constants/weights";
import { calcFOIR } from "./foir";
import { totalAssets } from "./loanAmount";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const round2 = (v) => Math.round(v * 100) / 100;

export function scoreIncome({ monthlyIncome = 0 } = {}) {
    const part = clamp01((Number(monthlyIncome) || 0) / SCORING_TARGETS.monthlyIncomeForFullMarks);
    return part * SCORING_WEIGHTS.income;
}

export function scoreCibil({ cibilScore = 0 } = {}) {
    const cibil = Number(cibilScore) || 0;
    if (cibil < SCORING_TARGETS.cibilMin) return 0;
    const span = SCORING_TARGETS.cibilMax - SCORING_TARGETS.cibilMin;
    const part = clamp01((cibil - SCORING_TARGETS.cibilMin) / span);
    return part * SCORING_WEIGHTS.cibil;
}

export function scoreAssets(profile = {}) {
    const part = clamp01(totalAssets(profile) / SCORING_TARGETS.assetValueForFullMarks);
    return part * SCORING_WEIGHTS.assets;
}

export function scoreOccupation({ occupation = "" } = {}) {
    // An unselected occupation earns nothing — "other" must be an explicit
    // choice to receive its (modest) marks.
    if (!occupation || !Object.prototype.hasOwnProperty.call(OCCUPATION_SCORES, occupation)) return 0;
    return (OCCUPATION_SCORES[occupation] / 100) * SCORING_WEIGHTS.occupation;
}

export function scoreItr({ itrYears = "0" } = {}) {
    const years = itrYears === "3+" ? SCORING_TARGETS.itrYearsForFullMarks : Number(itrYears) || 0;
    const part = clamp01(years / SCORING_TARGETS.itrYearsForFullMarks);
    return part * SCORING_WEIGHTS.itr;
}

export function scoreFoir(profile = {}) {
    // Without an income, FOIR is meaningless — treat as zero marks rather
    // than granting full marks for a 0% ratio on ₹0 income.
    if (!(Number(profile?.monthlyIncome) > 0)) return 0;
    const foir = calcFOIR(profile);
    if (foir <= SCORING_TARGETS.foirComfort) return SCORING_WEIGHTS.foir;
    if (foir >= SCORING_TARGETS.foirMax) return 0;
    const span = SCORING_TARGETS.foirMax - SCORING_TARGETS.foirComfort;
    const part = clamp01((SCORING_TARGETS.foirMax - foir) / span);
    return part * SCORING_WEIGHTS.foir;
}

// Full evaluation — every part exported in the breakdown for the UI.
export function sponsorStrengthScore(profile = {}) {
    const breakdown = {
        income: round2(scoreIncome(profile)),
        cibil: round2(scoreCibil(profile)),
        assets: round2(scoreAssets(profile)),
        occupation: round2(scoreOccupation(profile)),
        itr: round2(scoreItr(profile)),
        foir: round2(scoreFoir(profile)),
    };
    const score = Math.round(Object.values(breakdown).reduce((sum, v) => sum + v, 0));
    return { score: Math.min(100, score), breakdown };
}

// Approval probability label from a numeric strength score.
export function approvalProbability(score) {
    const s = Number(score) || 0;
    const band = APPROVAL_BANDS.find((b) => s >= b.minScore) || APPROVAL_BANDS[APPROVAL_BANDS.length - 1];
    return band;
}
