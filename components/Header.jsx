"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { GraduationCap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
    { to: "/", label: "Home", end: true },
    { to: "/why-australia", label: "Why Australia" },
    { to: "/courses", label: "Courses" },
    { to: "/about", label: "About" },
];

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname.startsWith("/RKAZN")) return null;

    return (
        <header className="glass-header" data-testid="site-header">
            <div className="gsa-container flex items-center justify-between h-16 md:h-20">
                <Link href="/" className="flex items-center gap-2.5" data-testid="brand-logo">
                    <div className="w-9 h-9">
                        <Image
                            src="/gostudyustraliaGreen.png"
                            alt="GoStudyInAustralia"
                            width={36}
                            height={36}
                            className="object-contain"
                        />
                    </div>
                    <div className="leading-tight">
                        <div className="font-display font-black text-secondary text-base tracking-tight">GoStudyInAustralia</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">by Ontrack Education</div>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {links.map((l) => {
                        const isActive = l.end ? pathname === l.to : pathname.startsWith(l.to);
                        return (
                            <Link
                                key={l.to}
                                href={l.to}
                                data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                                className={cn(
                                    "text-sm font-medium transition-colors",
                                    isActive ? "text-primary" : "text-secondary/80 hover:text-secondary"
                                )}
                            >
                                {l.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        className="btn-outline text-sm py-2.5 px-5 hidden sm:inline-flex"
                        data-testid="header-book-counselling-btn"
                        onClick={() => router.push("/book-counselling")}
                    >
                        Book Counselling
                    </button>
                    <button
                        className="btn-primary text-sm py-2.5 px-5"
                        data-testid="header-start-calculator-btn"
                        onClick={() => router.push("/calculator")}
                    >
                        Check Visa Probability <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
