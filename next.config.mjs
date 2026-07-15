/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Serve uploaded marksheets from public/uploads ─────────────────────────
  async headers() {
    return [
      {
        source  : '/uploads/:path*',
        headers : [
          {
            key  : 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ── Next.js 15+ moved this key out of experimental ────────────────────────
  serverExternalPackages: ['sharp', 'tesseract.js'],

};

export default nextConfig;