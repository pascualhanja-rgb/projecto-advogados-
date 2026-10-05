import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://kizua-legal.onrender.com";
let apiHost = "kizua-legal.onrender.com";

try {
  apiHost = new URL(apiUrl).hostname;
} catch {
  /* mantém o host padrão */
}

const nextConfig: NextConfig = {
 devIndicators: false,
  
  images: {
    remotePatterns: [
      { protocol: "https", hostname: apiHost },
      { protocol: "http", hostname: apiHost },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
