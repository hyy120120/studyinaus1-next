"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CalendarCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import { validateBooking } from "@/lib/validation";
import { POLICY_VERSIONS } from "@/lib/policies";

const START_TIMELINES = [
    { value: "1_month", label: "Within 1 month" },
    { value: "6_months", label: "Within 6 months" },
    { value: "1_year", label: "Within 1 year" },
    { value: "2_years", label: "Within 2 years" },
];

const STUDY_LEVELS = [
    { value: "undergraduate", label: "Undergraduate" },
    { value: "masters", label: "Masters" },
    { value: "doctorate", label: "Doctorate" },
];

const FUNDING_SOURCES = [
    { value: "self", label: "Self-funded" },
    { value: "parents", label: "Parents / Family" },
    { value: "education_loan", label: "Education loan" },
    { value: "scholarship", label: "Scholarship" },
    { value: "employer_sponsorship", label: "Employer sponsorship" },
    { value: "other", label: "Other" },
];

const INITIAL = {
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    start_timeline: "",
    counselling_mode: "",
    study_level: "",
    funding_source: "",
    privacy_consent: false,
    terms_consent: false,
};

function Field({ label, children, error }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-secondary">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
        </div>
    );
}

export default function BookingClient() {
    const [form, setForm] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        const fieldErrors = validateBooking(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before submitting.");
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            if (!isFirebaseConfigured) {
                throw new Error("Booking isn't connected yet — set up Firebase to enable this form.");
            }
            const context = await fetch("/api/client-context", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}).catch(() => ({}));
            const consent = {
                status: "accepted",
                accepted_at: new Date().toISOString(),
                privacy_policy_version: POLICY_VERSIONS.privacy,
                terms_version: POLICY_VERSIONS.terms,
                consent_policy_version: POLICY_VERSIONS.consent,
                privacy_consent: form.privacy_consent,
                terms_consent: form.terms_consent,
                ip_address: context.ipAddress || null,
            };
            const bookingRef = await addDoc(collection(db, COLLECTIONS.COUNSELLING_BOOKINGS), {
                ...form, consent,
                created_at: serverTimestamp(),
            });
            await addDoc(collection(db, COLLECTIONS.CONSENT_AUDIT_LOGS), {
                source: "book_counselling",
                user_id: bookingRef.id,
                applicant_name: `${form.first_name} ${form.last_name}`.trim(),
                email: form.email,
                mobile: form.mobile,
                ip_address: consent.ip_address,
                consent_status: "accepted",
                privacy_policy_version: POLICY_VERSIONS.privacy,
                terms_version: POLICY_VERSIONS.terms,
                accepted_at: serverTimestamp(),
                last_updated_at: serverTimestamp(),
            });
            setSubmitted(true);
            toast.success("Booking received! A counselor will reach out shortly.");
        } catch (err) {
            toast.error(err?.message || "Could not submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div data-testid="book-counselling-page">
            <section className="bg-secondary text-white">
                <div className="gsa-container py-10 md:py-14 max-w-5xl">
                    <Reveal className="gsa-overline text-primary mb-4">Free Counselling</Reveal>
                    <Reveal delay={0.08}>
                        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight">
                            Book a free session with our counsellors.
                        </h1>
                    </Reveal>
                    <Reveal delay={0.16}>
                        <p className="mt-5 text-white/75 max-w-xl">
                            Tell us a bit about your plans and preferences — we'll get back to you to schedule a
                            session that works for you.
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="py-10 md:py-14">
                <div className="gsa-container max-w-6xl grid items-start gap-8 lg:grid-cols-5">
                    <Reveal className="space-y-5 lg:col-span-2">
                        <div className="surface-card p-7">
                            <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary"><ShieldCheck size={23} /></div>
                            <h2 className="font-display text-2xl font-bold text-secondary">Plan your next step with clarity.</h2>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Our counsellors review your study goals, course direction, finances and timeline so you can make confident decisions about Australia.</p>
                        </div>
                        <div className="rounded-2xl bg-secondary p-7 text-white">
                            <div className="gsa-overline text-primary">What to expect</div>
                            <ul className="mt-4 space-y-3 text-sm text-white/80"><li>• A free, personalised discussion</li><li>• Clear advice on courses and intake timing</li><li>• Practical guidance for your visa pathway</li></ul>
                        </div>
                    </Reveal>
                    <div className="lg:col-span-3">
                    {submitted ? (
                        <Reveal className="surface-card p-10 md:p-16 text-center" data-testid="booking-success">
                            <CalendarCheck className="text-primary mx-auto mb-4" size={40} strokeWidth={1.5} />
                            <h2 className="gsa-h2 mb-3">Thanks, we've got your details!</h2>
                            <p className="gsa-body">A counselor from Ontrack Education will reach out to you shortly to confirm your session.</p>
                        </Reveal>
                    ) : (
                        <Reveal as="form" onSubmit={submit} className="surface-card p-8 md:p-10 space-y-6" data-testid="booking-form">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <Field label="First name*" error={errors.first_name}>
                                    <Input data-testid="booking-first_name" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
                                </Field>
                                <Field label="Last name*" error={errors.last_name}>
                                    <Input data-testid="booking-last_name" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
                                </Field>
                                <Field label="Email address*" error={errors.email}>
                                    <Input data-testid="booking-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                                </Field>
                                <Field label="Mobile number*" error={errors.mobile}>
                                    <Input data-testid="booking-mobile" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+91 98XXXXXXXX" />
                                </Field>
                            </div>

                            <Field label="When would you like to start?*" error={errors.start_timeline}>
                                <Select value={form.start_timeline} onValueChange={(v) => set("start_timeline", v)}>
                                    <SelectTrigger data-testid="booking-start_timeline"><SelectValue placeholder="Select a timeline" /></SelectTrigger>
                                    <SelectContent>
                                        {START_TIMELINES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="Preferred mode of counselling*" error={errors.counselling_mode}>
                                <RadioGroup value={form.counselling_mode} onValueChange={(v) => set("counselling_mode", v)} className="flex gap-6">
                                    <div className="flex items-center gap-2"><RadioGroupItem value="online" id="mode-online" data-testid="booking-mode-online" /><Label htmlFor="mode-online">Online</Label></div>
                                    <div className="flex items-center gap-2"><RadioGroupItem value="offline" id="mode-offline" data-testid="booking-mode-offline" /><Label htmlFor="mode-offline">Offline</Label></div>
                                </RadioGroup>
                            </Field>

                            <Field label="Preferred study level*" error={errors.study_level}>
                                <Select value={form.study_level} onValueChange={(v) => set("study_level", v)}>
                                    <SelectTrigger data-testid="booking-study_level"><SelectValue placeholder="Select a study level" /></SelectTrigger>
                                    <SelectContent>
                                        {STUDY_LEVELS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="How would you fund your education?*" error={errors.funding_source}>
                                <Select value={form.funding_source} onValueChange={(v) => set("funding_source", v)}>
                                    <SelectTrigger data-testid="booking-funding_source"><SelectValue placeholder="Select a funding source" /></SelectTrigger>
                                    <SelectContent>
                                        {FUNDING_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <aside className="rounded-xl border border-primary/25 bg-primary/5 p-5 text-sm text-secondary" aria-label="Required consents">
                                <p className="font-semibold">Before submitting, please review and accept both documents.</p>
                                <div className="mt-4 space-y-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <Checkbox className="rounded-none" data-testid="booking-checkbox-privacy-consent" checked={form.privacy_consent} onCheckedChange={(value) => set("privacy_consent", Boolean(value))} />
                                        <span><Link href="/legal/privacy" target="_blank" rel="noreferrer" className="underline font-semibold">Privacy Policy</Link><span className="block mt-1 text-muted-foreground">This explains what personal information we collect for your counselling request, why we use it, and your privacy choices.</span></span>
                                    </label>
                                    {errors.privacy_consent && <p className="text-xs text-destructive" role="alert">{errors.privacy_consent}</p>}
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <Checkbox className="rounded-none" data-testid="booking-checkbox-terms-consent" checked={form.terms_consent} onCheckedChange={(value) => set("terms_consent", Boolean(value))} />
                                        <span><Link href="/legal/terms" target="_blank" rel="noreferrer" className="underline font-semibold">Terms of Service</Link><span className="block mt-1 text-muted-foreground">These set the rules for using our counselling service and clarify that guidance is not visa or legal advice.</span></span>
                                    </label>
                                    {errors.terms_consent && <p className="text-xs text-destructive" role="alert">{errors.terms_consent}</p>}
                                </div>
                            </aside>

                            <button type="submit" disabled={submitting || !form.privacy_consent || !form.terms_consent} className="btn-primary w-full" data-testid="booking-submit-btn">
                                {submitting ? "Submitting…" : <>Book my session <Send size={16} /></>}
                            </button>
                        </Reveal>
                    )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
