import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

const SITE_URL = "https://gostudyinaustralia.com";

export const metadata = {
    metadataBase: new URL(SITE_URL),
    title: "GoStudyInAustralia — Australia Student Visa Probability Calculator | Ontrack Education",
    description:
        "Free Australia student visa probability calculator. Get a transparent rule-based score and counselor-grade AI assessment of your Subclass 500 application — powered by Ontrack Education.",
    keywords: [
        "Australia student visa",
        "Subclass 500",
        "visa probability",
        "GTE",
        "study in Australia",
        "Ontrack Education",
        "Mamta Jani",
        "IELTS",
        "Australian universities",
    ],
    authors: [{ name: "Ontrack Education" }],
    robots: { index: true, follow: true },
    openGraph: {
        type: "website",
        siteName: "GoStudyInAustralia",
        title: "GoStudyInAustralia — Check your Australia student visa probability",
        description: "Free 4-minute Subclass 500 visa probability check. Powered by Ontrack Education.",
        url: SITE_URL,
    },
    twitter: {
        card: "summary_large_image",
    },
    alternates: {
        canonical: "/",
    },
};

export const viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body>
                <div className="App">
                    <Providers>
                        <Header />
                        {children}
                    </Providers>
                </div>
            </body>
        </html>
    );
}
