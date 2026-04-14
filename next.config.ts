import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Isso impede que o Next.js tente rodar o motor do Tailwind no navegador
  serverExternalPackages: ["@tailwindcss/postcss", "tailwindcss"],
  
  /* Se o erro de 'fs' persistir no Turbopack, descomente as linhas abaixo: */
  /*
  experimental: {
    turbo: {
      resolveAlias: {
        fs: false,
      },
    },
  },
  */
};

export default nextConfig;