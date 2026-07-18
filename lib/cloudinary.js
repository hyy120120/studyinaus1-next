// Server-side Cloudinary helper.
//
// Used by:
//   • app/api/ocr/route.js    — stores marksheet scans (folder = level key)
//   • app/api/upload/route.js — stores sponsor income-proof documents
//
// Configure via environment variables (server-only — never expose the API
// secret through NEXT_PUBLIC_*):
//   CLOUDINARY_CLOUD_NAME=...
//   CLOUDINARY_API_KEY=...
//   CLOUDINARY_API_SECRET=...

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

// Uploads a Buffer and resolves with the Cloudinary result
// ({ secure_url, public_id, ... }). Files land under gsa/<folder>/<fileName>.
export function uploadToCloudinary(buffer, folder, fileName) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `gsa/${folder}`,
                public_id: fileName,
                resource_type: "auto",
            },
            (error, result) => (error ? reject(error) : resolve(result)),
        );
        stream.end(buffer);
    });
}

export default cloudinary;
