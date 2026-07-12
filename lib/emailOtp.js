import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

export const OTP_COOKIE = "calculator_email_otp";
const OTP_TTL_SECONDS = 10 * 60;

function secret() {
    return process.env.EMAIL_OTP_SECRET;
}

function encode(payload) {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(value) {
    return createHmac("sha256", secret()).update(value).digest("base64url");
}

function hash(code, salt) {
    return createHash("sha256").update(`${code}:${salt}`).digest("hex");
}

export function emailOtpConfigured() {
    return Boolean(process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL && secret());
}

export function createEmailOtp(email) {
    const code = String(randomInt(100000, 1000000));
    const salt = randomBytes(16).toString("hex");
    const payload = encode({ email, hash: hash(code, salt), salt, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 });
    return { code, cookieValue: `${payload}.${sign(payload)}`, maxAge: OTP_TTL_SECONDS };
}

export function verifyEmailOtp(cookieValue, code) {
    if (!cookieValue || !/^\d{6}$/.test(code || "") || !secret()) return null;
    const dot = cookieValue.lastIndexOf(".");
    if (dot < 1) return null;
    const payload = cookieValue.slice(0, dot);
    const signature = cookieValue.slice(dot + 1);
    const expectedSignature = sign(payload);
    if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!data.email || !data.salt || !data.hash || data.expiresAt < Date.now()) return null;
        const candidateHash = hash(code, data.salt);
        if (!timingSafeEqual(Buffer.from(candidateHash), Buffer.from(data.hash))) return null;
        return data.email;
    } catch {
        return null;
    }
}

export function otpCookieOptions(maxAge = 0) {
    return { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge };
}
