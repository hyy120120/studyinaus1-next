import ResultClient from "@/components/result/ResultClient";

// Rendered as a static shell at build time (no server compute per visit).
// The actual report id is read client-side and the data is fetched from
// Firestore in the browser — see components/result/ResultClient.jsx.
export const dynamic = "force-static";

export const metadata = {
    title: "Your Australia Visa Probability Report | GoStudyInAustralia",
    description: "Personalised Subclass 500 visa readiness report.",
    robots: { index: false, follow: false },
};

export default function ResultPage() {
    return <ResultClient />;
}
