import CalculatorClient from "@/components/calculator/CalculatorClient";

export const metadata = {
    title: "Australia Student Visa Probability Calculator (Subclass 500) | GoStudyInAustralia",
    description:
        "Answer a 7-step form and get a transparent visa probability score plus an AI counselor assessment of your GTE, finances, English, and academic readiness for Subclass 500.",
    alternates: { canonical: "/calculator" },
};

export default function CalculatorPage() {
    return <CalculatorClient />;
}
