#!/usr/bin/env node
// Script simple para mover un post entre sitios via Supabase REST usando la SUPABASE_SERVICE_ROLE_KEY
// Uso: node scripts/move-post-site.mjs --slug=mi-slug --from=santiagoadicto --to=chileadicto

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer .env.local manualmente
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        // Tomar la última ocurrencia de cada variable
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error leyendo .env.local:', error.message);
    return {};
  }
}

const env = loadEnv();

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const slug = args.slug;
  const from = args.from;
  const to = args.to;
  if (!slug || !from || !to) {
    console.error('Uso: node scripts/move-post-site.mjs --slug=SLUG --from=OLD_SITE --to=NEW_SITE');
    process.exit(2);
  }

  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !service) {
    console.error('Asegura que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén en .env.local');
    process.exit(2);
  }

  const headers = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    Prefer: 'return=representation',
    'Content-Type': 'application/json',
  };

  try {
    console.log(`Buscando post slug=${slug} site=${from}...`);
    const q = `${base}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&site=eq.${encodeURIComponent(from)}&select=id`;
    const res = await fetch(q, { headers });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Error buscando post: ${res.status} ${t}`);
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('No se encontró el post con ese slug en el sitio origen.');
      process.exit(1);
    }
    const id = rows[0].id;
    console.log('Encontrado id=', id, ' -> actualizando site ->', to);

    const patchUrl = `${base}/rest/v1/posts?id=eq.${id}`;
    const p = await fetch(patchUrl, { method: 'PATCH', headers, body: JSON.stringify({ site: to }) });
    if (!p.ok) {
      const t = await p.text();
      throw new Error(`Error al actualizar post: ${p.status} ${t}`);
    }
    const updated = await p.json();
    console.log('Actualizado:', updated);
    console.log('Hecho. Verifica el frontend y/o el admin.');
  } catch (e) {
    console.error('Error:', e?.message || e);
    process.exit(1);
  }
}

main();
