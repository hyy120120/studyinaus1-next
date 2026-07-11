export function calculateEmi(principal, annualRate, tenureYears) {
    const principalValue = Number(principal) || 0;
    const rate = Number(annualRate) || 0;
    const years = Number(tenureYears) || 0;

    if (principalValue <= 0 || rate <= 0 || years <= 0) {
        return {
            monthlyEmi: 0,
            totalInterest: 0,
            totalPayable: 0,
            principal: principalValue,
        };
    }

    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    const emi = principalValue * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);

    return {
        monthlyEmi: Math.round(emi),
        totalInterest: Math.round(emi * months - principalValue),
        totalPayable: Math.round(emi * months),
        principal: principalValue,
    };
}
