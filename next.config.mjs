/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "@libsql/linux-x64-musl", "libsql"],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
