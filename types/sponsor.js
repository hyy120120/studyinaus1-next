// Data shapes (JSDoc types) for the Sponsor Loan Eligibility Engine.
// Plain JavaScript only — these typedefs document the objects shared
// between the form, calculators and cards; editors pick them up for
// autocomplete without any TypeScript.

/**
 * @typedef {Object} SponsorProfile
 * @property {string} id                 unique key inside the calculator form
 * @property {string} relationship       key from constants/weights RELATIONSHIP_OPTIONS
 * @property {string} occupation         key from OCCUPATION_OPTIONS
 * @property {string} companyType        key from COMPANY_TYPE_OPTIONS
 * @property {string|number} age
 * @property {string|number} experienceYears
 * @property {string|number} monthlyIncome
 * @property {string|number} existingEmi
 * @property {string|number} householdExpenses
 * @property {string|number} otherObligations
 * @property {string|number} bankBalance
 * @property {string|number} fixedDeposit
 * @property {string|number} propertyValue
 * @property {string|number} goldValue
 * @property {string|number} cibilScore   300–900
 * @property {string} itrYears            "0" | "1" | "2" | "3+"
 */

/**
 * @typedef {Object} SponsorEvaluation
 * @property {number} dpi                 disposable personal income (₹/month)
 * @property {number} foir                fixed obligation to income ratio (%)
 * @property {number} annualIncome
 * @property {number} score               sponsor strength 0–100
 * @property {Object} breakdown           score split by category
 * @property {{key:string,label:string,minScore:number}} sponsorBand
 * @property {Array}  eligible            banks that accept this sponsor
 * @property {Array}  rejected            banks with rejection reasons
 * @property {Object|null} best           top-ranked eligible bank
 */

export {};
