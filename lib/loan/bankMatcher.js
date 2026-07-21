// Bank matching logic — compare a sponsor profile against every bank's
// rules and return eligible banks, rejected banks (each with the reason),
// plus estimated loan, interest rate and approval probability.

import { BANKS } from "@/data/banks";
import { calcDPI } from "./dpi";
import { calcFOIR } from "./foir";
import { estimatedRate } from "./interestCalculator";
import { estimateLoanAmount } from "./loanAmount";
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
    if (cibil < bank.minCibil) {
        reasons.push(cibil > 0
            ? `CIBIL ${cibil} is below the required ${bank.minCibil}.`
            : `CIBIL score is required (minimum ${bank.minCibil}).`);
    }
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
export function evaluateSponsorAgainstBanks(profile = {}, banks = BANKS) {
    const dpi = calcDPI(profile);
    const foir = calcFOIR(profile);
    const annualIncome = (Number(profile.monthlyIncome) || 0) * 12;
    const { score, breakdown } = sponsorStrengthScore(profile);

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
        // Approval % — strength score with small head-room bonuses.
        let pct = Math.round(score * 0.95);
        if (Number(profile.monthlyIncome) >= bank.minIncome * 2) pct += 3;
        if (Number(profile.cibilScore) >= bank.minCibil + 50) pct += 3;
        pct = Math.min(97, Math.max(5, pct));
        eligible.push({ bank, interestRate, estLoan, approvalPct: pct, approvalBand: approvalProbability(pct), reasons: [] });
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
    };
}
