/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "openmoji.org",
        pathname: "/data/color/svg/**",
      },
    ],
  },
};

export default nextConfig;
