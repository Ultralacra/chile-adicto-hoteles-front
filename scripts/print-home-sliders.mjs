#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

function proxyImageUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return raw;
  const withoutProtocol = raw.replace(/^https?:\/\//i, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`;
}

const HOME_SLIDES_FALLBACK = [
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/EXPLORACIONES-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/4-INCREIBLES-EXPLORACIONES-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2026/01/SLD-REMANSO-1.webp',
    mobile: null,
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/TERMAS-DE-CHILLAN-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/TERMAS-DE-CHILLAN-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/CORRALCO-HOTEL-SPA-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/CORRALCO-HOTEL-SPA-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2024/12/best.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2024/12/best-movil.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/THE-SINGULAR-PATAGONIA-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/THE-SINGULAR-PATAGONIA-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/TAKA-MATANZAS-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/TAKA-MATANZAS-MOVIL1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/AWA-PUERTO-VARAS-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/AWA-PUERTO-VARAS-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/CASA-REAL-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/CASA-REAL-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/DEBAINES-HOTEL-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/DEBAINES-HOTEL-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/CASA-ZAPALLAR-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/05/SLM-CASA-ZAPALLAR.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/CUMBRES-SAN-PEDRO-DE-ATACAMA-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/CUMBRES-SAN-PEDRO-DE-ATACAMA-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/NOI-INDIGO-PATAGONIA-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/NOI-INDIGO-PATAGONIA-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/OUR-HABITAS-ATACAMA-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/OUR-HABITAS-ATACAMA-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/TAWA-REFUGIO-PUELO-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/TAWA-REFUGIO-PUELO-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/CASAMOLLE-ELQUI-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/CASAMOLLE-ELQUI-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/NOI-PUMA-LODGE-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/NOI-PUMA-LODGE-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2026/01/VIVELO-ELQUI-1.webp',
    mobile: null,
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/07/REMOTA-PATAGONIA-LODGE-1.webp',
    mobile: 'https://chileadictohoteles.cl/wp-content/uploads/2025/08/REMOTA-PATAGONIA-LODGE-MOVIL-1.webp',
  },
  {
    desktop: 'https://chileadictohoteles.cl/wp-content/uploads/2025/12/SLD-PUYUHUAPI-1.webp',
    mobile: null,
  },
];

function fallbackDesktopImages() {
  return HOME_SLIDES_FALLBACK.map((slide) => proxyImageUrl(slide.desktop));
}

function fallbackMobileImages() {
  return HOME_SLIDES_FALLBACK.map((slide) => proxyImageUrl(slide.mobile || slide.desktop));
}

async function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(process.cwd(), file), 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index === -1) return;
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      });
    } catch {
      // Ignorar si el archivo no existe.
    }
  }
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !apiKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y una key de Supabase (.env.local o .env).',
    );
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    apiKey,
  };
}

async function fetchSliderSet({ supabaseUrl, apiKey, site, setKey }) {
  const query = new URLSearchParams({
    set_key: `eq.${setKey}`,
    site: `eq.${site}`,
    select: 'set_key,image_url,href,position,active,lang',
    order: 'position.asc',
  });

  const url = `${supabaseUrl}/rest/v1/sliders?${query.toString()}`;
  const response = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error ${response.status} consultando ${setKey}: ${body}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

function formatItem(item, index) {
  const position = Number.isFinite(item?.position) ? Number(item.position) : index;
  const active = item?.active === false ? 'no' : 'si';
  const lang = item?.lang ? String(item.lang) : '-';
  const href = item?.href ? String(item.href) : '(sin href en backend)';
  const imageUrl = item?.image_url ? String(item.image_url) : '(sin image_url)';

  return [
    `${String(position).padStart(2, '0')}. active=${active} lang=${lang}`,
    `href: ${href}`,
    `image: ${imageUrl}`,
  ].join('\n');
}

function printRenderedGroup(label, routePath, items, fallbackImages) {
  console.log(`\n=== Render efectivo: ${label} ===`);
  console.log(`Ruta fuente: ${routePath}`);

  const renderedImages = items.length
    ? items.map((item) => String(item?.image_url || '').trim()).filter(Boolean)
    : fallbackImages;

  if (!renderedImages.length) {
    console.log('(sin imágenes renderizadas)');
    return;
  }

  renderedImages.forEach((imageUrl, index) => {
    console.log(`${String(index).padStart(2, '0')}. ${imageUrl}`);
  });
}

async function run() {
  await loadEnv();

  const site = process.argv[2] || process.env.NEXT_PUBLIC_SITE_ID || 'chileadicto';
  const sets = [
    ['Home desktop ES', 'home-desktop', '/api/sliders/home-desktop'],
    ['Home desktop EN', 'HOME INGLES DESKTOP', '/api/sliders/HOME%20INGLES%20DESKTOP'],
    ['Home mobile ES', 'HOME MOVIL ESPAÑOL', '/api/sliders/HOME%20MOVIL%20ESPA%C3%91OL'],
    ['Home mobile EN', 'HOME MOVIL INGLES', '/api/sliders/HOME%20MOVIL%20INGLES'],
  ];

  const config = getSupabaseConfig();
  const loadedSets = new Map();

  console.log(`Site: ${site}`);
  console.log('Rutas que consume la home: /api/sliders/home-desktop, /api/sliders/home-desktop-ingles, /api/sliders/home-movil-español y /api/sliders/home-movil-ingles.');
  console.log('Nota: la home actual consume las imágenes desde backend, pero no usa los href del backend en el render.');

  for (const [label, setKey, routePath] of sets) {
    console.log(`\n=== ${label} (${setKey}) ===`);
    console.log(`Ruta API: ${routePath}`);
    const items = await fetchSliderSet({ ...config, site, setKey });
    loadedSets.set(setKey, items);

    if (!items.length) {
      console.log('(sin items)');
      continue;
    }

    items.forEach((item, index) => {
      console.log(formatItem(item, index));
      console.log('');
    });
  }

  printRenderedGroup(
    'desktop ES',
    '/api/sliders/home-desktop',
    loadedSets.get('home-desktop') || [],
    fallbackDesktopImages(),
  );
  printRenderedGroup(
    'desktop EN',
    '/api/sliders/home-desktop-ingles',
    loadedSets.get('home-desktop-ingles') || [],
    [],
  );
  printRenderedGroup(
    'mobile ES',
    '/api/sliders/home-movil-español',
    loadedSets.get('home-movil-español') || [],
    fallbackMobileImages(),
  );
  printRenderedGroup(
    'mobile EN',
    '/api/sliders/home-movil-ingles',
    loadedSets.get('home-movil-ingles') || [],
    [],
  );
}

run().catch((error) => {
  console.error(String(error?.message || error));
  process.exit(1);
});