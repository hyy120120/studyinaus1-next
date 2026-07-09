import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Trophy, Compass } from "lucide-react";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata = {
    title: "GoStudyInAustralia — Free Australia Student Visa Probability Calculator",
    description:
        "Get a transparent rule-based score plus a counselor-grade AI assessment of your Australian Subclass 500 student visa application — in under 4 minutes. Powered by Ontrack Education.",
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
};

const HERO_IMG =
    "https://images.unsplash.com/photo-1741637335289-c99652d3155f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBjYW1wdXN8ZW58MHx8fHwxNzgxODYxMTAzfDA&ixlib=rb-4.1.0&q=85";
const BENTO_LARGE = "https://images.pexels.com/photos/28074197/pexels-photo-28074197.jpeg";
const BENTO_SMALL = "https://images.pexels.com/photos/7972324/pexels-photo-7972324.jpeg";

const STATS = [
    { k: "9 of top 100", v: "Australian universities in the QS World Top 100 (Source: Study Australia, QS 2024)" },
    { k: "AUD 29,710", v: "DHA 12-month living-cost benchmark for primary applicant (from 10 May 2024)" },
    { k: "2-5 yrs", v: "Post-study work rights for Indian students (Australia-India ECTA Mobility arrangement)" },
    { k: "6 of top 50", v: "Australian cities in QS Best Student Cities 2024 (Source: Study Australia)" },
];

export default function HomePage() {
    return (
        <div data-testid="home-page">
            {/* HERO */}
            <section className="relative overflow-hidden bg-secondary">
                <div className="absolute inset-0">
                    <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-40" loading="eager" />
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-secondary/70" />
                </div>
                <div className="gsa-container pt-20 pb-28 md:pt-32 md:pb-40 text-white max-w-5xl relative">
                    <Reveal direction="up" className="gsa-overline text-primary mb-6">A subclass 500 readiness platform</Reveal>
                    <Reveal direction="up" delay={0.08}>
                        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.98] tracking-tight">
                            Know your <span className="text-primary">Australia</span><br />student visa probability,<br />in under 4 minutes.
                        </h1>
                    </Reveal>
                    <Reveal direction="up" delay={0.16}>
                        <p className="mt-8 max-w-2xl text-lg text-white/80 leading-relaxed">
                            Get a transparent, rule-based score plus a personalised counselor-grade assessment of your
                            GTE strength, financial readiness, and academic fit — powered by Ontrack Education's
                            15+ years of student visa expertise.
                        </p>
                    </Reveal>
                    <Reveal direction="up" delay={0.24} className="mt-10 flex flex-wrap gap-4">
                        <Link href="/calculator" className="btn-primary" data-testid="hero-start-calculator-btn">
                            Start free assessment <ArrowRight size={18} />
                        </Link>
                        <Link href="/why-australia" className="btn-outline border-white/30 text-white hover:bg-white/10 hover:border-white" data-testid="hero-why-australia-btn">
                            Why study in Australia
                        </Link>
                    </Reveal>

                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl">
                        {STATS.map((s, i) => (
                            <Reveal key={s.k} direction="up" delay={0.06 * i} className="border-l-2 border-primary pl-4">
                                <div className="font-display font-black text-2xl md:text-3xl text-white">{s.k}</div>
                                <div className="text-xs text-white/60 mt-1 leading-relaxed">{s.v}</div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="gsa-section">
                <div className="gsa-container">
                    <Reveal className="max-w-2xl mb-12">
                        <div className="gsa-overline mb-4">How it works</div>
                        <h2 className="gsa-h2">Three honest steps. No upsell, no fluff.</h2>
                    </Reveal>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { i: <Compass size={28} strokeWidth={1.5} />, t: "Tell us your story", d: "A guided 7-step form covering academics, work, English, finances, and visa history." },
                            { i: <Sparkles size={28} strokeWidth={1.5} />, t: "Get a transparent score", d: "Weighted rules + an AI counselor assessment of your GTE strength and gaps." },
                            { i: <ShieldCheck size={28} strokeWidth={1.5} />, t: "Plan your next move", d: "Receive recommendations and (optionally) book a 1:1 call with Mamta's team." },
                        ].map((c, idx) => (
                            <Reveal key={idx} delay={0.08 * idx} className="surface-card p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid={`how-it-works-card-${idx}`}>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-6">{c.i}</div>
                                <h3 className="gsa-h3 mb-2">{c.t}</h3>
                                <p className="gsa-body text-sm">{c.d}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHY AUSTRALIA - BENTO */}
            <section className="gsa-section bg-muted">
                <div className="gsa-container">
                    <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
                        <Reveal className="max-w-2xl">
                            <div className="gsa-overline mb-4">Why Australia</div>
                            <h2 className="gsa-h2">A country built for ambitious students.</h2>
                        </Reveal>
                        <Link href="/why-australia" className="text-secondary font-bold inline-flex items-center gap-2 hover:text-primary transition-colors">
                            Read the full guide <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6">
                        <Reveal className="md:col-span-8 lg:col-span-7 row-span-2 rounded-2xl overflow-hidden relative min-h-[420px] group">
                            <img src={BENTO_LARGE} alt="Sydney Opera House" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-transparent" />
                            <div className="absolute bottom-0 p-8 text-white">
                                <Trophy size={22} strokeWidth={1.5} className="mb-3 text-primary" />
                                <h3 className="font-display font-black text-2xl md:text-3xl mb-2">World-class education</h3>
                                <p className="text-white/80 max-w-md text-sm">9 Australian universities sit in the QS World Top 100, and 95% of all Australian universities are globally ranked — across engineering, biosciences, business and the arts. (Source: Study Australia, QS 2024)</p>
                            </div>
                        </Reveal>

                        <Reveal delay={0.1} className="md:col-span-4 lg:col-span-5 rounded-2xl bg-white border border-border p-8 flex flex-col justify-between min-h-[200px] transition-shadow duration-300 hover:shadow-lg">
                            <div className="gsa-overline">02</div>
                            <div>
                                <h3 className="gsa-h3 mb-2">Post-study work rights</h3>
                                <p className="gsa-body text-sm">Stay, work, and gain Australian experience for 2 to 4 years after graduating — eligible for permanent pathways.</p>
                            </div>
                        </Reveal>

                        <Reveal delay={0.18} className="md:col-span-4 lg:col-span-5 rounded-2xl overflow-hidden relative min-h-[220px] group">
                            <img src={BENTO_SMALL} alt="Students on campus" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-secondary/40" />
                            <div className="absolute bottom-0 p-6 text-white">
                                <h3 className="font-display font-bold text-xl mb-1">Multicultural & safe</h3>
                                <p className="text-white/80 text-sm max-w-xs">Cities like Melbourne and Sydney rank among the world's most livable.</p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* CTA STRIP */}
            <section className="gsa-section">
                <div className="gsa-container">
                    <Reveal className="surface-card p-10 md:p-16 bg-secondary text-white border-secondary text-center">
                        <div className="gsa-overline text-primary mb-3">Free • No signup • 4 min</div>
                        <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
                            Ready to see your probability?
                        </h2>
                        <p className="text-white/70 max-w-xl mx-auto mb-8">
                            Skip the guesswork. Get a personalised, counselor-grade visa readiness report before
                            you ever lodge a single form.
                        </p>
                        <Link href="/calculator" className="btn-primary" data-testid="cta-strip-start-btn">
                            Begin assessment <ArrowRight size={18} />
                        </Link>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
