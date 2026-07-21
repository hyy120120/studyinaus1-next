// Interest maths for the loan engine — the real reducing-balance (PMT)
// formula, never multiplier approximations.

const monthlyRate = (annualRatePct) => (Number(annualRatePct) || 0) / 1200;

// Monthly EMI for a given principal:  E = P·r·(1+r)^n / ((1+r)^n − 1)
export function monthlyEmi(principal, annualRatePct, tenureYears) {
    const p = Math.max(0, Number(principal) || 0);
    const n = Math.max(0, Math.round((Number(tenureYears) || 0) * 12));
    if (p <= 0 || n <= 0) return 0;
    const r = monthlyRate(annualRatePct);
    if (r === 0) return p / n;
    const pow = Math.pow(1 + r, n);
    return (p * r * pow) / (pow - 1);
}

// Largest principal supportable by a given EMI — the exact inverse of the
// PMT formula:  P = E·((1+r)^n − 1) / (r·(1+r)^n)
export function principalFromEmi(emi, annualRatePct, tenureYears) {
    const e = Math.max(0, Number(emi) || 0);
    const n = Math.max(0, Math.round((Number(tenureYears) || 0) * 12));
    if (e <= 0 || n <= 0) return 0;
    const r = monthlyRate(annualRatePct);
    if (r === 0) return e * n;
    const pow = Math.pow(1 + r, n);
    return (e * (pow - 1)) / (r * pow);
}

// Interest rate for a sponsor, interpolated inside the bank's band:
// a perfect profile (score 100) earns the bank's minimum rate, a borderline
// profile (score 0) the maximum.
export function estimatedRate(minRate, maxRate, qualityScore) {
    const lo = Number(minRate) || 0;
    const hi = Math.max(lo, Number(maxRate) || lo);
    const q = Math.min(100, Math.max(0, Number(qualityScore) || 0)) / 100;
    return Math.round((hi - (hi - lo) * q) * 100) / 100;
}
