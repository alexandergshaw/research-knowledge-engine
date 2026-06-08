/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  // Ensure the taxonomy YAML (which lives at the repo root, outside this app)
  // is bundled into the serverless function that serves /api/categories.
  outputFileTracingIncludes: {
    "/api/categories": ["../../data/source_categories.yaml"],
  },
};

module.exports = nextConfig;
