import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Varsayılan 1MB — yorum görseli eklerken gerçek telefon fotoğrafları
      // (birkaç MB) bu sınırı aşıp Server Action'a hiç ulaşmadan reddediliyordu.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
