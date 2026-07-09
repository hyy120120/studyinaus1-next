"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import Lenis from "lenis";

function SmoothScroll() {
    const lenisRef = useRef(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.2,
        });
        lenisRef.current = lenis;

        let rafId;
        function raf(time) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, []);

    return null;
}

function ScrollToTop() {
    const pathname = usePathname();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" in window ? "instant" : "auto" });
    }, [pathname]);
    return null;
}

export default function Providers({ children }) {
    return (
        <>
            <SmoothScroll />
            <ScrollToTop />
            {children}
            <Toaster position="top-right" richColors closeButton />
        </>
    );
}
