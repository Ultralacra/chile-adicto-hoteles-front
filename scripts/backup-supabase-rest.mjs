#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

function parseEnv(content) {
  const lines = String(content).split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = process.env[key] ?? val;
  }
}

async function loadEnvFiles() {
  const cwd = process.cwd();
  const candidates = [".env.local", ".env"];
  for (const f of candidates) {
    try {
      const p = path.join(cwd, f);
      const content = await fs.readFile(p, "utf8");
      parseEnv(content);
    } catch (err) {
      // ignore missing
    }
  }
}

function nowTs() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function fetchTable(supabaseUrl, key, table) {
  const base = supabaseUrl.replace(/\/$/, "");
  const url = `${base}/rest/v1/${table}?select=*`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  const res = await fetch(url, { headers });
  return res;
}

async function run() {
  await loadEnvFiles();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Faltan variables de entorno: asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const timestamp = nowTs();
  const outDir = path.join(process.cwd(), "backups", `supabase-rest-${timestamp}`);
  await fs.mkdir(outDir, { recursive: true });

  // Tablas comunes en este proyecto. Ajusta si falta alguna.
  const tables = [
    "categories",
    "media",
    "post_category_map",
    "post_images",
    "post_locations",
    "post_translations",
    "post_useful_info",
    "posts",
    "sliders",
  ];

  const manifest = { created_at: new Date().toISOString(), source: SUPABASE_URL, tables: [] };

  for (const table of tables) {
    try {
      process.stdout.write(`Respaldando tabla ${table}... `);
      const res = await fetchTable(SUPABASE_URL, SERVICE_KEY, table);
      if (!res.ok) {
        const txt = await res.text();
        console.error(`ERROR ${res.status} al obtener ${table}`);
        await fs.writeFile(path.join(outDir, `${table}-error.txt`), txt, "utf8");
        manifest.tables.push({ table, ok: false, status: res.status });
        continue;
      }
      const json = await res.json();
      await fs.writeFile(path.join(outDir, `${table}.json`), JSON.stringify(json, null, 2), "utf8");
      console.log(`OK (${Array.isArray(json) ? json.length : "?"} filas)`);
      manifest.tables.push({ table, ok: true, rows: Array.isArray(json) ? json.length : null });
    } catch (err) {
      console.error(`ERROR al respaldar ${table}: ${String(err.message || err)}`);
      manifest.tables.push({ table, ok: false, error: String(err.message || err) });
    }
  }

  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Respaldo completado en ${outDir}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
