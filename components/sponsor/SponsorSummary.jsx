"use client";

// Quick read-out of the sponsor's cash-flow numbers, computed through the
// isolated lib functions — never by hand here.

import { Wallet, Percent, PiggyBank } from "lucide-react";
import { calcDPI } from "@/lib/loan/dpi";
import { calcFOIR } from "@/lib/loan/foir";
import { totalAssets } from "@/lib/loan/loanAmount";

function Tile({ icon: Icon, label, value, testId }) {
    return (
        <div className="rounded-xl border border-border bg-background p-3 text-center" data-testid={testId}>
            <Icon size={16} className="mx-auto text-primary mb-1" />
            <div className="font-display font-black text-lg text-secondary">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
        </div>
    );
}

export default function SponsorSummary({ profile }) {
    const dpi = calcDPI(profile);
    const foir = calcFOIR(profile);
    const assets = totalAssets(profile);

    return (
        <div className="grid grid-cols-3 gap-3" data-testid="sponsor-summary">
            <Tile icon={Wallet} label="Disposable / month" value={`₹${dpi.toLocaleString("en-IN")}`} testId="summary-dpi" />
            <Tile icon={Percent} label="FOIR" value={`${Math.round(foir)}%`} testId="summary-foir" />
            <Tile icon={PiggyBank} label="Total assets" value={assets > 0 ? `₹${assets.toLocaleString("en-IN")}` : "—"} testId="summary-assets" />
        </div>
    );
}
