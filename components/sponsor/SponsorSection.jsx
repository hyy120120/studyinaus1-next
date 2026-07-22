"use client";

// SponsorSection — the mountable Sponsor Loan Eligibility Engine.
// Drop it into any step of an existing form:
//
//   <SponsorSection value={form.loan_sponsors} onChange={(v) => set("loan_sponsors", v)} />
//
// `value` is the array of SponsorProfile objects persisted with the rest of
// the form — no Context, no Redux, plain lifted state.

import { useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import { BANKS } from "@/data/banks";
import { evaluateSponsorAgainstBanks } from "@/lib/loan/bankMatcher";
import SponsorForm from "./SponsorForm";
import SponsorSummary from "./SponsorSummary";
import LoanEligibilityCard from "./LoanEligibilityCard";
import BankRecommendation from "./BankRecommendation";
import SponsorList from "./SponsorList";

export function createSponsorProfile() {
    return {
        id: `sp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        relationship: "father",
        occupation: "",
        companyType: "",
        age: "",
        experienceYears: "",
        monthlyIncome: "",
        existingEmi: "",
        householdExpenses: "",
        otherObligations: "",
        bankBalance: "",
        fixedDeposit: "",
        propertyValue: "",
        goldValue: "",
        cibilScore: "",
        itrYears: "0",
    };
}

export default function SponsorSection({ value = [], onChange, requestedLoan = 0 }) {
    const profiles = value.length > 0 ? value : [createSponsorProfile()];
    const [activeId, setActiveId] = useState(profiles[0].id);
    const active = profiles.find((p) => p.id === activeId) || profiles[0];

    // Evaluate every profile once (strength score feeds the chips), the
    // active profile drives the full bank comparison below.
    const evaluations = useMemo(() => {
        const map = {};
        profiles.forEach((p) => {
            map[p.id] = evaluateSponsorAgainstBanks(p, BANKS, requestedLoan);
        });
        return map;
    }, [profiles, requestedLoan]);
    const activeEvaluation = evaluations[active.id];
    const chipScores = useMemo(() => {
        const s = {};
        Object.entries(evaluations).forEach(([id, ev]) => {
            s[id] = ev.score;
        });
        return s;
    }, [evaluations]);

    const update = (id, field, fieldValue) => {
        onChange(profiles.map((p) => (p.id === id ? { ...p, [field]: fieldValue } : p)));
    };
    const add = () => {
        const fresh = createSponsorProfile();
        onChange([...profiles, fresh]);
        setActiveId(fresh.id);
    };
    const remove = (id) => {
        const next = profiles.filter((p) => p.id !== id);
        onChange(next.length > 0 ? next : [createSponsorProfile()]);
        if (id === activeId) setActiveId((next.find((p) => p.id !== id) || next[0])?.id);
    };

    return (
        <section className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-5" data-testid="sponsor-loan-engine">
            <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <Landmark size={18} />
                </span>
                <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-secondary">
                        Sponsor loan eligibility engine
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Estimate how much education loan your sponsor can support and which banks are most likely to approve it.
                    </p>
                </div>
            </div>

            <SponsorList
                profiles={profiles}
                activeId={active.id}
                scores={chipScores}
                onSelect={setActiveId}
                onAdd={add}
                onRemove={remove}
            />

            <SponsorForm
                profile={active}
                onChange={(field, v) => update(active.id, field, v)}
            />

            <SponsorSummary profile={active} />

            <LoanEligibilityCard evaluation={activeEvaluation} />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-secondary">Bank recommendations</h4>
                    <span className="text-xs text-muted-foreground" data-testid="bank-match-count">
                        {activeEvaluation.eligible.length} of {BANKS.length} banks match
                    </span>
                </div>
                {activeEvaluation.eligible.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="eligible-bank-list">
                        {activeEvaluation.eligible.map((m) => (
                            <BankRecommendation key={m.bank.id} match={m} />
                        ))}
                    </div>
                )}
                {activeEvaluation.rejected.length > 0 && (
                    <details className="rounded-xl border border-border bg-muted/30 p-3" data-testid="rejected-bank-list">
                        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground select-none">
                            {activeEvaluation.rejected.length} bank{activeEvaluation.rejected.length > 1 ? "s" : ""} not matching — see why
                        </summary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {activeEvaluation.rejected.map((m) => (
                                <BankRecommendation key={m.bank.id} match={m} />
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </section>
    );
}
