import { NextResponse } from "next/server";

// Generic document upload endpoint — stores files in Cloudinary.
// Used by the visa calculator for sponsor income-proof documents.
// The marksheet OCR flow has its own route (app/api/ocr/route.js).

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
];
const MAX_MB = 10;

export async function POST(request) {
    try {
        const { isCloudinaryConfigured, uploadToCloudinary } = await import(
            "../../../lib/cloudinary"
        );

        if (!isCloudinaryConfigured) {
            return NextResponse.json(
                {
                    error: "Document storage is not configured. Set the CLOUDINARY_* environment variables.",
                },
                { status: 503 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("document");
        const folder =
            String(formData.get("folder") || "documents").replace(
                /[^\w-]+/g,
                "_",
            ) || "documents";

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 },
            );
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG and PDF allowed." },
                { status: 400 },
            );
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            return NextResponse.json(
                { error: `File too large. Max ${MAX_MB} MB.` },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const result = await uploadToCloudinary(buffer, folder, fileName);

        return NextResponse.json({
            success: true,
            fileUrl: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Upload route error:", error);
        return NextResponse.json(
            { error: "Upload failed", message: error.message },
            { status: 500 },
        );
    }
}
