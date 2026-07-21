// FOIR — Fixed Obligation to Income Ratio
// FOIR = Existing EMI ÷ Monthly Income × 100
// Returned as a percentage number (0–100). When there is no income but there
// is an EMI, the obligation ratio is treated as a full 100%.

export function calcFOIR({ existingEmi = 0, monthlyIncome = 0 } = {}) {
    const income = Number(monthlyIncome) || 0;
    const emi = Math.max(0, Number(existingEmi) || 0);
    if (income <= 0) return emi > 0 ? 100 : 0;
    const foir = (emi / income) * 100;
    return Math.min(100, Math.round(foir * 100) / 100);
}
