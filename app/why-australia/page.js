import Link from "next/link";
import {
    ArrowRight, Sparkles, Briefcase, Globe2, Trophy, ShieldCheck, HeartHandshake,
    GraduationCap, BookOpen, Check, DollarSign, FileText, Plane, PiggyBank
} from "lucide-react";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata = {
    title: "Why Study in Australia? Cost, Visa, Universities & Indian PSW | GoStudyInAustralia",
    description:
        "Everything Indian students need to know about studying in Australia: 9 top-100 universities, AUD 29,710 financial requirement, 2-5 year post-study work visa under ECTA, Subclass 500 process, costs, and pathways to PR.",
    alternates: { canonical: "/why-australia" },
};

const HEADLINE_STATS = [
    { value: "9", unit: "of top 100", label: "Australian universities in the QS World Top 100", source: "QS 2024 via Study Australia" },
    { value: "95%", unit: "", label: "of Australian universities are globally ranked", source: "QS 2024 via Study Australia" },
    { value: "6", unit: "of top 50", label: "Australian cities in QS Best Student Cities 2024", source: "QS 2024 via Study Australia" },
    { value: "2-5", unit: "years", label: "Post-study work rights for Indian students (Subclass 485)", source: "Australia-India ECTA Mobility" },
];

const PILLARS = [
    { i: Trophy, t: "World-class universities", d: "Group of Eight (Go8) — Melbourne, Sydney, UNSW, ANU, Monash, UQ, UWA, Adelaide — plus strong public universities deliver consistently top-tier research and teaching across STEM, health, business and the arts." },
    { i: Briefcase, t: "2 to 5 years of post-study work", d: "Indian graduates qualify for extended Temporary Graduate Visa (Subclass 485) work rights of 2-5 years under the Australia-India ECTA Mobility arrangement — longer than the standard 2-4 years for other nationalities." },
    { i: Globe2, t: "Globally recognised qualifications", d: "Australian Qualifications Framework (AQF) credentials are accepted by employers and immigration authorities worldwide, ensuring your degree travels with you." },
    { i: ShieldCheck, t: "Strong student protections", d: "The ESOS Act, Tuition Protection Service (TPS) and mandatory Overseas Student Health Cover (OSHC) make Australia one of the safest study destinations." },
    { i: Sparkles, t: "Top-ranked student cities", d: "Melbourne, Sydney, Brisbane, Adelaide, Perth and Canberra all sit inside the QS Best Student Cities top 50 — for quality of life, employer activity and student mix." },
    { i: HeartHandshake, t: "Pathway to permanent residency", d: "Healthcare, education, engineering, ICT and skilled trades feature on the Skilled Occupations List, opening realistic pathways to Skilled (Subclass 189/190) visas after graduation." },
];

const STEPS = [
    { i: BookOpen, t: "Choose your study area", d: "Pick the field that aligns with your career goal — STEM, health, business, arts, trades. Start with what you've already studied or worked in." },
    { i: GraduationCap, t: "Choose your course & provider", d: "Compare AQF-aligned courses across universities, TAFEs and private providers using the Study Australia course search." },
    { i: DollarSign, t: "Plan your budget", d: "Estimate tuition (typically AUD 20k-50k per year), living costs (DHA benchmark AUD 29,710/yr for primary applicant), and OSHC insurance." },
    { i: FileText, t: "Prepare your Subclass 500 application", d: "Get your CoE, evidence of finances, English score, OSHC, and a strong Genuine Student (GS) statement ready before lodging." },
    { i: Plane, t: "Arrive and study", d: "Once granted, plan your travel, accommodation, and orientation. Most providers offer airport pickup and first-week support." },
];

const COSTS = [
    { label: "12-month living cost (primary applicant)", value: "AUD 29,710", note: "DHA benchmark from 10 May 2024" },
    { label: "Partner / de facto partner", value: "AUD 10,394", note: "Additional, if accompanying" },
    { label: "Each dependent child", value: "AUD 4,449", note: "Additional, per child" },
    { label: "School-age child schooling", value: "AUD 13,502", note: "Per child, per year" },
    { label: "Average tuition — Bachelor's", value: "AUD 20,000-45,000", note: "Per year, varies by course/provider" },
    { label: "Average tuition — Master's", value: "AUD 22,000-50,000", note: "Per year, varies by course/provider" },
];

const FAQ = [
    { q: "What is the Subclass 500 student visa?", a: "It's Australia's primary student visa, allowing you to study full-time in a CRICOS-registered course. It's valid for the duration of your course plus a buffer, and lets you work limited hours during study." },
    { q: "What is the Genuine Student (GS) criterion?", a: "From 23 March 2024 the Department of Home Affairs replaced the old Genuine Temporary Entrant (GTE) requirement with the Genuine Student (GS) test. You must show that you intend to study a real course and that your circumstances support that — your finances, course-career fit, ties to home, and overall narrative all matter." },
    { q: "How much money do I need to show?", a: "As a primary applicant you need to demonstrate access to AUD 29,710 for 12 months of living costs, plus tuition for 12 months, plus travel costs. Add AUD 10,394 for an accompanying partner and AUD 4,449 per dependent child." },
    { q: "Can I work while studying?", a: "Yes — Subclass 500 holders are permitted to work, with a fortnightly cap during teaching periods (verify the current limit on the Home Affairs website before you plan). You can work unlimited hours during scheduled course breaks." },
    { q: "What's the post-study work visa for Indian graduates?", a: "Under the Australia-India ECTA Mobility arrangement, Indian students completing eligible Australian qualifications can apply for a Subclass 485 Temporary Graduate Visa with 2 to 5 years of full work rights, depending on qualification level." },
    { q: "Do I need IELTS?", a: "Most providers accept IELTS, PTE Academic, TOEFL iBT, Cambridge or in some cases Duolingo English Test. Required scores vary by course (typically IELTS 6.0-7.0 overall with no band below 5.5-6.0)." },
];

export default function WhyAustraliaPage() {
    return (
        <div data-testid="why-australia-page">
            {/* HERO */}
            <section className="bg-secondary text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                     style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #C55B43 0%, transparent 40%), radial-gradient(circle at 80% 70%, #C55B43 0%, transparent 40%)" }} />
                <div className="gsa-container py-20 md:py-28 relative">
                    <Reveal className="gsa-overline text-primary mb-6">Why Australia</Reveal>
                    <Reveal delay={0.08}>
                        <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-4xl">
                            The honest case for Australia — for Indian students who want the maths to work.
                        </h1>
                    </Reveal>
                    <Reveal delay={0.16}>
                        <p className="mt-6 max-w-2xl text-white/85 leading-relaxed text-lg">
                            World-class universities. Real post-study work rights of <span className="text-primary font-bold">2 to 5 years</span> for Indian graduates.
                            Transparent visa rules. A realistic PR pathway for the right course. Here's everything you need
                            to weigh, sourced directly from <a href="https://www.studyaustralia.gov.au/" target="_blank" rel="noreferrer" className="underline decoration-primary underline-offset-4 hover:text-primary">studyaustralia.gov.au</a> and the Department of Home Affairs.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* STATS BAR */}
            <section className="bg-white border-b border-border">
                <div className="gsa-container py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {HEADLINE_STATS.map((s, i) => (
                        <Reveal key={s.label} delay={0.06 * i} className="border-l-2 border-primary pl-4">
                            <div className="font-display font-black text-3xl md:text-4xl text-secondary leading-none">
                                {s.value} <span className="text-base font-medium text-muted-foreground">{s.unit}</span>
                            </div>
                            <div className="text-xs text-foreground/80 mt-2 leading-relaxed">{s.label}</div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">{s.source}</div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* 6 PILLARS */}
            <section className="gsa-section">
                <div className="gsa-container">
                    <Reveal className="max-w-3xl mb-12">
                        <div className="gsa-overline mb-4">The six pillars</div>
                        <h2 className="gsa-h2">Six reasons Australia stays the smartest study destination.</h2>
                    </Reveal>
                    <div className="grid md:grid-cols-2 gap-6">
                        {PILLARS.map(({ i: Icon, t, d }, idx) => (
                            <Reveal key={t} delay={0.05 * idx} className="surface-card p-8 md:p-10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid={`why-card-${idx}`}>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-6">
                                    <Icon size={26} strokeWidth={1.5} />
                                </div>
                                <h3 className="gsa-h3 mb-3">{t}</h3>
                                <p className="gsa-body text-sm">{d}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5-STEP JOURNEY */}
            <section className="gsa-section bg-muted">
                <div className="gsa-container">
                    <Reveal className="max-w-3xl mb-12">
                        <div className="gsa-overline mb-4">The 5-step journey</div>
                        <h2 className="gsa-h2">From idea to Australia, in five steps.</h2>
                        <p className="gsa-body mt-3">Adapted from the official Study Australia 5-step framework, with practical detail for Indian applicants.</p>
                    </Reveal>
                    <div className="grid md:grid-cols-5 gap-4">
                        {STEPS.map(({ i: Icon, t, d }, idx) => (
                            <Reveal key={t} delay={0.06 * idx} className="surface-card p-6 relative transition-transform duration-300 hover:-translate-y-1">
                                <div className="absolute top-4 right-4 font-display font-black text-3xl text-primary/20">0{idx + 1}</div>
                                <Icon size={22} strokeWidth={1.5} className="text-primary mb-4" />
                                <h3 className="font-display font-bold text-base text-secondary mb-2 leading-snug">{t}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{d}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* COST BREAKDOWN TABLE */}
            <section className="gsa-section">
                <div className="gsa-container max-w-6xl">
                    <Reveal className="max-w-2xl">
                        <div className="gsa-overline mb-4">The numbers</div>
                        <h2 className="gsa-h2 mb-3">What it actually costs.</h2>
                        <p className="gsa-body mb-8">
                            Indicative tuition and the official Department of Home Affairs financial-capacity benchmarks.
                            All figures in Australian Dollars.
                        </p>
                    </Reveal>
                    <div className="grid lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2">
                            <Reveal delay={0.1} className="surface-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-secondary text-white text-left">
                                            <th className="px-6 py-4 font-display font-bold">Item</th>
                                            <th className="px-6 py-4 font-display font-bold">Amount (AUD)</th>
                                            <th className="px-6 py-4 font-display font-bold hidden md:table-cell">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {COSTS.map((c) => (
                                            <tr key={c.label} className="hover:bg-muted/40 transition-colors">
                                                <td className="px-6 py-4 text-secondary font-medium">{c.label}</td>
                                                <td className="px-6 py-4 font-display font-bold text-primary whitespace-nowrap">{c.value}</td>
                                                <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{c.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Reveal>
                            <p className="text-xs text-muted-foreground mt-4">
                                Sources: Department of Home Affairs Subclass 500 financial requirements (updated 10 May 2024),
                                Study Australia cost-of-living guidance.
                            </p>
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-24">
                            <Reveal delay={0.14} className="surface-card p-6 bg-secondary text-white border-secondary">
                                <PiggyBank className="text-primary mb-3" size={22} strokeWidth={1.5} />
                                <h3 className="font-display font-bold text-base mb-4">Quick ways to save</h3>
                                <ul className="space-y-2.5 text-xs text-white/80">
                                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> Regional campuses: ~10-20% lower tuition</li>
                                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> University scholarships up to 50% off</li>
                                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> Part-time work offsets living costs</li>
                                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> Lock forex rates early</li>
                                </ul>
                            </Reveal>

                            <Reveal delay={0.22} className="surface-card p-6 text-center">
                                <p className="text-sm text-secondary font-medium mb-4">Want a cost estimate specific to your course?</p>
                                <Link href="/book-counselling" className="btn-primary w-full text-sm justify-center">
                                    Book free counselling
                                </Link>
                            </Reveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHO IT'S FOR */}
            <section className="gsa-section bg-muted">
                <div className="gsa-container">
                    <Reveal className="max-w-3xl mb-12">
                        <div className="gsa-overline mb-4">Who Australia is right for</div>
                        <h2 className="gsa-h2">Honest fit-check.</h2>
                    </Reveal>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Reveal className="surface-card p-8 border-l-4 border-success">
                            <div className="flex items-center gap-2 mb-4 text-success">
                                <Check strokeWidth={2} />
                                <span className="font-bold uppercase tracking-wider text-xs">Strong fit</span>
                            </div>
                            <ul className="space-y-3 text-sm text-secondary/90">
                                <li>• You have a clear, verifiable academic record (60%+ in your highest qualification)</li>
                                <li>• You can document liquid funds of INR 30-50 lakh and a sponsor with 3 years of ITR</li>
                                <li>• You have IELTS 6.0+ overall (or PTE 50+) and can target 6.5+ within a few months</li>
                                <li>• Your chosen course logically extends your current education or work</li>
                                <li>• You're 18-30 with a clean visa history</li>
                                <li>• You want serious post-study work rights and a PR optionality</li>
                            </ul>
                        </Reveal>
                        <Reveal delay={0.1} className="surface-card p-8 border-l-4 border-warning">
                            <div className="flex items-center gap-2 mb-4 text-warning">
                                <span className="font-bold uppercase tracking-wider text-xs">Areas that need work first</span>
                            </div>
                            <ul className="space-y-3 text-sm text-secondary/90">
                                <li>• Previous student-visa refusals (especially GTE/GS concerns) — addressable, but needs care</li>
                                <li>• Large gap years (5+) without documented activity</li>
                                <li>• Insufficient funds or sponsor documentation</li>
                                <li>• Course choice that doesn't connect to past study or work history</li>
                                <li>• English score significantly below target (5.5 or lower)</li>
                                <li>• These don't mean "no" — they mean "fix this first, then lodge"</li>
                            </ul>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="gsa-section">
                <div className="gsa-container max-w-6xl">
                    <Reveal className="max-w-2xl">
                        <div className="gsa-overline mb-4">FAQ</div>
                        <h2 className="gsa-h2 mb-10">Answers to the questions students actually ask.</h2>
                    </Reveal>
                    <div className="grid lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 space-y-4">
                            {FAQ.map((f, idx) => (
                                <Reveal key={f.q} as="details" delay={0.04 * idx} className="surface-card p-6 group">
                                    <summary className="font-display font-bold text-secondary cursor-pointer flex items-center justify-between gap-4 list-none">
                                        <span>{f.q}</span>
                                        <span className="text-primary text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
                                    </summary>
                                    <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{f.a}</p>
                                </Reveal>
                            ))}
                        </div>

                        <Reveal delay={0.2} className="surface-card p-6 bg-secondary text-white border-secondary lg:sticky lg:top-24">
                            <Sparkles className="text-primary mb-3" size={22} strokeWidth={1.5} />
                            <h3 className="font-display font-bold text-base mb-2">Still have questions?</h3>
                            <p className="text-xs text-white/70 leading-relaxed mb-5">
                                Every profile is different. Talk to a counsellor and get answers specific to your
                                course, budget, and timeline.
                            </p>
                            <Link href="/book-counselling" className="btn-primary w-full text-sm justify-center">
                                Book free counselling
                            </Link>
                            <a href="tel:+919537369597" className="block text-center text-xs text-white/60 hover:text-white mt-4">
                                or call +91 95373 69597
                            </a>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="gsa-section bg-muted">
                <div className="gsa-container">
                    <Reveal className="surface-card p-10 md:p-16 text-center">
                        <h2 className="gsa-h2 mb-3">Find out if you qualify in 4 minutes.</h2>
                        <p className="gsa-body max-w-xl mx-auto mb-8">
                            Australia rewards prepared applicants. See where your profile stands today, with a
                            transparent, counselor-grade probability score.
                        </p>
                        <Link href="/calculator" className="btn-primary" data-testid="why-cta-btn">
                            Check my visa probability <ArrowRight size={18} />
                        </Link>
                        <p className="text-xs text-muted-foreground mt-6">
                            Sources cited on this page: <a href="https://www.studyaustralia.gov.au/" target="_blank" rel="noreferrer" className="underline">studyaustralia.gov.au</a>,
                            {" "}<a href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" target="_blank" rel="noreferrer" className="underline">immi.homeaffairs.gov.au (Subclass 500)</a>.
                            Last reviewed: June 2026.
                        </p>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
