"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { COURSES } from "@/data/courses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, COLLECTIONS } from "@/lib/firebase";

const emptyCourse = {
    title: "",
    university: "",
    city: "",
    duration: "",
    tuition_aud: "",
    intake: "",
    tags: "",
    image: "",
};

function toForm(course) {
    return {
        title: course.title || "",
        university: course.university || "",
        city: course.city || "",
        duration: course.duration || "",
        tuition_aud: String(course.tuition_aud || ""),
        intake: (course.intake || []).join(", "),
        tags: (course.tags || []).join(", "),
        image: course.image || "",
    };
}

function toCourseData(form) {
    return {
        title: form.title.trim(),
        university: form.university.trim(),
        city: form.city.trim(),
        duration: form.duration.trim(),
        tuition_aud: Number(form.tuition_aud),
        intake: form.intake.split(",").map((item) => item.trim()).filter(Boolean),
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        image: form.image.trim(),
    };
}

export default function CourseManager() {
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState(emptyCourse);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const loadCourses = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, COLLECTIONS.COURSES));
            setCourses(snapshot.docs.map((course) => ({ id: course.id, ...course.data() })));
        } catch (error) {
            toast.error(`Could not load courses: ${error.message || "unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCourses(); }, []);

    const displayedCourses = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return courses;
        return courses.filter((course) => [course.title, course.university, course.city, ...(course.tags || [])].join(" ").toLowerCase().includes(term));
    }, [courses, search]);

    const resetForm = () => {
        setForm(emptyCourse);
        setEditingId(null);
    };

    const saveCourse = async (event) => {
        event.preventDefault();
        const course = toCourseData(form);
        if (!course.title || !course.university || !course.city || !course.duration || !course.image || !Number.isFinite(course.tuition_aud) || course.tuition_aud <= 0) {
            toast.error("Complete all required course details and enter a valid annual tuition fee.");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, COLLECTIONS.COURSES, editingId), { ...course, updated_at: serverTimestamp() });
                toast.success("Course updated.");
            } else {
                await addDoc(collection(db, COLLECTIONS.COURSES), { ...course, created_at: serverTimestamp(), updated_at: serverTimestamp() });
                toast.success("Course added.");
            }
            resetForm();
            await loadCourses();
        } catch (error) {
            toast.error(`Could not save course: ${error.message || "unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    const importStarterCourses = async () => {
        setSaving(true);
        try {
            const existingIds = new Set(courses.map((course) => course.id));
            const missingCourses = COURSES.filter((course) => !existingIds.has(course.id));
            await Promise.all(missingCourses.map(({ id, ...course }) => setDoc(doc(db, COLLECTIONS.COURSES, id), {
                ...course,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            })));
            toast.success(missingCourses.length ? "Starter catalogue imported. You can now edit every course here." : "All starter courses are already imported.");
            await loadCourses();
        } catch (error) {
            toast.error(`Could not import starter courses: ${error.message || "unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    const removeCourse = async (course) => {
        if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, COLLECTIONS.COURSES, course.id));
            toast.success("Course deleted.");
            await loadCourses();
        } catch (error) {
            toast.error(`Could not delete course: ${error.message || "unknown error"}`);
        }
    };

    return (
        <div className="gsa-container mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <section className="surface-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                    <div><h2 className="font-display text-xl font-bold text-secondary">Course catalogue</h2><p className="mt-1 text-sm text-muted-foreground">{courses.length} managed course{courses.length === 1 ? "" : "s"}</p></div>
                    <div className="flex gap-2"><button onClick={loadCourses} className="btn-outline px-4 py-2 text-sm"><RefreshCw size={15} /> Refresh</button><button onClick={importStarterCourses} disabled={saving} className="btn-outline px-4 py-2 text-sm">Import starter courses</button></div>
                </div>
                <div className="border-b border-border p-4"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search managed courses..." /></div>
                {loading ? <p className="p-6 text-sm text-muted-foreground">Loading courses…</p> : (
                    <div className="divide-y divide-border">
                        {displayedCourses.length === 0 && <p className="p-6 text-sm text-muted-foreground">No managed courses yet. Import the starter catalogue or add your first course.</p>}
                        {displayedCourses.map((course) => <article key={course.id} className="flex gap-4 p-4">
                            <img src={course.image} alt="" className="h-20 w-28 rounded-lg object-cover bg-muted" />
                            <div className="min-w-0 flex-1"><h3 className="font-bold text-secondary">{course.title}</h3><p className="mt-1 text-sm text-muted-foreground">{course.university} · {course.city}</p><p className="mt-1 text-sm text-muted-foreground">AUD {Number(course.tuition_aud).toLocaleString()}/yr · {course.duration}</p></div>
                            <div className="flex shrink-0 gap-2"><button onClick={() => { setEditingId(course.id); setForm(toForm(course)); }} className="rounded-md p-2 text-secondary hover:bg-muted" aria-label={`Edit ${course.title}`}><Pencil size={16} /></button><button onClick={() => removeCourse(course)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" aria-label={`Delete ${course.title}`}><Trash2 size={16} /></button></div>
                        </article>)}
                    </div>
                )}
            </section>

            <aside className="surface-card h-fit p-6 xl:sticky xl:top-6">
                <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold text-secondary">{editingId ? "Edit course" : "Add course"}</h2>{editingId && <button onClick={resetForm} className="text-sm font-bold text-primary">Cancel</button>}</div>
                <form onSubmit={saveCourse} className="space-y-4">
                    <div className="space-y-2"><Label>Course title</Label><Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>University</Label><Input required value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>City</Label><Input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div><div className="space-y-2"><Label>Duration</Label><Input required placeholder="2 years" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></div></div>
                    <div className="space-y-2"><Label>Annual tuition (AUD)</Label><Input required type="number" min="1" value={form.tuition_aud} onChange={(event) => setForm({ ...form, tuition_aud: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Intakes</Label><Input placeholder="Feb, Jul" value={form.intake} onChange={(event) => setForm({ ...form, intake: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Tags</Label><Input placeholder="IT, AI, Software" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Image URL</Label><Input required type="url" placeholder="https://..." value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></div>
                    <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : <>{editingId ? "Update course" : "Add course"} <Plus size={16} /></>}</button>
                </form>
            </aside>
        </div>
    );
}
