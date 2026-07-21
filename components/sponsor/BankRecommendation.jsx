"use client";

// One bank recommendation card: name, interest rate, estimated loan,
// maximum tenure, approval %, eligibility status and rejection reason(s).

import { Landmark, CheckCircle2, XCircle, Clock } from "lucide-react";

const BAND_STYLES = {
    very_high: "bg-green-100 text-green-800 border-green-300",
    high: "bg-emerald-100 text-emerald-800 border-emerald-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-orange-100 text-orange-800 border-orange-300",
    very_low: "bg-red-100 text-red-800 border-red-300",
};

export default function BankRecommendation({ match }) {
    const { bank, interestRate, estLoan, approvalPct, approvalBand, reasons = [] } = match;
    const eligible = reasons.length === 0;
    const bandStyle = BAND_STYLES[approvalBand?.key] || BAND_STYLES.medium;

    return (
        <div
            className={`rounded-xl border p-4 space-y-3 ${eligible ? "border-border bg-background" : "border-border/60 bg-muted/30 opacity-80"}`}
            data-testid={`bank-card-${bank.id}`}
            data-eligible={eligible}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Landmark size={16} className={`shrink-0 ${eligible ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-bold text-sm text-secondary truncate">{bank.name}</span>
                </div>
                {eligible ? (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shrink-0 ${bandStyle}`}
                        data-testid={`bank-status-${bank.id}`}>
                        <CheckCircle2 size={11} /> {approvalBand?.label}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 shrink-0"
                        data-testid={`bank-status-${bank.id}`}>
                        <XCircle size={11} /> Not eligible
                    </span>
                )}
            </div>

            {eligible ? (
                <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="font-display font-black text-base text-primary" data-testid={`bank-rate-${bank.id}`}>
                                {interestRate}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Interest p.a.</div>
                        </div>
                        <div>
                            <div className="font-display font-black text-base text-secondary" data-testid={`bank-loan-${bank.id}`}>
                                ₹{estLoan.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. loan</div>
                        </div>
                        <div>
                            <div className="font-display font-black text-base text-secondary inline-flex items-center gap-1" data-testid={`bank-tenure-${bank.id}`}>
                                <Clock size={13} /> {bank.maxTenureYears}y
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Max tenure</div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                            <span>Approval chance</span>
                            <span className="font-bold text-secondary" data-testid={`bank-approval-${bank.id}`}>{approvalPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${approvalPct}%` }} />
                        </div>
                    </div>
                </>
            ) : (
                <ul className="space-y-1 text-xs text-muted-foreground" data-testid={`bank-reasons-${bank.id}`}>
                    {reasons.map((r, i) => (
                        <li key={i} className="flex gap-1.5">
                            <span className="text-destructive">•</span>
                            <span>{r}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
