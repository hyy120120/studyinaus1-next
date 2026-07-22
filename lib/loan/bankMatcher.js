// Bank matching logic — compare a sponsor profile against every bank's
// rules and return eligible banks, rejected banks (each with the reason),
// plus estimated loan, interest rate and approval probability.

import { BANKS } from "@/data/banks";
import { calcDPI } from "./dpi";
import { calcFOIR } from "./foir";
import { estimatedRate } from "./interestCalculator";
import { estimateLoanAmount, compareAffordability } from "./loanAmount";
import { sponsorStrengthScore, approvalProbability } from "./sponsorScore";
import { OCCUPATION_OPTIONS } from "@/constants/weights";

const occupationLabel = (key) =>
    OCCUPATION_OPTIONS.find((o) => o.value === key)?.label || key || "—";

// Hard-rule check of one sponsor against one bank.
// Returns { eligible, reasons: [] } — a non-empty reasons list = rejected.
export function checkEligibility(profile = {}, bank) {
    const reasons = [];
    const income = Number(profile.monthlyIncome) || 0;
    const cibil = Number(profile.cibilScore) || 0;
    const itrYears = profile.itrYears === "3+" ? 3 : Number(profile.itrYears) || 0;
    const foir = calcFOIR(profile);

    if (income < bank.minIncome) {
        reasons.push(`Monthly income ₹${income.toLocaleString("en-IN")} is below this bank's ₹${bank.minIncome.toLocaleString("en-IN")} minimum.`);
    }
    if (cibil > 0 && cibil < bank.minCibil) {
        reasons.push(`CIBIL ${cibil} is below the required ${bank.minCibil}.`);
    }
    // Blank CIBIL (approximate mode) → the CIBIL rule is skipped entirely;
    // we do not reject and we do not fabricate a score.
    if (foir > bank.maxFoir) {
        reasons.push(`FOIR ${Math.round(foir)}% exceeds this bank's ${bank.maxFoir}% limit — existing EMIs are too high.`);
    }
    if (itrYears < bank.minItrYears) {
        reasons.push(`This bank needs at least ${bank.minItrYears} year${bank.minItrYears > 1 ? "s" : ""} of ITR.`);
    }
    if (profile.occupation && !bank.acceptedOccupations.includes(profile.occupation)) {
        reasons.push(`${occupationLabel(profile.occupation)} sponsors are not accepted by this lender.`);
    }
    if (!profile.occupation) {
        reasons.push("Select the sponsor's occupation to check this lender.");
    }
    if (bank.collateralRequired && !(Number(profile.propertyValue) > 0)) {
        reasons.push("This bank requires property as collateral — no property value entered.");
    }
    return { eligible: reasons.length === 0, reasons };
}

// Full comparison of one sponsor against the whole bank list.
// `requestedLoan` is the amount the student actually wants (₹) — when it is
// given, every eligible bank also reports how much of THAT amount it would
// approve, and approval probability is scaled by the coverage.
export function evaluateSponsorAgainstBanks(profile = {}, banks = BANKS, requestedLoan = 0) {
    const dpi = calcDPI(profile);
    const foir = calcFOIR(profile);
    const annualIncome = (Number(profile.monthlyIncome) || 0) * 12;
    const { score, breakdown } = sponsorStrengthScore(profile);
    const requested = Math.max(0, Number(requestedLoan) || 0);

    const eligible = [];
    const rejected = [];

    banks.forEach((bank) => {
        const { eligible: ok, reasons } = checkEligibility(profile, bank);
        if (!ok) {
            rejected.push({ bank, reasons });
            return;
        }
        const interestRate = estimatedRate(bank.minInterest, bank.maxInterest, score);
        const estLoan = estimateLoanAmount({ dpi, annualIncome, interestRate, bank });
        if (estLoan <= 0) {
            rejected.push({ bank, reasons: ["Disposable income is too low to support an EMI with this lender."] });
            return;
        }
        const affordability = compareAffordability({ requested, estLoan });
        // Approval % — strength score with small head-room bonuses; when the
        // bank cannot cover the full requested amount, chances drop in
        // proportion to the coverage it can actually offer.
        let pct = Math.round(score * 0.95);
        if (Number(profile.monthlyIncome) >= bank.minIncome * 2) pct += 3;
        if (Number(profile.cibilScore) >= bank.minCibil + 50) pct += 3;
        if (requested > 0) {
            if (affordability.coveredPct >= 100) pct += 2;
            else pct = Math.round((pct * Math.max(30, affordability.coveredPct)) / 100);
        }
        pct = Math.min(97, Math.max(5, pct));
        eligible.push({ bank, interestRate, estLoan, approvalPct: pct, approvalBand: approvalProbability(pct), affordability, reasons: [] });
    });

    eligible.sort((a, b) => b.approvalPct - a.approvalPct || b.estLoan - a.estLoan);

    return {
        dpi,
        foir,
        annualIncome,
        score,
        breakdown,
        sponsorBand: approvalProbability(score),
        eligible,
        rejected,
        best: eligible[0] || null,
        requested,
        // Coverage of the requested amount at the BEST matched bank.
        bestAffordability: eligible.length > 0
            ? compareAffordability({ requested, estLoan: eligible[0].estLoan })
            : compareAffordability({ requested, estLoan: 0 }),
    };
}
