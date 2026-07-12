import { NextResponse } from "next/server";
import { OTP_COOKIE, otpCookieOptions, verifyEmailOtp } from "@/lib/emailOtp";

export async function POST(request) {
    let code = "";
    try { ({ code = "" } = await request.json()); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
    const email = verifyEmailOtp(request.cookies.get(OTP_COOKIE)?.value, String(code));
    if (!email) return NextResponse.json({ error: "This verification code is invalid or has expired." }, { status: 400 });
    const response = NextResponse.json({ verified: true, email });
    response.cookies.set(OTP_COOKIE, "", otpCookieOptions(0));
    return response;
}
