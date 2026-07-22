"use client";

// SponsorSection — SIMPLE mountable loan eligibility estimate.
//
// You ask for exactly two things in the surrounding form:
//   1. the loan amount needed (₹)        → requestedLoan prop
//   2. which sponsor backs the loan      → sponsorId prop (from the sponsor
//                                          income step, sponsors array)
// Everything else (income, occupation, ITR) is read from that sponsor's
// existing data. CIBIL and existing EMIs are NOT asked — CIBIL-based bank
// rules are skipped and the CIBIL part of the strength score is kept
// neutral, so every number shown is an APPROXIMATION.
//
//   <SponsorSection
//     sponsors={form.sponsors.filter((s) => s.applicable)}
//     sponsorId={form.loan_sponsor_id}
//     onSelectSponsor={(v) => set("loan_sponsor_id", v)}
//     requestedLoan={Number(form.loan_amount_inr) || 0}
//     funds={{ bankBalance, fixedDeposit, goldValue }}
//   />

import { useMemo } from "react";
import { Landmark, Info } from "lucide-react";
import { BANKS } from "@/data/banks";
import { evaluateSponsorAgainstBanks } from "@/lib/loan/bankMatcher";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import LoanEligibilityCard from "./LoanEligibilityCard";

// Map the sponsor step's occupation labels onto the engine's occupation keys.
const EMPLOYMENT_TYPE_MAP = {
    "Salaried": "salaried",
    "Business": "business",
    "Agriculture": "agriculturist",
    "Retired": "retired",
    "Other": "other",
};

// Turn a sponsor record from the Sponsor Income step + the family's fund
// figures into the engine's SponsorProfile shape.
export function buildProfileFromSponsor(sponsor = {}, funds = {}) {
    const annual = Number(sponsor.annual_income_inr) || 0;
    return {
        relationship: (sponsor.relation || "").toLowerCase(),
        occupation: EMPLOYMENT_TYPE_MAP[sponsor.employment_type] || "other",
        monthlyIncome: annual > 0 ? Math.round(annual / 12) : 0,
        // ITR flags → years of ITR, approximated.
        itrYears: sponsor.itr_3yr ? "3+" : sponsor.itr_timely ? "2" : "0",
        // Assets are taken from the funds declared in this step.
        bankBalance: Number(funds.bankBalance) || 0,
        fixedDeposit: Number(funds.fixedDeposit) || 0,
        goldValue: Number(funds.goldValue) || 0,
        propertyValue: Number(funds.propertyValue) || 0,
        // NOT asked — approximate mode:
        existingEmi: 0,
        householdExpenses: 0,
        otherObligations: 0,
        cibilScore: 0,
    };
}

export default function SponsorSection({ sponsors = [], sponsorId, onSelectSponsor, requestedLoan = 0, funds = {} }) {
    const sponsor = sponsors.find((s) => s.id === sponsorId) || sponsors[0] || null;
    const evaluation = useMemo(
        () => (sponsor ? evaluateSponsorAgainstBanks(buildProfileFromSponsor(sponsor, funds), BANKS, requestedLoan) : null),
        [sponsor, funds, requestedLoan],
    );

    return (
        <section className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-5" data-testid="sponsor-loan-engine">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <Landmark size={18} />
                    </span>
                    <div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-secondary">
                            Your estimated loan eligibility
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Estimated from your sponsor's income (entered in the Sponsor Income step) against your requested loan amount.
                        </p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 shrink-0" data-testid="approx-chip">
                    <Info size={11} /> Approximate
                </span>
            </div>

            {sponsors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground" data-testid="sponsor-empty-notice">
                    No sponsor selected yet. Add a sponsor in the <span className="font-semibold text-secondary">Sponsor Income</span> step first, then come back here to see the estimate.
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-secondary">Loan sponsor</Label>
                        <Select value={sponsor?.id || ""} onValueChange={onSelectSponsor}>
                            <SelectTrigger data-testid="sponsor-select-loan">
                                <SelectValue placeholder="Select sponsor" />
                            </SelectTrigger>
                            <SelectContent>
                                {sponsors.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.relation}{s.annual_income_inr ? ` — ₹${Number(s.annual_income_inr).toLocaleString("en-IN")}/yr` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {evaluation && (
                        <>
                            <LoanEligibilityCard evaluation={evaluation} />
                            <p className="text-[11px] text-muted-foreground">
                                Approximation only — CIBIL score and existing EMIs are not verified here, and the
                                final sanction always depends on the bank's own assessment.
                            </p>
                        </>
                    )}
                </>
            )}
        </section>
    );
}
