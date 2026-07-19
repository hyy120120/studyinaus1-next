"use client";

import { collection, getDocs } from "firebase/firestore";
import { COLLECTIONS, db, isFirebaseConfigured } from "@/lib/firebase";

// A browser-session cache prevents a second Firestore read when a visitor
// moves between the course catalogue and the calculator. It deliberately does
// not persist to storage, so a reload always sees the latest admin changes.
let cachedCourses;
let pendingCoursesRequest;

export async function getManagedCourses() {
    if (!isFirebaseConfigured || !db) return null;
    if (cachedCourses !== undefined) return cachedCourses;

    if (!pendingCoursesRequest) {
        pendingCoursesRequest = getDocs(collection(db, COLLECTIONS.COURSES))
            .then((snapshot) => {
                cachedCourses = snapshot.docs.map((course) => ({ id: course.id, ...course.data() }));
                return cachedCourses;
            })
            .catch(() => {
                // Preserve each caller's existing local-catalogue fallback.
                cachedCourses = [];
                return cachedCourses;
            })
            .finally(() => {
                pendingCoursesRequest = undefined;
            });
    }

    return pendingCoursesRequest;
}

export function invalidateManagedCourses() {
    cachedCourses = undefined;
    pendingCoursesRequest = undefined;
}
