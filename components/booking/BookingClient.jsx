"use client";

import { useState } from "react";
import { Send, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import { validateBooking } from "@/lib/validation";

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
            await addDoc(collection(db, COLLECTIONS.COUNSELLING_BOOKINGS), {
                ...form,
                created_at: serverTimestamp(),
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
                <div className="gsa-container py-16 md:py-24 max-w-3xl">
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

            <section className="gsa-section">
                <div className="gsa-container max-w-2xl">
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

                            <button type="submit" disabled={submitting} className="btn-primary w-full" data-testid="booking-submit-btn">
                                {submitting ? "Submitting…" : <>Book my session <Send size={16} /></>}
                            </button>
                        </Reveal>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
