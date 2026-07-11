import { notFound } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import { POLICY_CONTENT, POLICY_VERSIONS } from "@/lib/policies";

export function generateStaticParams() { return Object.keys(POLICY_CONTENT).map((policy) => ({ policy })); }

export default async function LegalPolicyPage({ params }) {
    const { policy } = await params;
    const content = POLICY_CONTENT[policy];
    if (!content) notFound();
    return <div className="bg-background min-h-screen"><main className="gsa-container py-16 max-w-3xl"><div className="gsa-overline mb-3">Legal & privacy</div><h1 className="gsa-h2">{content.title}</h1><p className="text-sm text-muted-foreground mt-3">Version {POLICY_VERSIONS[policy]} · Effective 12 July 2026</p><div className="mt-10 space-y-8">{content.sections.map(([heading, text]) => <section key={heading}><h2 className="font-display text-xl font-bold text-secondary">{heading}</h2><p className="mt-2 text-secondary/80 leading-7">{text}</p></section>)}</div><p className="mt-10 text-sm text-muted-foreground">This policy is written in clear language for this service. Contact us if you need it explained or need to exercise a privacy right.</p><Link href="/" className="btn-outline mt-8 inline-flex">Return home</Link></main><Footer /></div>;
}
