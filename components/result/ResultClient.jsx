"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, AlertCircle, Lightbulb, Sparkles, CalendarCheck } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import { BREAKDOWN_LABELS } from "@/lib/scoring";

const TIER_COLOR = {
    Low: "bg-destructive/10 text-destructive",
    Moderate: "bg-warning/10 text-warning",
    Strong: "bg-success/10 text-success",
    Excellent: "bg-primary/10 text-primary",
};

export default function ResultClient() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            // 1) Try the session cache written right after submission (fastest path).
            const cached = sessionStorage.getItem("gsa_last_result");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (parsed.id === id) {
                        if (!cancelled) { setData(parsed); setLoading(false); }
                        return;
                    }
                } catch { /* ignore malformed cache */ }
            }

            // 2) Fall back to Firestore (e.g. direct link, admin view, page refresh).
            if (isFirebaseConfigured) {
                try {
                    const snap = await getDoc(doc(db, COLLECTIONS.VISA_APPLICATIONS, id));
                    if (snap.exists() && !cancelled) {
                        setData({ id: snap.id, ...snap.data() });
                    }
                } catch { /* fall through to not-found state */ }
            }
            if (!cancelled) setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return <div className="gsa-container py-24 text-center text-muted-foreground">Loading your report…</div>;
    }

    if (!data) {
        return (
            <div className="gsa-container py-24 text-center" data-testid="result-empty">
                <h2 className="gsa-h2">No report found</h2>
                <p className="gsa-body mt-3">Please run the calculator to generate a new assessment.</p>
                <Link href="/calculator" className="btn-primary mt-6 inline-flex">Start calculator <ArrowRight size={16} /></Link>
            </div>
        );
    }

    const tierClass = TIER_COLOR[data.tier] || "bg-muted text-secondary";

    return (
        <div data-testid="result-page" className="bg-background">
            <section className="bg-secondary text-white">
                <div className="gsa-container py-16 md:py-24 grid md:grid-cols-12 gap-10 items-center">
                    <Reveal className="md:col-span-7">
                        <div className="gsa-overline text-primary mb-4">Your visa probability report</div>
                        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight">
                            Here's where your profile stands today.
                        </h1>
                        <p className="mt-5 text-white/75 max-w-xl">{data.summary}</p>
                        <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mt-6 ${tierClass}`} data-testid="tier-badge">
                            {data.tier} probability
                        </span>
                    </Reveal>
                    <Reveal delay={0.15} className="md:col-span-5">
                        <div className="bg-white text-secondary rounded-2xl p-10 text-center" data-testid="score-card">
                            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-bold mb-3">Estimated score</div>
                            <div className="font-display font-black text-7xl md:text-8xl text-primary tracking-tighter leading-none" data-testid="score-value">{data.score}</div>
                            <div className="text-muted-foreground text-sm mt-2">out of 100</div>
                            <div className="mt-6 flex flex-col gap-2">
                                <Link href="/book-counselling" className="btn-primary w-full text-sm" data-testid="book-counselling-btn">
                                    <CalendarCheck size={16} /> Book free counselling
                                </Link>
                                <p className="text-xs text-muted-foreground">Talk through this report with our counsellors — it&apos;s free.</p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="gsa-section">
                <div className="gsa-container grid md:grid-cols-3 gap-6">
                    {Object.entries(data.breakdown).map(([k, v], i) => {
                        const meta = BREAKDOWN_LABELS[k] || { label: k, max: 25 };
                        const pct = Math.round((v / meta.max) * 100);
                        return (
                            <Reveal key={k} delay={0.05 * i} className="surface-card p-6" data-testid={`breakdown-${k}`}>
                                <div className="flex items-baseline justify-between mb-2">
                                    <div className="font-medium text-secondary">{meta.label}</div>
                                    <div className="font-display font-black text-secondary">{v}<span className="text-muted-foreground text-sm">/{meta.max}</span></div>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </section>

            {data.ai_assessment && (
                <section className="gsa-section bg-muted">
                    <div className="gsa-container">
                        <Reveal className="max-w-3xl surface-card p-8 md:p-12" data-testid="ai-assessment">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="text-primary" size={18} />
                                <span className="gsa-overline">Counselor assessment</span>
                            </div>
                            <p className="font-display text-lg md:text-xl leading-relaxed text-secondary">{data.ai_assessment}</p>
                        </Reveal>
                    </div>
                </section>
            )}

            <section className="gsa-section">
                <div className="gsa-container grid md:grid-cols-2 gap-6">
                    <Reveal className="surface-card p-8" data-testid="strengths-card">
                        <div className="flex items-center gap-2 mb-4 text-success">
                            <CheckCircle2 strokeWidth={1.7} /><span className="font-bold uppercase tracking-wider text-xs">Strengths</span>
                        </div>
                        {data.strengths.length === 0 ? (
                            <p className="gsa-body text-sm">Build foundational strengths in English and academic readiness first.</p>
                        ) : (
                            <ul className="space-y-3">{data.strengths.map((s, i) => <li key={i} className="gsa-body text-sm">• {s}</li>)}</ul>
                        )}
                    </Reveal>
                    <Reveal delay={0.08} className="surface-card p-8" data-testid="weaknesses-card">
                        <div className="flex items-center gap-2 mb-4 text-warning">
                            <AlertCircle strokeWidth={1.7} /><span className="font-bold uppercase tracking-wider text-xs">Areas to improve</span>
                        </div>
                        {data.weaknesses.length === 0 ? (
                            <p className="gsa-body text-sm">No critical weaknesses detected — keep documentation airtight.</p>
                        ) : (
                            <ul className="space-y-3">{data.weaknesses.map((s, i) => <li key={i} className="gsa-body text-sm">• {s}</li>)}</ul>
                        )}
                    </Reveal>
                    <Reveal delay={0.16} className="surface-card p-8 md:col-span-2" data-testid="recommendations-card">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <Lightbulb strokeWidth={1.7} /><span className="font-bold uppercase tracking-wider text-xs">Next actions</span>
                        </div>
                        {data.recommendations.length === 0 ? (
                            <p className="gsa-body text-sm">You're tracking well. Reach out to schedule a final review with a counselor.</p>
                        ) : (
                            <ul className="space-y-3">{data.recommendations.map((s, i) => <li key={i} className="gsa-body text-sm">• {s}</li>)}</ul>
                        )}
                    </Reveal>
                </div>
            </section>

            <section className="gsa-section">
                <div className="gsa-container">
                    <Reveal className="surface-card p-10 md:p-16 bg-secondary text-white text-center border-secondary">
                        <h2 className="font-display text-3xl md:text-4xl font-black mb-3">Want a personalised plan?</h2>
                        <p className="text-white/70 max-w-xl mx-auto mb-8">Book a free 30-minute session with Mamta Jani's counselling team to convert this report into an action plan.</p>
                        <Link href="/book-counselling" className="btn-primary" data-testid="result-cta-counselling">Book free counselling <ArrowRight size={18} /></Link>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
