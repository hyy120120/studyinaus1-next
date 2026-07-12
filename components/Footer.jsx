"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const exploreLinks = [
    ["/calculator", "Visa Calculator"],
    ["/book-counselling", "Book Counselling"],
    ["/why-australia", "Why Australia"],
    ["/courses", "Courses"],
    ["/about", "About us"],
];

const legalLinks = [
    ["/legal/privacy", "Privacy Policy"],
    ["/legal/terms", "Terms of Service"],
    ["/legal/cookies", "Cookie Policy"],
    ["/legal/disclaimer", "Disclaimer"],
    ["/legal/retention", "Data Retention & Deletion"],
    ["/legal/consent", "User Consent Policy"],
    ["/legal/refund", "Refund & Cancellation"],
];

function FooterLinks({ title, links }) {
    return (
        <div>
            <h2 className="gsa-overline mb-5 text-white/75">{title}</h2>
            <ul className="space-y-3 text-sm text-white/85">
                {links.map(([href, label]) => (
                    <li key={href}>
                        <Link href={href} className="transition-colors hover:text-primary">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="relative overflow-hidden bg-[#0c3529] text-white" data-testid="site-footer">
            <div className="gsa-container relative z-10 grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.35fr] lg:gap-10 lg:py-20">
                <div className="max-w-sm">
                    <Link href="/" className="mb-5 inline-flex items-center gap-3" aria-label="GoStudyInAustralia home">
                        <Image
                            src="/gostudyustraliaOrange.png"
                            alt=""
                            width={44}
                            height={44}
                            className="h-11 w-11 object-contain"
                        />
                        <span className="font-display text-lg font-black tracking-tight">GoStudyInAustralia</span>
                    </Link>
                    <p className="text-sm leading-7 text-white/75">
                        Powered by OnTrack Education, founded by Mamta Jani. We provide trusted guidance for students planning to study in Australia.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/75">
                        Our goal is to make the Australia study-abroad experience simple, transparent, and successful.
                    </p>
                </div>

                <FooterLinks title="Explore" links={exploreLinks} />
                <FooterLinks title="Legal" links={legalLinks} />

                <div>
                    <h2 className="gsa-overline mb-5 text-white/75">Contact</h2>
                    <ul className="space-y-5 text-sm leading-7 text-white/85">
                        <li className="flex gap-3">
                            <Mail size={19} className="mt-1 shrink-0" />
                            <a href="mailto:Info@purplepatcheducation.com" className="break-all transition-colors hover:text-primary">Info@purplepatcheducation.com</a>
                        </li>
                        <li className="flex gap-3">
                            <Phone size={19} className="mt-1 shrink-0" />
                            <div>
                                <a href="tel:+919537369597" className="block transition-colors hover:text-primary">+91 95373 69597</a>
                                <a href="tel:+912612221500" className="block transition-colors hover:text-primary">0261 222 1500</a>
                                <a href="tel:+912612303321" className="block transition-colors hover:text-primary">0261 230 3321</a>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <MapPin size={19} className="mt-1 shrink-0" />
                            <a href="https://maps.app.goo.gl/cSzUqi9wgkvHu7sM9" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                                UG 10/11/12, Indralok Complex,<br />
                                Kargil Chowk, Nandi Park Society,<br />
                                Piplod, Surat, Gujarat 395007
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div aria-hidden="true" className="pointer-events-none relative h-32 overflow-hidden sm:h-40 lg:h-48">
                <div className="absolute bottom-3 left-4 whitespace-nowrap font-display text-[4.5rem] font-black leading-none tracking-[-0.045em] text-white/[0.07] sm:text-[7rem] lg:bottom-4 lg:left-10 lg:text-[10rem]">
                    GoStudyInAustralia
                </div>
            </div>

            <div className="relative z-10 border-t border-white/10">
                <div className="gsa-container py-5 text-xs text-white/65">
                    © {new Date().getFullYear()} GoStudyInAustralia. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
