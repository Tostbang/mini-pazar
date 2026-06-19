/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

export default nextConfig
