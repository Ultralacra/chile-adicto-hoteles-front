#!/usr/bin/env node
// Script para mover múltiples posts entre sitios
// Uso interactivo: node scripts/move-multiple-posts.mjs
// Uso no interactivo: node scripts/move-multiple-posts.mjs --slugs=slug1,slug2,slug3 --to=chileadicto

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

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

async function fetchFromSupabase(path, options = {}) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!base || !service) {
    throw new Error('Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const url = `${base}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      Prefer: 'return=representation',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

async function listPostsBySite() {
  console.log('\n📊 Posts por sitio:\n');
  
  const posts = await fetchFromSupabase('/posts?select=slug,site');
  
  const bySite = { santiagoadicto: [], chileadicto: [], other: [] };
  
  posts.forEach(post => {
    const site = post.site || 'other';
    if (bySite[site]) {
      bySite[site].push(post.slug);
    } else {
      bySite.other.push(post.slug);
    }
  });
  
  console.log(`🏙️  Santiago Adicto (${bySite.santiagoadicto.length} posts):`);
  if (bySite.santiagoadicto.length <= 20) {
    bySite.santiagoadicto.forEach(slug => console.log(`   - ${slug}`));
  } else {
    console.log(`   (Demasiados para mostrar, usa el filtro de búsqueda)`);
  }
  
  console.log(`\n🏨 Chile Adicto (${bySite.chileadicto.length} posts):`);
  bySite.chileadicto.forEach(slug => console.log(`   - ${slug}`));
  
  if (bySite.other.length > 0) {
    console.log(`\n⚠️  Sin sitio asignado (${bySite.other.length} posts):`);
    bySite.other.forEach(slug => console.log(`   - ${slug}`));
  }
  
  return { bySite, posts };
}

async function movePost(slug, toSite) {
  console.log(`\n🔄 Moviendo ${slug} -> ${toSite}...`);
  
  try {
    // Buscar el post
    const posts = await fetchFromSupabase(`/posts?slug=eq.${encodeURIComponent(slug)}&select=id,site`);
    
    if (!posts || posts.length === 0) {
      console.log(`❌ No se encontró el post: ${slug}`);
      return false;
    }
    
    const post = posts[0];
    console.log(`   Encontrado (sitio actual: ${post.site})`);
    
    // Actualizar
    await fetchFromSupabase(`/posts?id=eq.${post.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ site: toSite }),
    });
    
    console.log(`   ✅ Movido exitosamente a ${toSite}`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
  
  try {
    await listPostsBySite();
    
    console.log('\n' + '='.repeat(60));
    console.log('MODO INTERACTIVO - Mover posts entre sitios');
    console.log('='.repeat(60));
    
    const slugsInput = await question('\n📝 Ingresa los slugs de los posts a mover (separados por coma):\n> ');
    const toSite = await question('\n🎯 Sitio destino (santiagoadicto / chileadicto):\n> ');
    
    if (!toSite || (toSite !== 'santiagoadicto' && toSite !== 'chileadicto')) {
      console.log('\n❌ Sitio destino inválido');
      return;
    }
    
    const slugs = slugsInput.split(',').map(s => s.trim()).filter(Boolean);
    
    if (slugs.length === 0) {
      console.log('\n❌ No se ingresaron slugs válidos');
      return;
    }
    
    console.log(`\n📦 Se moverán ${slugs.length} posts a ${toSite}`);
    const confirm = await question('\n⚠️  ¿Confirmas? (si/no): ');
    
    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Operación cancelada');
      return;
    }
    
    let moved = 0;
    let failed = 0;
    
    for (const slug of slugs) {
      const success = await movePost(slug, toSite);
      if (success) moved++;
      else failed++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Completado: ${moved} movidos, ${failed} fallidos`);
    console.log('='.repeat(60));
    
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs();
  
  // Modo no interactivo
  if (args.slugs && args.to) {
    const slugs = args.slugs.split(',').map(s => s.trim()).filter(Boolean);
    const toSite = args.to;
    
    if (toSite !== 'santiagoadicto' && toSite !== 'chileadicto') {
      console.error('❌ Sitio destino inválido. Usa: santiagoadicto o chileadicto');
      process.exit(1);
    }
    
    console.log(`📦 Moviendo ${slugs.length} posts a ${toSite}...`);
    
    let moved = 0;
    let failed = 0;
    
    for (const slug of slugs) {
      const success = await movePost(slug, toSite);
      if (success) moved++;
      else failed++;
    }
    
    console.log(`\n✅ Completado: ${moved} movidos, ${failed} fallidos`);
    return;
  }
  
  // Modo interactivo
  await interactiveMode();
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
