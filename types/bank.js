// Data shapes (JSDoc types) for banks and per-bank evaluation results.

/**
 * @typedef {Object} BankRule
 * @property {string} id
 * @property {string} name
 * @property {number} minIncome          minimum monthly income (₹)
 * @property {number} minCibil           minimum CIBIL score
 * @property {number} maxFoir            maximum FOIR (%)
 * @property {number} maxDpiPercent      share of DPI usable for EMI (%)
 * @property {number} minItrYears        minimum years of filed ITR
 * @property {string[]} acceptedOccupations
 * @property {boolean} collateralRequired
 * @property {number} minInterest        annual interest floor (%)
 * @property {number} maxInterest        annual interest ceiling (%)
 * @property {number} maxTenureYears
 * @property {number} loanMultiplier     loan cap as × annual income
 */

/**
 * @typedef {Object} BankMatch
 * @property {BankRule} bank
 * @property {number} interestRate       quoted rate for this sponsor (%)
 * @property {number} estLoan            estimated sanctionable amount (₹)
 * @property {number} approvalPct        estimated approval chance (0-100)
 * @property {{key:string,label:string,minScore:number}} approvalBand
 * @property {string[]} reasons          rejection reasons (empty when eligible)
 */

export {};
