"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { computeScore } from "@/lib/scoring";
import { db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import { validateCalculatorStep, validateCalculatorForm } from "@/lib/validation";

const STEPS = [
    "Personal",
    "Academic",
    "Work",
    "English",
    "Income & Proof",
    "Financials",
    "Visa History",
];

const INITIAL = {
    full_name: "",
    email: "",
    phone: "",
    age: 22,
    nationality: "Indian",
    highest_qualification: "Bachelors",
    field_of_study: "",
    grade_percentage: 70,
    year_of_completion: new Date().getFullYear() - 1,
    gap_years: 0,
    work_experience_years: 0,
    work_relevant_to_course: false,
    current_job_title: "",
    english_test: "IELTS",
    english_score: 6.5,
    english_no_band_below: 6.0,
    intended_course: "",
    intended_university: "",
    intake_year: new Date().getFullYear() + 1,
    sponsor_relationship: "Parents",
    annual_family_income_inr: 1000000,
    income_proof_available: true,
    liquid_funds_inr: 2500000,
    loan_sanctioned_inr: 2000000,
    property_assets_inr: 0,
    previous_visa_refusal: false,
    refusal_country: "",
    refusal_reason: "",
    prior_australia_visa: false,
    character_declaration: false,
    health_declaration: false,
};

function Field({ label, children, hint, error, testId }) {
    return (
        <div className="space-y-2" data-testid={testId}>
            <Label className="text-sm font-medium text-secondary">{label}</Label>
            {children}
            {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
        </div>
    );
}

export default function CalculatorClient() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

    const goNext = () => {
        const stepErrors = validateCalculatorStep(step, form);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            toast.error("Please fix the highlighted fields before continuing.");
            return;
        }
        setErrors({});
        setStep((s) => s + 1);
    };

    const submit = async () => {
        const allErrors = validateCalculatorForm(form);
        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors);
            toast.error("Please fix the highlighted fields before submitting.");
            return;
        }
        setSubmitting(true);
        try {
            const scoring = computeScore(form);
            const created_at = new Date().toISOString();
            const result = { form, ...scoring, created_at };

            let id;
            if (isFirebaseConfigured) {
                const ref = await addDoc(collection(db, COLLECTIONS.VISA_APPLICATIONS), {
                    ...result,
                    created_at: serverTimestamp(),
                });
                id = ref.id;
            } else {
                id = `local-${Date.now()}`;
            }

            const data = { id, ...result };
            sessionStorage.setItem("gsa_last_result", JSON.stringify(data));
            router.push(`/result/${id}`);
        } catch (e) {
            toast.error(e?.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div data-testid="calculator-page" className="bg-background min-h-screen">
            <section className="gsa-container pt-12 md:pt-16 pb-8">
                <div className="max-w-3xl mx-auto">
                    <div className="gsa-overline mb-3">Visa Probability Calculator</div>
                    <h1 className="gsa-h2 mb-2">Step {step + 1} of {STEPS.length} — {STEPS[step]}</h1>
                    <p className="text-muted-foreground text-sm">All your answers stay private. We use them only to compute your score.</p>

                    {step === 0 && (
                        <div className="mt-6 text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/40 pl-4">
                            <p className="mb-3">
                                This is a 4-minute readiness check for the Australian Subclass 500 (Student) visa.
                                We score your profile across six dimensions — academics, work experience, English
                                proficiency, financial capacity, visa history, and personal factors including age
                                and course intent.
                            </p>
                            <p>
                                Note: the DHA's current 12-month living-cost benchmark for a primary applicant is
                                AUD 29,710 (effective 10 May 2024) — plus tuition and travel. Nothing here is a
                                guarantee — only the DHA can grant a visa — but a high score strongly correlates
                                with applicants who go on to lodge successful applications. A low score is equally
                                useful: it tells you exactly where to invest effort before lodging.
                            </p>
                        </div>
                    )}

                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden mt-6" data-testid="progress-bar">
                        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </section>

            <section className="gsa-container pb-20">
                <div className="max-w-3xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="bg-white p-8 md:p-12 rounded-2xl border border-border shadow-sm"
                        >
                            {step === 0 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Field label="Full name" error={errors.full_name} testId="field-full_name">
                                        <Input data-testid="input-full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Riya Patel" />
                                    </Field>
                                    <Field label="Email" error={errors.email} testId="field-email">
                                        <Input data-testid="input-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
                                    </Field>
                                    <Field label="Phone" error={errors.phone} testId="field-phone">
                                        <Input data-testid="input-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98XXXXXXXX" />
                                    </Field>
                                    <Field label="Age" error={errors.age} testId="field-age">
                                        <Input data-testid="input-age" type="number" value={form.age} onChange={(e) => set("age", +e.target.value)} />
                                    </Field>
                                    <Field label="Nationality" error={errors.nationality} testId="field-nationality">
                                        <Input data-testid="input-nationality" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
                                    </Field>
                                    <Field label="Intended intake year" error={errors.intake_year} testId="field-intake_year">
                                        <Input data-testid="input-intake_year" type="number" value={form.intake_year} onChange={(e) => set("intake_year", +e.target.value)} />
                                    </Field>
                                    <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                                        <Field label="Intended course" error={errors.intended_course} testId="field-intended_course">
                                            <Input data-testid="input-intended_course" value={form.intended_course} onChange={(e) => set("intended_course", e.target.value)} placeholder="Master of Data Science" />
                                        </Field>
                                        <Field label="Intended university (optional)" testId="field-intended_university">
                                            <Input data-testid="input-intended_university" value={form.intended_university} onChange={(e) => set("intended_university", e.target.value)} placeholder="UNSW Sydney" />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Field label="Highest qualification" error={errors.highest_qualification} testId="field-highest_qualification">
                                        <Select value={form.highest_qualification} onValueChange={(v) => set("highest_qualification", v)}>
                                            <SelectTrigger data-testid="select-highest_qualification"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["High School", "Diploma", "Bachelors", "Masters", "PhD"].map((q) => (
                                                    <SelectItem key={q} value={q}>{q}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Field of study" error={errors.field_of_study} testId="field-field_of_study">
                                        <Input data-testid="input-field_of_study" value={form.field_of_study} onChange={(e) => set("field_of_study", e.target.value)} placeholder="Computer Science" />
                                    </Field>
                                    <Field label="Grade / Percentage" hint="Enter overall % (CGPA × 9.5 for 10-scale)" error={errors.grade_percentage} testId="field-grade_percentage">
                                        <Input data-testid="input-grade_percentage" type="number" step="0.1" value={form.grade_percentage} onChange={(e) => set("grade_percentage", +e.target.value)} />
                                    </Field>
                                    <Field label="Year of completion" error={errors.year_of_completion} testId="field-year_of_completion">
                                        <Input data-testid="input-year_of_completion" type="number" value={form.year_of_completion} onChange={(e) => set("year_of_completion", +e.target.value)} />
                                    </Field>
                                    <Field label="Gap years since last study" error={errors.gap_years} testId="field-gap_years">
                                        <Input data-testid="input-gap_years" type="number" value={form.gap_years} onChange={(e) => set("gap_years", +e.target.value)} />
                                    </Field>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Field label="Years of work experience" error={errors.work_experience_years} testId="field-work_experience_years">
                                        <Input data-testid="input-work_experience_years" type="number" step="0.5" value={form.work_experience_years} onChange={(e) => set("work_experience_years", +e.target.value)} />
                                    </Field>
                                    <Field label="Current job title (optional)" error={errors.current_job_title} testId="field-current_job_title">
                                        <Input data-testid="input-current_job_title" value={form.current_job_title} onChange={(e) => set("current_job_title", e.target.value)} placeholder="Software Engineer" />
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Is your work relevant to the intended course?" testId="field-work_relevant_to_course">
                                            <RadioGroup value={String(form.work_relevant_to_course)} onValueChange={(v) => set("work_relevant_to_course", v === "true")} className="flex gap-6">
                                                <div className="flex items-center gap-2"><RadioGroupItem value="true" id="wr-yes" data-testid="radio-work_relevant-yes" /><Label htmlFor="wr-yes">Yes</Label></div>
                                                <div className="flex items-center gap-2"><RadioGroupItem value="false" id="wr-no" data-testid="radio-work_relevant-no" /><Label htmlFor="wr-no">No</Label></div>
                                            </RadioGroup>
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Field label="English test taken" error={errors.english_test} testId="field-english_test">
                                        <Select value={form.english_test} onValueChange={(v) => set("english_test", v)}>
                                            <SelectTrigger data-testid="select-english_test"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["IELTS", "PTE", "TOEFL", "Duolingo", "None"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Overall score / band" error={errors.english_score} testId="field-english_score">
                                        <Input data-testid="input-english_score" type="number" step="0.1" value={form.english_score} onChange={(e) => set("english_score", +e.target.value)} />
                                    </Field>
                                    <Field label="No band below (IELTS only)" testId="field-english_no_band_below">
                                        <Input data-testid="input-english_no_band_below" type="number" step="0.1" value={form.english_no_band_below || 0} onChange={(e) => set("english_no_band_below", +e.target.value)} />
                                    </Field>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Field label="Who is sponsoring you?" error={errors.sponsor_relationship} testId="field-sponsor_relationship">
                                        <Select value={form.sponsor_relationship} onValueChange={(v) => set("sponsor_relationship", v)}>
                                            <SelectTrigger data-testid="select-sponsor_relationship"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["Self", "Parents", "Spouse", "Sibling", "Other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Annual family income (INR)" error={errors.annual_family_income_inr} testId="field-annual_family_income_inr">
                                        <Input data-testid="input-annual_family_income_inr" type="number" value={form.annual_family_income_inr} onChange={(e) => set("annual_family_income_inr", +e.target.value)} />
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Do you have income proof (3 yrs ITR / Form 16 / salary slips)?" testId="field-income_proof_available">
                                            <RadioGroup value={String(form.income_proof_available)} onValueChange={(v) => set("income_proof_available", v === "true")} className="flex gap-6">
                                                <div className="flex items-center gap-2"><RadioGroupItem value="true" id="ip-y" data-testid="radio-income_proof-yes" /><Label htmlFor="ip-y">Yes</Label></div>
                                                <div className="flex items-center gap-2"><RadioGroupItem value="false" id="ip-n" data-testid="radio-income_proof-no" /><Label htmlFor="ip-n">No</Label></div>
                                            </RadioGroup>
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Field label="Liquid funds in bank/FDs (INR)" error={errors.liquid_funds_inr} testId="field-liquid_funds_inr">
                                        <Input data-testid="input-liquid_funds_inr" type="number" value={form.liquid_funds_inr} onChange={(e) => set("liquid_funds_inr", +e.target.value)} />
                                    </Field>
                                    <Field label="Education loan sanctioned (INR)" error={errors.loan_sanctioned_inr} testId="field-loan_sanctioned_inr">
                                        <Input data-testid="input-loan_sanctioned_inr" type="number" value={form.loan_sanctioned_inr} onChange={(e) => set("loan_sanctioned_inr", +e.target.value)} />
                                    </Field>
                                    <Field label="Property / other assets (INR)" hint="DHA discounts immovable assets — counted at 40% weight." error={errors.property_assets_inr} testId="field-property_assets_inr">
                                        <Input data-testid="input-property_assets_inr" type="number" value={form.property_assets_inr} onChange={(e) => set("property_assets_inr", +e.target.value)} />
                                    </Field>
                                </div>
                            )}

                            {step === 6 && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Field label="Have you ever been refused a visa (any country)?" testId="field-previous_visa_refusal">
                                            <RadioGroup value={String(form.previous_visa_refusal)} onValueChange={(v) => set("previous_visa_refusal", v === "true")} className="flex gap-6">
                                                <div className="flex items-center gap-2"><RadioGroupItem value="true" id="vr-y" data-testid="radio-prev_refusal-yes" /><Label htmlFor="vr-y">Yes</Label></div>
                                                <div className="flex items-center gap-2"><RadioGroupItem value="false" id="vr-n" data-testid="radio-prev_refusal-no" /><Label htmlFor="vr-n">No</Label></div>
                                            </RadioGroup>
                                        </Field>
                                    </div>
                                    {form.previous_visa_refusal && (
                                        <>
                                            <Field label="Country of refusal" error={errors.refusal_country} testId="field-refusal_country">
                                                <Input data-testid="input-refusal_country" value={form.refusal_country} onChange={(e) => set("refusal_country", e.target.value)} />
                                            </Field>
                                            <Field label="Stated reason for refusal" error={errors.refusal_reason} testId="field-refusal_reason">
                                                <Textarea data-testid="input-refusal_reason" value={form.refusal_reason} onChange={(e) => set("refusal_reason", e.target.value)} placeholder="e.g. GTE concerns, insufficient funds" />
                                            </Field>
                                        </>
                                    )}
                                    <div className="md:col-span-2">
                                        <Field label="Have you ever held an Australian visa before?" testId="field-prior_australia_visa">
                                            <RadioGroup value={String(form.prior_australia_visa)} onValueChange={(v) => set("prior_australia_visa", v === "true")} className="flex gap-6">
                                                <div className="flex items-center gap-2"><RadioGroupItem value="true" id="pa-y" data-testid="radio-prior_au-yes" /><Label htmlFor="pa-y">Yes</Label></div>
                                                <div className="flex items-center gap-2"><RadioGroupItem value="false" id="pa-n" data-testid="radio-prior_au-no" /><Label htmlFor="pa-n">No</Label></div>
                                            </RadioGroup>
                                        </Field>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Field label="Do you meet the character requirement (PIC 4001) — no unresolved criminal convictions and willing to provide a Police Clearance Certificate?" testId="field-character_declaration">
                                            <RadioGroup value={String(form.character_declaration)} onValueChange={(v) => set("character_declaration", v === "true")} className="flex gap-6">
                                                <div className="flex items-center gap-2"><RadioGroupItem value="true" id="ch-y" data-testid="radio-character-yes" /><Label htmlFor="ch-y">Yes</Label></div>
                                                <div className="flex items-center gap-2"><RadioGroupItem value="false" id="ch-n" data-testid="radio-character-no" /><Label htmlFor="ch-n">No / Not sure</Label></div>
                                            </RadioGroup>
                                        </Field>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Field label="Do you meet the health requirement (PIC 4007) — no condition that would prevent an Immigration Medical Examination pass?" testId="field-health_declaration">
                                            <RadioGroup value={String(form.health_declaration)} onValueChange={(v) => set("health_declaration", v === "true")} className="flex gap-6">
                                                <div className="flex items-center gap-2"><RadioGroupItem value="true" id="he-y" data-testid="radio-health-yes" /><Label htmlFor="he-y">Yes</Label></div>
                                                <div className="flex items-center gap-2"><RadioGroupItem value="false" id="he-n" data-testid="radio-health-no" /><Label htmlFor="he-n">No / Not sure</Label></div>
                                            </RadioGroup>
                                        </Field>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center justify-between mt-8">
                        <button
                            className="btn-outline disabled:opacity-40"
                            onClick={() => { setErrors({}); setStep((s) => Math.max(0, s - 1)); }}
                            disabled={step === 0 || submitting}
                            data-testid="back-step-btn"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        {step < STEPS.length - 1 ? (
                            <button
                                className="btn-primary"
                                onClick={goNext}
                                disabled={submitting}
                                data-testid="next-step-btn"
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={submit} disabled={submitting} data-testid="submit-assessment-btn">
                                {submitting ? <><Loader2 className="animate-spin" size={16} /> Generating report…</> : <><CheckCircle2 size={16} /> Get my probability</>}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
