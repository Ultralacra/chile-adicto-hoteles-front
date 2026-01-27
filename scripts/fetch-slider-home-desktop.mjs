#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

async function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const f of files) {
    try {
      const content = await fs.readFile(path.join(process.cwd(), f), 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const l = line.trim();
        if (!l || l.startsWith('#')) return;
        const i = l.indexOf('=');
        if (i === -1) return;
        const k = l.slice(0, i).trim();
        let v = l.slice(i + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (!process.env[k]) process.env[k] = v;
      });
    } catch (e) {
      // ignore
    }
  }
}

async function run() {
  await loadEnv();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !KEY) {
    console.error('Faltan variables de entorno SUPABASE_URL/KEY en .env.local');
    process.exit(1);
  }

  const setKey = 'home-desktop';
  const site = 'chileadicto';
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/sliders?set_key=eq.${encodeURIComponent(setKey)}&site=eq.${encodeURIComponent(site)}&select=set_key,image_url,href,position,active,lang&order=position.asc`;

  const res = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' } });
  if (!res.ok) {
    const t = await res.text();
    console.error('Error al consultar Supabase', res.status, t);
    process.exit(1);
  }
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

run().catch((e) => { console.error(e); process.exit(1); });
