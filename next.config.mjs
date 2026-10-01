/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'xtctddbjwmmeirjltatm.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'azure-seal-918691.hostingersite.com',
      },
    ],
  },
  async rewrites() {
    // Rutas "bonitas":
    // - Categorías sin prefijo: /iconos -> /categoria/iconos, etc.
    // - Posts sin prefijo: /mi-post -> /lugar/mi-post (evitando colisiones con rutas reservadas)
    const categoryPattern =
      ':slug(iconos|ninos|arquitectura|barrios|mercados|miradores|museos|palacios|parques|paseos-fuera-de-santiago|restaurantes|monumentos-nacionales|cafes)';
      const rules = [
      // Categorías sin prefijo
      {
        source: `/:${categoryPattern}`.replace('::', ':'),
        destination: '/categoria/:slug',
      },
      // Posts sin prefijo (excluir rutas reservadas mediante negative lookahead)
      {
        source:
          '/:slug((?!admin|api|cms-api|categoria|votacion|resultados|lugar|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|imagenes-slider|slider-desktop|slider-movil|flags|public).+)',
        destination: '/lugar/:slug',
      },
    ];

    return rules;
  },
};

export default nextConfig
