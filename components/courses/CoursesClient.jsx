"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Clock3, Banknote, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURSES } from "@/data/courses";
import { db, isFirebaseConfigured, COLLECTIONS } from "@/lib/firebase";
import { validateCourseInquiry } from "@/lib/validation";

const COURSES_BG = "https://images.pexels.com/photos/31390421/pexels-photo-31390421.jpeg";

export default function CoursesClient() {
    const [q, setQ] = useState("");
    const [inquiry, setInquiry] = useState({ name: "", email: "", phone: "", field_of_interest: "", intake: "Feb 2026", message: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [managedCourses, setManagedCourses] = useState(null);

    useEffect(() => {
        if (!isFirebaseConfigured) return;

        getDocs(collection(db, COLLECTIONS.COURSES))
            .then((snapshot) => setManagedCourses(snapshot.docs.map((course) => ({ id: course.id, ...course.data() }))))
            // Keep the curated local catalogue available if Firebase is offline
            // or the public catalogue has not been deployed yet.
            .catch(() => setManagedCourses([]));
    }, []);

    const courseCatalog = useMemo(() => {
        // The local list is only a pre-migration fallback. Once courses are
        // managed in Firestore, it becomes the single source of truth so a
        // deleted course cannot reappear from the fallback catalogue.
        return managedCourses?.length ? managedCourses : COURSES;
    }, [managedCourses]);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return courseCatalog;
        return courseCatalog.filter((c) =>
            [c.title, c.university, c.city, (c.tags || []).join(" ")].join(" ").toLowerCase().includes(t)
        );
    }, [courseCatalog, q]);

    const submitInquiry = async (e) => {
        e.preventDefault();
        const fieldErrors = validateCourseInquiry(inquiry);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fix the highlighted fields before submitting.");
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            if (!isFirebaseConfigured) {
                throw new Error("Course inquiries aren't connected yet — set up Firebase to enable this form.");
            }
            await addDoc(collection(db, COLLECTIONS.COURSE_INQUIRIES), {
                ...inquiry,
                created_at: serverTimestamp(),
            });
            toast.success("Thanks! A counselor will reach out within 24 hours.");
            setInquiry({ name: "", email: "", phone: "", field_of_interest: "", intake: "Feb 2026", message: "" });
        } catch (err) {
            toast.error(err?.message || "Could not submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div data-testid="courses-page">
            <section className="relative overflow-hidden bg-secondary">
                <div className="absolute inset-0">
                    <img src={COURSES_BG} alt="" className="w-full h-full object-cover opacity-40" loading="eager" />
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/70" />
                </div>
                <div className="gsa-container py-20 md:py-28 text-white max-w-4xl relative">
                    <Reveal className="gsa-overline text-primary mb-4">Course Options</Reveal>
                    <Reveal delay={0.08}>
                        <h1 className="font-display font-black text-4xl md:text-6xl leading-tight">Curated programmes across Australia's top universities.</h1>
                    </Reveal>
                    <Reveal delay={0.16}>
                        <p className="mt-5 text-white/75 max-w-2xl">Browse a handpicked selection — or tell us your interests and we'll send tailored recommendations.</p>
                    </Reveal>
                </div>
            </section>

            <section className="gsa-section">
                <div className="gsa-container">
                    <div className="flex items-center gap-3 max-w-md mb-10 surface-card px-4 py-3">
                        <Search size={18} className="text-muted-foreground" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by course, city, university..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            data-testid="course-search-input"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((c, i) => (
                            <Reveal key={c.id} delay={Math.min(0.06 * i, 0.3)} duration={0.5} direction={i % 2 ? "right" : "left"} as="article" className="surface-card overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300" data-testid={`course-card-${c.id}`}>
                                <div className="aspect-[16/10] overflow-hidden bg-muted">
                                    <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="gsa-overline mb-2">{c.university}</div>
                                    <h3 className="font-display font-bold text-xl text-secondary leading-snug mb-3">{c.title}</h3>
                                    <div className="text-sm text-muted-foreground space-y-1 mb-4">
                                        <div className="flex items-center gap-2"><MapPin size={14} /> {c.city}</div>
                                        <div className="flex items-center gap-2"><Clock3 size={14} /> {c.duration}</div>
                                        <div className="flex items-center gap-2"><Banknote size={14} /> AUD {c.tuition_aud.toLocaleString()}/yr</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {(c.tags || []).map((t) => (
                                            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-secondary font-medium">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                        {filtered.length === 0 && <p className="text-muted-foreground">No courses match your search.</p>}
                    </div>
                </div>
            </section>

            {/* Inquiry form */}
            <section className="gsa-section bg-muted">
                <div className="gsa-container grid md:grid-cols-2 gap-12 items-start">
                    <Reveal>
                        <div className="gsa-overline mb-4">Course Selection Support</div>
                        <h2 className="gsa-h2 mb-4">Not sure which course is right for you?</h2>
                        <p className="gsa-body">
                            Share a few details about your background and intent. Ontrack's counsellors will get back with
                            3 tailored course-university combinations that fit your academics, budget, and long-term
                            career plan.
                        </p>
                    </Reveal>
                    <Reveal delay={0.1} as="form" onSubmit={submitInquiry} className="surface-card p-8 space-y-4" data-testid="course-inquiry-form">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Name</Label><Input data-testid="inquiry-name" required value={inquiry.name} onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
                            <div className="space-y-2"><Label>Email</Label><Input data-testid="inquiry-email" type="email" required value={inquiry.email} onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
                            <div className="space-y-2"><Label>Phone</Label><Input data-testid="inquiry-phone" required value={inquiry.phone} onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })} />{errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}</div>
                            <div className="space-y-2"><Label>Field of interest</Label><Input data-testid="inquiry-field" required value={inquiry.field_of_interest} onChange={(e) => setInquiry({ ...inquiry, field_of_interest: e.target.value })} placeholder="Data Science, Nursing..." />{errors.field_of_interest && <p className="text-xs text-destructive">{errors.field_of_interest}</p>}</div>
                            <div className="space-y-2 sm:col-span-2"><Label>Preferred intake</Label><Input data-testid="inquiry-intake" value={inquiry.intake} onChange={(e) => setInquiry({ ...inquiry, intake: e.target.value })} placeholder="Feb 2026" /></div>
                        </div>
                        <div className="space-y-2"><Label>Anything else?</Label><Textarea data-testid="inquiry-message" rows={4} value={inquiry.message} onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })} placeholder="Career goals, scholarships, PR plans..." />{errors.message && <p className="text-xs text-destructive">{errors.message}</p>}</div>
                        <button type="submit" disabled={submitting} className="btn-primary w-full" data-testid="inquiry-submit-btn">
                            {submitting ? "Submitting…" : <>Get personalised recommendations <Send size={16} /></>}
                        </button>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
