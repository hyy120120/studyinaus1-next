import { NextResponse } from "next/server";
import { createEmailOtp, emailOtpConfigured, OTP_COOKIE, otpCookieOptions } from "@/lib/emailOtp";

export async function POST(request) {
    let email = "";
    try { ({ email = "" } = await request.json()); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
    email = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!emailOtpConfigured()) return NextResponse.json({ error: "Email verification is not configured. Please contact support." }, { status: 503 });

    const otp = createEmailOtp(email);
    const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: process.env.OTP_FROM_EMAIL,
            to: [email],
            subject: "Your GoStudyInAustralia verification code",
            html: `<p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp.code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
        }),
    });
    if (!resendResponse.ok) return NextResponse.json({ error: "Could not send the verification email. Please try again." }, { status: 502 });

    const response = NextResponse.json({ sent: true });
    response.cookies.set(OTP_COOKIE, otp.cookieValue, otpCookieOptions(otp.maxAge));
    return response;
}
