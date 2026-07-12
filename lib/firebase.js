"use client";

// Firebase is this project's data store, replacing the Emergent/MongoDB
// backend entirely. Visa assessments and course inquiries are written to
// Firestore directly from the browser; the admin dashboard authenticates
// with Firebase Auth and reads them back.
//
// Configure via environment variables (see .env.local.example). Until those
// are set, Firebase calls will throw — forms will show a clear error toast
// instead of failing silently.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED_FIREBASE_CONFIG = [
    "apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId",
];

export const missingFirebaseConfig = REQUIRED_FIREBASE_CONFIG.filter((key) => !firebaseConfig[key]);
export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export const COLLECTIONS = {
    VISA_APPLICATIONS: "visa_applications",
    COURSE_INQUIRIES: "course_inquiries",
    COUNSELLING_BOOKINGS: "counselling_bookings",
    CONSENT_AUDIT_LOGS: "consent_audit_logs",
};
