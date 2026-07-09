"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, GraduationCap } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-secondary text-white mt-20" data-testid="site-footer">
            <div className="gsa-container py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center">
                            <GraduationCap size={20} strokeWidth={1.8} />
                        </span>
                        <div className="font-display font-black text-lg">GoStudyInAustralia</div>
                    </div>
                    <p className="text-white/70 max-w-md text-sm leading-relaxed">
                        Powered by <span className="text-white font-medium">OnTrack Education</span>, founded by{" "}
                        <span className="text-white font-medium">Mamta Jani</span>. Trusted study-abroad guidance for the
                        Australian student visa journey.
                    </p>
                    <div className="text-white/60 text-xs leading-relaxed pt-2">
                        UG 10/11/12, Indralok Complex,<br />
                        Kargil Chowk, Nandi Park Society,<br />
                        Piplod, Surat, Gujarat 395007
                    </div>
                </div>
                <div>
                    <div className="gsa-overline text-white/60 mb-3">Explore</div>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/calculator" className="hover:text-primary">Visa Calculator</Link></li>
                        <li><Link href="/why-australia" className="hover:text-primary">Why Australia</Link></li>
                        <li><Link href="/courses" className="hover:text-primary">Courses</Link></li>
                        <li><Link href="/about" className="hover:text-primary">About Mamta</Link></li>
                    </ul>
                </div>
                <div>
                    <div className="gsa-overline text-white/60 mb-3">Contact</div>
                    <ul className="space-y-3 text-sm text-white/80">
                        <li className="flex items-start gap-2">
                            <Mail size={16} className="mt-0.5 flex-shrink-0" />
                            <a href="mailto:Info@purplepatcheducation.com" className="hover:text-primary break-all">Info@purplepatcheducation.com</a>
                        </li>
                        <li className="flex items-start gap-2">
                            <Phone size={16} className="mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col">
                                <a href="tel:+919537369597" className="hover:text-primary">+91 95373 69597</a>
                                <a href="tel:+912612221500" className="hover:text-primary">0261 222 1500</a>
                                <a href="tel:+912612303321" className="hover:text-primary">0261 230 3321</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 flex-shrink-0" /> Piplod, Surat</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="gsa-container py-5 text-xs text-white/50 flex flex-col md:flex-row justify-between gap-2">
                    <span>© {new Date().getFullYear()} GoStudyInAustralia. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
}
