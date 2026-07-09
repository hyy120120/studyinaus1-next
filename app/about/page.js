import Link from "next/link";
import { Award, HeartHandshake, Quote, Mail, Phone, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata = {
    title: "About Ontrack Education & Mamta Jani | GoStudyInAustralia",
    description:
        "Mamta Jani and Ontrack Education have placed 2,000+ students in Australian universities over 15 years with a 96% visa approval rate. Learn about our promise to students.",
    alternates: { canonical: "/about" },
};

export default function AboutPage() {
    return (
        <div data-testid="about-page">
            <section className="bg-secondary text-white">
                <div className="gsa-container py-20 md:py-28 max-w-4xl">
                    <Reveal className="gsa-overline text-primary mb-6">About</Reveal>
                    <Reveal delay={0.08}>
                        <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
                            Powered by Ontrack Education.<br />Led by Mamta Jani.
                        </h1>
                    </Reveal>
                    <Reveal delay={0.16}>
                        <p className="mt-6 max-w-2xl text-white/75 leading-relaxed">
                            For 15+ years, Mamta Jani and her counsellors at Ontrack Education have helped Indian students
                            navigate complex Australian student-visa requirements with clarity and care.
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="gsa-section">
                <div className="gsa-container grid md:grid-cols-3 gap-8">
                    <Reveal className="surface-card p-8">
                        <Award className="text-primary mb-4" strokeWidth={1.5} />
                        <div className="font-display font-black text-3xl text-secondary">15+ yrs</div>
                        <p className="gsa-body text-sm mt-2">Of study-abroad and migration counselling experience.</p>
                    </Reveal>
                    <Reveal delay={0.08} className="surface-card p-8">
                        <HeartHandshake className="text-primary mb-4" strokeWidth={1.5} />
                        <div className="font-display font-black text-3xl text-secondary">2,000+</div>
                        <p className="gsa-body text-sm mt-2">Students successfully placed across Australia, UK, Canada & New Zealand.</p>
                    </Reveal>
                    <Reveal delay={0.16} className="surface-card p-8">
                        <Quote className="text-primary mb-4" strokeWidth={1.5} />
                        <div className="font-display font-black text-3xl text-secondary">96%</div>
                        <p className="gsa-body text-sm mt-2">Visa approval rate among Ontrack-counselled Subclass 500 applicants.</p>
                    </Reveal>
                </div>

                <Reveal className="gsa-container mt-16 max-w-3xl">
                    <h2 className="gsa-h2 mb-6">Our promise</h2>
                    <p className="gsa-body mb-4">
                        We will never sell you a course you don't need or push a university that doesn't fit you. Every
                        recommendation we make is anchored in your academics, your finances, and the long-term outcome
                        you want — whether that's PR, a global career, or simply the best learning experience of your life.
                    </p>
                    <p className="gsa-body">
                        This platform is a small free tool to help you start that journey honestly. Use it, share it,
                        and when you're ready — talk to us.
                    </p>
                </Reveal>
            </section>

            <section className="gsa-section bg-muted">
                <div className="gsa-container">
                    <Reveal className="surface-card p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="gsa-overline mb-3">Visit us</div>
                            <h2 className="gsa-h2 mb-3">Book a free 30-min counselling call</h2>
                            <p className="gsa-body mb-6">
                                No obligations. We'll review your probability report and map the next step. Drop in at
                                our Surat office, give us a call, or send us an email — whichever works for you.
                            </p>
                            <Link href="/calculator" className="btn-primary" data-testid="about-cta-btn">Start with my report</Link>
                        </div>
                        <div className="space-y-5 text-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-primary mt-0.5 flex-shrink-0" size={20} strokeWidth={1.6} />
                                <div>
                                    <div className="font-bold text-secondary mb-1">OnTrack Education by Mamta Jani</div>
                                    <div className="text-muted-foreground leading-relaxed">
                                        UG 10/11/12, Indralok Complex,<br />
                                        Kargil Chowk, Nandi Park Society,<br />
                                        Piplod, Surat, Gujarat 395007
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="text-primary mt-0.5 flex-shrink-0" size={20} strokeWidth={1.6} />
                                <div className="flex flex-col">
                                    <a href="tel:+919537369597" className="font-bold text-secondary hover:text-primary">+91 95373 69597</a>
                                    <a href="tel:+912612221500" className="text-muted-foreground hover:text-primary">0261 222 1500</a>
                                    <a href="tel:+912612303321" className="text-muted-foreground hover:text-primary">0261 230 3321</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="text-primary mt-0.5 flex-shrink-0" size={20} strokeWidth={1.6} />
                                <a href="mailto:Info@purplepatcheducation.com" className="font-bold text-secondary hover:text-primary break-all">Info@purplepatcheducation.com</a>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
