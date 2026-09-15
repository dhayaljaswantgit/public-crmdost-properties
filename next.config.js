/** @type {import('next').NextConfig} */
module.exports = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  // Next 15 infers the workspace root from the nearest lockfile, and this repo
  // sits inside a super-project that has one; pin it so build traces stay
  // scoped to this project.
  outputFileTracingRoot: __dirname,
  experimental: {
    // Next 15 stopped reusing dynamic page segments from the client router
    // cache (staleTimes.dynamic 30s → 0). Keep the Next 14 value so revisiting
    // a listing or company page within 30s does not re-render it on the server.
    staleTimes: { dynamic: 30 },
  },
};
