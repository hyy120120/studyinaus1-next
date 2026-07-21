"use client";

// Sponsor financial profile form — the 15 inputs the loan engine needs.
// Fully controlled: it edits one SponsorProfile object held by the parent.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    RELATIONSHIP_OPTIONS,
    OCCUPATION_OPTIONS,
    COMPANY_TYPE_OPTIONS,
    ITR_YEAR_OPTIONS,
} from "@/constants/weights";

function Field({ label, children, testId }) {
    return (
        <div className="space-y-2" data-testid={testId}>
            <Label className="text-sm font-medium text-secondary">{label}</Label>
            {children}
        </div>
    );
}

export default function SponsorForm({ profile, onChange }) {
    const set = (k, v) => onChange(k, v);
    const annual = Math.round((Number(profile.monthlyIncome) || 0) * 12);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Relationship" testId="sponsor-field-relationship">
                <Select value={profile.relationship} onValueChange={(v) => set("relationship", v)}>
                    <SelectTrigger data-testid="sponsor-select-relationship">
                        <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Occupation" testId="sponsor-field-occupation">
                <Select value={profile.occupation} onValueChange={(v) => set("occupation", v)}>
                    <SelectTrigger data-testid="sponsor-select-occupation">
                        <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                        {OCCUPATION_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Company type" testId="sponsor-field-company-type">
                <Select value={profile.companyType} onValueChange={(v) => set("companyType", v)}>
                    <SelectTrigger data-testid="sponsor-select-company-type">
                        <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                        {COMPANY_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Age" testId="sponsor-field-age">
                <Input type="number" min="18" max="85" value={profile.age}
                    onChange={(e) => set("age", e.target.value)}
                    placeholder="e.g. 52" data-testid="sponsor-input-age" />
            </Field>

            <Field label="Experience (years)" testId="sponsor-field-experience">
                <Input type="number" min="0" max="50" value={profile.experienceYears}
                    onChange={(e) => set("experienceYears", e.target.value)}
                    placeholder="e.g. 20" data-testid="sponsor-input-experience" />
            </Field>

            <Field label="Monthly income (₹)" testId="sponsor-field-monthly-income">
                <Input type="number" min="0" value={profile.monthlyIncome}
                    onChange={(e) => set("monthlyIncome", e.target.value)}
                    placeholder="e.g. 65000" data-testid="sponsor-input-monthly-income" />
            </Field>

            <Field label="Annual income (auto)" testId="sponsor-field-annual-income">
                <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted text-sm text-secondary"
                    data-testid="sponsor-annual-income">
                    {annual > 0 ? `₹${annual.toLocaleString("en-IN")}` : "—"}
                </div>
            </Field>

            <Field label="Existing EMI (₹/month)" testId="sponsor-field-existing-emi">
                <Input type="number" min="0" value={profile.existingEmi}
                    onChange={(e) => set("existingEmi", e.target.value)}
                    placeholder="0 if none" data-testid="sponsor-input-existing-emi" />
            </Field>

            <Field label="Household expenses (₹/month)" testId="sponsor-field-household-expenses">
                <Input type="number" min="0" value={profile.householdExpenses}
                    onChange={(e) => set("householdExpenses", e.target.value)}
                    placeholder="e.g. 25000" data-testid="sponsor-input-household-expenses" />
            </Field>

            <Field label="Other obligations (₹/month)" testId="sponsor-field-other-obligations">
                <Input type="number" min="0" value={profile.otherObligations}
                    onChange={(e) => set("otherObligations", e.target.value)}
                    placeholder="0 if none" data-testid="sponsor-input-other-obligations" />
            </Field>

            <Field label="Bank balance (₹)" testId="sponsor-field-bank-balance">
                <Input type="number" min="0" value={profile.bankBalance}
                    onChange={(e) => set("bankBalance", e.target.value)}
                    placeholder="e.g. 300000" data-testid="sponsor-input-bank-balance" />
            </Field>

            <Field label="Fixed deposit (₹)" testId="sponsor-field-fixed-deposit">
                <Input type="number" min="0" value={profile.fixedDeposit}
                    onChange={(e) => set("fixedDeposit", e.target.value)}
                    placeholder="e.g. 500000" data-testid="sponsor-input-fixed-deposit" />
            </Field>

            <Field label="Property value (₹)" testId="sponsor-field-property-value">
                <Input type="number" min="0" value={profile.propertyValue}
                    onChange={(e) => set("propertyValue", e.target.value)}
                    placeholder="0 if none" data-testid="sponsor-input-property-value" />
            </Field>

            <Field label="Gold value (₹)" testId="sponsor-field-gold-value">
                <Input type="number" min="0" value={profile.goldValue}
                    onChange={(e) => set("goldValue", e.target.value)}
                    placeholder="0 if none" data-testid="sponsor-input-gold-value" />
            </Field>

            <Field label="CIBIL score" testId="sponsor-field-cibil">
                <Input type="number" min="300" max="900" value={profile.cibilScore}
                    onChange={(e) => set("cibilScore", e.target.value)}
                    placeholder="300 – 900" data-testid="sponsor-input-cibil" />
            </Field>

            <Field label="Years of ITR filed" testId="sponsor-field-itr">
                <Select value={profile.itrYears} onValueChange={(v) => set("itrYears", v)}>
                    <SelectTrigger data-testid="sponsor-select-itr">
                        <SelectValue placeholder="Select ITR years" />
                    </SelectTrigger>
                    <SelectContent>
                        {ITR_YEAR_OPTIONS.map((y) => (
                            <SelectItem key={y} value={y}>{y} year{y === "1" ? "" : "s"}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
        </div>
    );
}
