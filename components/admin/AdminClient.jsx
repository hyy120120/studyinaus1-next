"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users, FileText, TrendingUp, ChevronRight, Download, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import {
    onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import { downloadVisaReportPdf } from "@/lib/pdf";

const BREAKDOWN_KEYS = ["academic", "work", "english", "financial", "visa_history", "personal"];
const FORM_KEYS = [
    "full_name", "email", "phone", "age", "nationality",
    "highest_qualification", "field_of_study", "grade_percentage",
    "year_of_completion", "gap_years",
    "work_experience_years", "work_relevant_to_course", "current_job_title",
    "english_test", "english_score", "english_no_band_below",
    "intended_course", "intended_university", "intake_year",
    "sponsor_relationship", "annual_family_income_inr", "income_proof_available",
    "liquid_funds_inr", "loan_sanctioned_inr", "property_assets_inr",
    "previous_visa_refusal", "refusal_country", "refusal_reason", "prior_australia_visa",
    "character_declaration", "health_declaration",
];

function csvEscape(value) {
    const s = value === undefined || value === null ? "" : String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function LoginForm({ onLoggedIn }) {
    const [email, setEmail] = useState("admin@gostudyinaustralia.com");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!isFirebaseConfigured) {
                throw new Error("Firebase isn't configured yet — add your project keys to .env.local.");
            }
            const cred = await signInWithEmailAndPassword(auth, email, password);
            toast.success("Welcome back, " + (cred.user.email || email));
            onLoggedIn();
        } catch (err) {
            toast.error(err?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gsa-container py-24 max-w-md mx-auto" data-testid="admin-login">
            <h1 className="gsa-h2 mb-2">Counselor Login</h1>
            <p className="gsa-body text-sm mb-8">Internal access to the leads dashboard.</p>
            <form onSubmit={submit} className="surface-card p-8 space-y-4">
                <div className="space-y-2"><Label>Email</Label><Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Password</Label><Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button type="submit" disabled={loading} className="btn-primary w-full" data-testid="login-submit-btn">{loading ? "Signing in…" : "Sign in"}</button>
            </form>
        </div>
    );
}

function Dashboard({ onLogout }) {
    const [apps, setApps] = useState([]);
    const [inquiryCount, setInquiryCount] = useState(0);
    const [bookings, setBookings] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const appsQ = query(collection(db, COLLECTIONS.VISA_APPLICATIONS), orderBy("created_at", "desc"));
                const inqQ = collection(db, COLLECTIONS.COURSE_INQUIRIES);
                const bookingsQ = query(collection(db, COLLECTIONS.COUNSELLING_BOOKINGS), orderBy("created_at", "desc"));
                const [appsSnap, inqSnap, bookingsSnap] = await Promise.all([getDocs(appsQ), getDocs(inqQ), getDocs(bookingsQ)]);
                setApps(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setInquiryCount(inqSnap.size);
                setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (e) {
                toast.error("Could not load dashboard data: " + (e?.message || ""));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const stats = useMemo(() => {
        const byTier = {};
        apps.forEach((a) => { byTier[a.tier] = (byTier[a.tier] || 0) + 1; });
        return {
            total_applications: apps.length,
            total_inquiries: inquiryCount,
            by_tier: byTier,
        };
    }, [apps, inquiryCount]);

    const tierStats = useMemo(() => {
        return ["Excellent", "Strong", "Moderate", "Low"].map((k) => ({ k, v: stats.by_tier[k] || 0 }));
    }, [stats]);

    const downloadCsv = () => {
        try {
            const header = (
                ["id", "created_at", "score", "tier"]
                    .concat(FORM_KEYS.map((k) => `form.${k}`))
                    .concat(BREAKDOWN_KEYS.map((k) => `breakdown.${k}`))
                    .concat(["summary", "strengths", "weaknesses", "recommendations", "email_status"])
            );
            const rows = apps.map((r) => {
                const form = r.form || {};
                const breakdown = r.breakdown || {};
                return [
                    r.id, r.created_at, r.score, r.tier,
                    ...FORM_KEYS.map((k) => form[k] ?? ""),
                    ...BREAKDOWN_KEYS.map((k) => breakdown[k] ?? 0),
                    r.summary || "",
                    (r.strengths || []).join(" | "),
                    (r.weaknesses || []).join(" | "),
                    (r.recommendations || []).join(" | "),
                    r.email_status || "",
                ];
            });
            const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `gsa-leads-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            toast.success("CSV downloaded");
        } catch (e) {
            toast.error("CSV export failed: " + e.message);
        }
    };

    return (
        <div data-testid="admin-dashboard" className="bg-background">
            <div className="gsa-container pt-12 pb-6 flex items-center justify-between">
                <div>
                    <div className="gsa-overline mb-2">Counselor Dashboard</div>
                    <h1 className="gsa-h2">Leads & Applications</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-outline" onClick={downloadCsv} data-testid="export-csv-btn">
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="btn-outline" onClick={onLogout} data-testid="logout-btn">Logout <LogOut size={16} /></button>
                </div>
            </div>

            <div className="gsa-container grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="surface-card p-6"><Users className="text-primary mb-2" size={20} /><div className="text-xs uppercase tracking-widest text-muted-foreground">Applications</div><div className="font-display font-black text-3xl text-secondary">{stats.total_applications ?? "–"}</div></div>
                <div className="surface-card p-6"><FileText className="text-primary mb-2" size={20} /><div className="text-xs uppercase tracking-widest text-muted-foreground">Course inquiries</div><div className="font-display font-black text-3xl text-secondary">{stats.total_inquiries ?? "–"}</div></div>
                <div className="surface-card p-6"><CalendarCheck className="text-primary mb-2" size={20} /><div className="text-xs uppercase tracking-widest text-muted-foreground">Counselling bookings</div><div className="font-display font-black text-3xl text-secondary">{bookings.length}</div></div>
                {tierStats.slice(0, 2).map((t) => (
                    <div key={t.k} className="surface-card p-6"><TrendingUp className="text-primary mb-2" size={20} /><div className="text-xs uppercase tracking-widest text-muted-foreground">{t.k} tier</div><div className="font-display font-black text-3xl text-secondary">{t.v}</div></div>
                ))}
            </div>

            <div className="gsa-container mt-10 grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 surface-card overflow-hidden">
                    <div className="p-4 border-b border-border font-bold text-secondary">Recent applications</div>
                    {loading ? <div className="p-6 text-muted-foreground">Loading…</div> : (
                        <ul className="divide-y divide-border max-h-[600px] overflow-auto">
                            {apps.length === 0 && <li className="p-6 text-muted-foreground text-sm">No applications yet.</li>}
                            {apps.map((a) => (
                                <li key={a.id}>
                                    <button onClick={() => setSelected(a)} className={`w-full text-left p-4 flex items-center justify-between hover:bg-muted transition-colors ${selected?.id === a.id ? "bg-muted" : ""}`} data-testid={`app-row-${a.id}`}>
                                        <div>
                                            <div className="font-medium text-secondary">{a.form?.full_name} <span className="text-muted-foreground text-xs">· {a.form?.email}</span></div>
                                            <div className="text-xs text-muted-foreground mt-1">{a.form?.intended_course} → {a.form?.intended_university || "TBD"}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-display font-black text-2xl text-primary">{a.score}</span>
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-secondary font-bold uppercase tracking-wider">{a.tier}</span>
                                            <ChevronRight size={16} className="text-muted-foreground" />
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="lg:col-span-2 surface-card p-6 min-h-[400px]" data-testid="app-detail-panel">
                    {!selected ? <p className="text-muted-foreground text-sm">Select an application to view the full report.</p> : (
                        <div className="space-y-4">
                            <div>
                                <div className="gsa-overline">Applicant</div>
                                <div className="font-display font-bold text-2xl text-secondary">{selected.form.full_name}</div>
                                <div className="text-sm text-muted-foreground">{selected.form.email} · {selected.form.phone}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><div className="text-xs text-muted-foreground">Score</div><div className="font-bold text-secondary">{selected.score}/100</div></div>
                                <div><div className="text-xs text-muted-foreground">Tier</div><div className="font-bold text-primary">{selected.tier}</div></div>
                                <div><div className="text-xs text-muted-foreground">Course</div><div className="text-secondary">{selected.form.intended_course}</div></div>
                                <div><div className="text-xs text-muted-foreground">English</div><div className="text-secondary">{selected.form.english_test} {selected.form.english_score}</div></div>
                                <div><div className="text-xs text-muted-foreground">Funds (INR)</div><div className="text-secondary">{Number(selected.form.liquid_funds_inr).toLocaleString()}</div></div>
                                <div><div className="text-xs text-muted-foreground">Prior refusal</div><div className="text-secondary">{selected.form.previous_visa_refusal ? "Yes" : "No"}</div></div>
                                <div className="col-span-2 pt-1">
                                    <button onClick={() => downloadVisaReportPdf(selected)} className="text-primary text-sm font-bold inline-flex items-center gap-1.5" data-testid="admin-pdf-link">
                                        <Download size={14} /> Download PDF report
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="gsa-overline mb-2">Recommendations</div>
                                <ul className="text-sm space-y-1 text-secondary/90">
                                    {selected.recommendations?.map((r, i) => <li key={i}>• {r}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="gsa-container mt-10">
                <div className="surface-card overflow-hidden">
                    <div className="p-4 border-b border-border font-bold text-secondary">Counselling bookings</div>
                    {loading ? <div className="p-6 text-muted-foreground">Loading…</div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" data-testid="bookings-table">
                                <thead>
                                    <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Start</th>
                                        <th className="px-4 py-3">Mode</th>
                                        <th className="px-4 py-3">Study level</th>
                                        <th className="px-4 py-3">Funding</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {bookings.length === 0 && (
                                        <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No counselling bookings yet.</td></tr>
                                    )}
                                    {bookings.map((b) => (
                                        <tr key={b.id} data-testid={`booking-row-${b.id}`}>
                                            <td className="px-4 py-3 font-medium text-secondary">{b.first_name} {b.last_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{b.email}<br />{b.mobile}</td>
                                            <td className="px-4 py-3 text-secondary">{b.start_timeline}</td>
                                            <td className="px-4 py-3 text-secondary capitalize">{b.counselling_mode}</td>
                                            <td className="px-4 py-3 text-secondary capitalize">{b.study_level}</td>
                                            <td className="px-4 py-3 text-secondary">{b.funding_source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>

    );
}

export default function AdminClient() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        if (!isFirebaseConfigured) { setChecking(false); return; }
        const unsub = onAuthStateChanged(auth, (user) => {
            setAuthed(!!user);
            setChecking(false);
        });
        return () => unsub();
    }, []);

    const logout = async () => {
        if (isFirebaseConfigured) await signOut(auth);
        setAuthed(false);
        router.push("/RKAZN");
    };

    if (checking) {
        return <div className="gsa-container py-24 text-center text-muted-foreground">Loading…</div>;
    }

    return authed ? <Dashboard onLogout={logout} /> : <LoginForm onLoggedIn={() => setAuthed(true)} />;
}
