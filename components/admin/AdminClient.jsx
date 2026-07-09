"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users, ChevronRight, Download, CalendarCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
    onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
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

// --- date/time helpers ---------------------------------------------------
// created_at can be a Firestore Timestamp (has .toDate()), a plain
// {seconds,...} object, or an ISO string (local-fallback records) — handle
// all three.
function toJsDate(value) {
    if (!value) return null;
    if (typeof value === "string") {
        const d = new Date(value);
        return isNaN(d) ? null : d;
    }
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
    return null;
}

function formatDate(value) {
    const d = toJsDate(value);
    if (!d) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value) {
    const d = toJsDate(value);
    if (!d) return "—";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// YYYY-MM-DD in local time, matching <input type="date"> value format.
function dateKey(value) {
    const d = toJsDate(value);
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function DateFilter({ value, onChange, count, label }) {
    return (
        <div className="flex items-center gap-3 flex-wrap" data-testid="date-filter">
            <div className="flex items-center gap-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Filter by date</Label>
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 text-sm bg-white text-secondary"
                    data-testid="date-filter-input"
                />
            </div>
            {value && (
                <>
                    <span className="text-xs text-muted-foreground">{count} {label} on {value}</span>
                    <button onClick={() => onChange("")} className="text-xs text-primary font-bold inline-flex items-center gap-1" data-testid="date-filter-clear">
                        <X size={12} /> Clear
                    </button>
                </>
            )}
        </div>
    );
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
        <div className="gsa-container max-w-md mx-auto h-screen overflow-hidden flex flex-col justify-center" data-testid="admin-login">
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

const TABS = [
    { key: "applications", label: "Visa Applications" },
    { key: "counselling", label: "Counselling" },
];

function Dashboard({ onLogout }) {
    const [tab, setTab] = useState("applications");
    const [apps, setApps] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [appsDateFilter, setAppsDateFilter] = useState("");
    const [bookingsDateFilter, setBookingsDateFilter] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const appsQ = query(collection(db, COLLECTIONS.VISA_APPLICATIONS), orderBy("created_at", "desc"));
                const bookingsQ = query(collection(db, COLLECTIONS.COUNSELLING_BOOKINGS), orderBy("created_at", "desc"));
                const [appsSnap, bookingsSnap] = await Promise.all([getDocs(appsQ), getDocs(bookingsQ)]);
                setApps(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (e) {
                toast.error("Could not load dashboard data: " + (e?.message || ""));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredApps = useMemo(() => {
        if (!appsDateFilter) return apps;
        return apps.filter((a) => dateKey(a.created_at) === appsDateFilter);
    }, [apps, appsDateFilter]);

    const filteredBookings = useMemo(() => {
        if (!bookingsDateFilter) return bookings;
        return bookings.filter((b) => dateKey(b.created_at) === bookingsDateFilter);
    }, [bookings, bookingsDateFilter]);

    const downloadCsv = () => {
        try {
            const header = (
                ["id", "created_at", "date", "time", "score", "tier"]
                    .concat(FORM_KEYS.map((k) => `form.${k}`))
                    .concat(BREAKDOWN_KEYS.map((k) => `breakdown.${k}`))
                    .concat(["summary", "strengths", "weaknesses", "recommendations"])
            );
            const rows = filteredApps.map((r) => {
                const form = r.form || {};
                const breakdown = r.breakdown || {};
                return [
                    r.id, r.created_at, formatDate(r.created_at), formatTime(r.created_at), r.score, r.tier,
                    ...FORM_KEYS.map((k) => form[k] ?? ""),
                    ...BREAKDOWN_KEYS.map((k) => breakdown[k] ?? 0),
                    r.summary || "",
                    (r.strengths || []).join(" | "),
                    (r.weaknesses || []).join(" | "),
                    (r.recommendations || []).join(" | "),
                ];
            });
            const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const suffix = appsDateFilter ? `-${appsDateFilter}` : "";
            a.download = `gsa-applications${suffix}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            toast.success("CSV downloaded");
        } catch (e) {
            toast.error("CSV export failed: " + e.message);
        }
    };

    const downloadBookingsCsv = () => {
        try {
            const header = ["id", "created_at", "date", "time", "first_name", "last_name", "email", "mobile", "start_timeline", "counselling_mode", "study_level", "funding_source"];
            const rows = filteredBookings.map((b) => [
                b.id, b.created_at, formatDate(b.created_at), formatTime(b.created_at),
                b.first_name, b.last_name, b.email, b.mobile,
                b.start_timeline, b.counselling_mode, b.study_level, b.funding_source,
            ]);
            const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const suffix = bookingsDateFilter ? `-${bookingsDateFilter}` : "";
            a.download = `gsa-counselling-bookings${suffix}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            toast.success("CSV downloaded");
        } catch (e) {
            toast.error("CSV export failed: " + e.message);
        }
    };

    return (
        <div data-testid="admin-dashboard" className="h-screen overflow-hidden flex flex-col bg-background">
            <div className="gsa-container pt-6 pb-4 flex items-center justify-between flex-wrap gap-4 flex-shrink-0">
                <div>
                    <div className="gsa-overline mb-2">Counselor Dashboard</div>
                    <h1 className="gsa-h2">{tab === "applications" ? "Leads & Applications" : "Counselling Bookings"}</h1>
                </div>
                <div className="flex items-center gap-3">
                    {tab === "applications" ? (
                        <button className="btn-outline" onClick={downloadCsv} data-testid="export-csv-btn">
                            <Download size={16} /> Export CSV
                        </button>
                    ) : (
                        <button className="btn-outline" onClick={downloadBookingsCsv} data-testid="export-bookings-csv-btn">
                            <Download size={16} /> Export CSV
                        </button>
                    )}
                    <button className="btn-outline" onClick={onLogout} data-testid="logout-btn">Logout <LogOut size={16} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="gsa-container flex-shrink-0">
                <div className="flex gap-2 border-b border-border" data-testid="admin-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            data-testid={`admin-tab-${t.key}`}
                            className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === t.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-secondary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {tab === "applications" && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="gsa-container grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 flex-shrink-0 items-start">
                        <div className="surface-card p-4"><Users className="text-primary mb-1" size={18} /><div className="text-xs uppercase tracking-widest text-muted-foreground">Total applications</div><div className="font-display font-black text-2xl text-secondary">{apps.length}</div></div>
                        <div className="surface-card p-4 flex items-center">
                            <DateFilter value={appsDateFilter} onChange={setAppsDateFilter} count={filteredApps.length} label="application(s)" />
                        </div>
                    </div>

                    <div className="gsa-container mt-4 grid lg:grid-cols-5 gap-6 flex-1 overflow-hidden pb-4">
                        <div className="lg:col-span-3 surface-card overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-border font-bold text-secondary flex-shrink-0">
                                {appsDateFilter ? `Applications on ${appsDateFilter}` : "Recent applications"}
                            </div>
                            {loading ? <div className="p-6 text-muted-foreground">Loading…</div> : (
                                <ul className="divide-y divide-border flex-1 overflow-auto">
                                    {filteredApps.length === 0 && <li className="p-6 text-muted-foreground text-sm">No applications found.</li>}
                                    {filteredApps.map((a) => (
                                        <li key={a.id}>
                                            <button onClick={() => setSelected(a)} className={`w-full text-left p-4 flex items-center justify-between hover:bg-muted transition-colors ${selected?.id === a.id ? "bg-muted" : ""}`} data-testid={`app-row-${a.id}`}>
                                                <div>
                                                    <div className="font-medium text-secondary">{a.form?.full_name} <span className="text-muted-foreground text-xs">· {a.form?.email}</span></div>
                                                    <div className="text-xs text-muted-foreground mt-1">{a.form?.intended_course} → {a.form?.intended_university || "TBD"}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">{formatDate(a.created_at)} · {formatTime(a.created_at)}</div>
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

                        <div className="lg:col-span-2 surface-card p-6 overflow-auto h-full" data-testid="app-detail-panel">
                            {!selected ? <p className="text-muted-foreground text-sm">Select an application to view the full report.</p> : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="gsa-overline">Applicant</div>
                                        <div className="font-display font-bold text-2xl text-secondary">{selected.form.full_name}</div>
                                        <div className="text-sm text-muted-foreground">{selected.form.email} · {selected.form.phone}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Submitted {formatDate(selected.created_at)} at {formatTime(selected.created_at)}</div>
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
                </div>
            )}

            {tab === "counselling" && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="gsa-container grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 flex-shrink-0 items-start">
                        <div className="surface-card p-4"><CalendarCheck className="text-primary mb-1" size={18} /><div className="text-xs uppercase tracking-widest text-muted-foreground">Total bookings</div><div className="font-display font-black text-2xl text-secondary">{bookings.length}</div></div>
                        <div className="surface-card p-4 flex items-center">
                            <DateFilter value={bookingsDateFilter} onChange={setBookingsDateFilter} count={filteredBookings.length} label="booking(s)" />
                        </div>
                    </div>

                    <div className="gsa-container mt-4 flex-1 overflow-hidden pb-4">
                        <div className="surface-card overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-border font-bold text-secondary flex-shrink-0">
                                {bookingsDateFilter ? `Bookings on ${bookingsDateFilter}` : "Counselling bookings"}
                            </div>
                            {loading ? <div className="p-6 text-muted-foreground">Loading…</div> : (
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-sm" data-testid="bookings-table">
                                        <thead>
                                            <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Contact</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Time</th>
                                                <th className="px-4 py-3">Start</th>
                                                <th className="px-4 py-3">Mode</th>
                                                <th className="px-4 py-3">Study level</th>
                                                <th className="px-4 py-3">Funding</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredBookings.length === 0 && (
                                                <tr><td className="px-4 py-6 text-muted-foreground" colSpan={8}>No counselling bookings found.</td></tr>
                                            )}
                                            {filteredBookings.map((b) => (
                                                <tr key={b.id} data-testid={`booking-row-${b.id}`}>
                                                    <td className="px-4 py-3 font-medium text-secondary">{b.first_name} {b.last_name}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{b.email}<br />{b.mobile}</td>
                                                    <td className="px-4 py-3 text-secondary">{formatDate(b.created_at)}</td>
                                                    <td className="px-4 py-3 text-secondary">{formatTime(b.created_at)}</td>
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
                </div>
            )}
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