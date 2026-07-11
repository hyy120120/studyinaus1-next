import { NextResponse } from "next/server";

export function GET(request) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || null;
    return NextResponse.json({ ipAddress });
}
