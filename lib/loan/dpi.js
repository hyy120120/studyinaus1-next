// Disposable Personal Income (DPI)
// DPI = Monthly Income − Existing EMI − Household Expenses − Other Obligations
// Always floored at ₹0 — a sponsor can never have negative free cash here.

const toAmount = (v) => Math.max(0, Number(v) || 0);

export function calcDPI({ monthlyIncome = 0, existingEmi = 0, householdExpenses = 0, otherObligations = 0 } = {}) {
    const income = toAmount(monthlyIncome);
    const deductions = toAmount(existingEmi) + toAmount(householdExpenses) + toAmount(otherObligations);
    return income - deductions > 0 ? Math.round(income - deductions) : 0;
}
