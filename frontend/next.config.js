/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/history", destination: "/jobs", permanent: false },
      { source: "/settings", destination: "/setup", permanent: false },
      { source: "/backtest", destination: "/scorecard", permanent: false },
      { source: "/runs/:id", destination: "/jobs/:id", permanent: false },
      { source: "/runs/:id/agents", destination: "/jobs/:id", permanent: false },
      { source: "/runs/:id/debate", destination: "/jobs/:id", permanent: false },
      { source: "/runs/:id/decision", destination: "/jobs/:id", permanent: false },
    ];
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/ws/:path*", destination: `${backend}/ws/:path*` },
    ];
  },
};

module.exports = nextConfig;
