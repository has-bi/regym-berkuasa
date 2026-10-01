/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  // The Program tab was folded into Lift; old bookmarks land there instead of a 404.
  async redirects() {
    return [{ source: "/program", destination: "/log", permanent: false }];
  },
};

export default nextConfig;
