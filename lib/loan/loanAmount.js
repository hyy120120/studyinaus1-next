// Loan amount estimation per bank — EMI capacity converted to principal
// through the real annuity formula, capped by the bank's income multiplier.

import { principalFromEmi } from "./interestCalculator";

// Eligible EMI = bank's DPI share (%) × sponsor's disposable income.
export function eligibleMonthlyEmi({ dpi = 0, bank } = {}) {
    const freeIncome = Math.max(0, Number(dpi) || 0);
    const share = Number(bank?.maxDpiPercent) || 0;
    return Math.round((freeIncome * share) / 100);
}

// Estimated sanctionable loan for this bank & sponsor.
//   emiBased        = principal the eligible EMI can service at the quoted
//                     rate over the bank's maximum tenure (real PMT inverse)
//   multiplierBased = bank.loanMultiplier × sponsor ANNUAL income (policy cap)
// Result = the smaller of the two, rounded down to the nearest ₹1,000.
export function estimateLoanAmount({ dpi = 0, annualIncome = 0, interestRate = 0, bank } = {}) {
    const emiCapacity = eligibleMonthlyEmi({ dpi, bank });
    if (emiCapacity <= 0) return 0;
    const emiBased = principalFromEmi(emiCapacity, interestRate, bank?.maxTenureYears ?? 10);
    const annual = Math.max(0, Number(annualIncome) || 0);
    const multiplier = Number(bank?.loanMultiplier) || 0;
    const multiplierBased = annual > 0 && multiplier > 0 ? annual * multiplier : Infinity;
    const amount = Math.min(emiBased, multiplierBased);
    return Math.max(0, Math.floor(amount / 1000) * 1000);
}

// Total asset value of the sponsor (liquid + secured) — used by scoring and
// by banks that insist on collateral.
export function totalAssets({ bankBalance = 0, fixedDeposit = 0, propertyValue = 0, goldValue = 0 } = {}) {
    const sum = (Number(bankBalance) || 0) + (Number(fixedDeposit) || 0) + (Number(propertyValue) || 0) + (Number(goldValue) || 0);
    return Math.max(0, sum);
}

// Compares the loan amount the student ASKED for against what the sponsor's
// income supports. This is the headline answer: "banks will approve this
// much of your requested loan" (and the shortfall, if any).
export function compareAffordability({ requested = 0, estLoan = 0 } = {}) {
    const want = Math.max(0, Number(requested) || 0);
    const can = Math.max(0, Number(estLoan) || 0);
    if (want <= 0) return { requested: 0, approved: can, shortfall: 0, coveredPct: can > 0 ? 100 : 0, verdict: "no_target" };
    const approved = Math.min(want, can);
    const shortfall = want - approved;
    const coveredPct = Math.round((approved / want) * 100);
    const verdict = shortfall <= 0 ? "fully_covered" : coveredPct >= 75 ? "mostly_covered" : coveredPct >= 50 ? "partially_covered" : "shortfall";
    return { requested: want, approved, shortfall, coveredPct, verdict };
}
