"use client";

// Headline card for the loan engine: sponsor strength, disposable income,
// FOIR, eligible EMI, best estimated loan amount and approval probability.

import { Gauge, BadgeIndianRupee, Banknote, TrendingUp } from "lucide-react";

const BAND_STYLES = {
    very_high: "bg-green-100 text-green-800 border-green-300",
    high: "bg-emerald-100 text-emerald-800 border-emerald-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-orange-100 text-orange-800 border-orange-300",
    very_low: "bg-red-100 text-red-800 border-red-300",
};

function Stat({ label, value, testId }) {
    return (
        <div className="text-center">
            <div className="font-display font-black text-lg sm:text-xl text-secondary" data-testid={testId}>{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
        </div>
    );
}

export default function LoanEligibilityCard({ evaluation }) {
    if (!evaluation) return null;
    const { score, breakdown, dpi, foir, sponsorBand, best } = evaluation;
    const bandStyle = BAND_STYLES[sponsorBand?.key] || BAND_STYLES.medium;
    const eligibleEmi = best ? Math.max(...evaluation.eligible.map((e) => Math.round((dpi * e.bank.maxDpiPercent) / 100))) : 0;

    return (
        <div className="rounded-xl border border-border bg-muted/40 p-4 sm:p-5 space-y-4" data-testid="loan-eligibility-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Gauge size={18} className="text-primary" />
                    <span className="font-bold text-secondary text-sm sm:text-base">Sponsor strength</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${bandStyle}`}
                    data-testid="sponsor-approval-band">
                    <TrendingUp size={12} />
                    Approval probability: {sponsorBand?.label || "—"}
                </span>
            </div>

            {/* Strength score bar */}
            <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Score</span>
                    <span className="font-bold text-secondary" data-testid="sponsor-score">{score}/100</span>
                </div>
                <div className="h-2.5 rounded-full bg-border overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        data-testid="sponsor-score-bar"
                    />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Income {breakdown.income}/30 · CIBIL {breakdown.cibil}/20 · Assets {breakdown.assets}/20 ·
                    Occupation {breakdown.occupation}/10 · ITR {breakdown.itr}/10 · FOIR {breakdown.foir}/10
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
                <Stat label="Disposable income" value={`₹${dpi.toLocaleString("en-IN")}`} testId="card-dpi" />
                <Stat label="FOIR" value={`${Math.round(foir)}%`} testId="card-foir" />
                <Stat label="Max eligible EMI" value={eligibleEmi > 0 ? `₹${eligibleEmi.toLocaleString("en-IN")}` : "—"} testId="card-eligible-emi" />
                <Stat label="Est. loan amount" value={best ? `₹${best.estLoan.toLocaleString("en-IN")}` : "—"} testId="card-est-loan" />
            </div>

            {best ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5" data-testid="card-best-bank">
                    <BadgeIndianRupee size={13} className="text-primary" />
                    Best estimate: <Banknote size={13} className="text-primary" />
                    <span className="font-semibold text-secondary">
                        {best.bank.name} — ₹{best.estLoan.toLocaleString("en-IN")} at {best.interestRate}% for up to {best.bank.maxTenureYears} years
                    </span>
                </p>
            ) : (
                <p className="text-xs text-muted-foreground" data-testid="card-no-bank">
                    No bank currently matches this profile — see the reasons in the bank list below and try improving CIBIL, income or reducing existing EMIs.
                </p>
            )}
        </div>
    );
}
