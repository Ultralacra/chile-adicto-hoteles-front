#!/usr/bin/env node
// Script para inspeccionar un post específico y ver todos sus datos
// Uso: node scripts/inspect-post.mjs --slug=test

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

async function fetchFromSupabase(path) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!base || !anon) {
    throw new Error('Faltan variables de entorno');
  }
  
  const url = `${base}/rest/v1${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  
  return res.json();
}

async function inspectPost(slug) {
  console.log(`\n🔍 Inspeccionando post: "${slug}"\n`);
  console.log('='.repeat(60));
  
  try {
    // Obtener el post con todas sus relaciones
    const select = 'slug,featured_image,website,instagram,website_display,instagram_display,email,phone,photos_credit,address,hours,reservation_link,reservation_policy,interesting_fact,site,images:post_images(url,position),locations:post_locations(*),translations:post_translations(*),useful:post_useful_info(*),category_links:post_category_map(category:categories(slug,label_es,label_en))';
    
    const posts = await fetchFromSupabase(`/posts?slug=eq.${encodeURIComponent(slug)}&select=${encodeURIComponent(select)}`);
    
    if (!posts || posts.length === 0) {
      console.log('❌ Post no encontrado\n');
      return;
    }
    
    const post = posts[0];
    
    console.log('\n📋 INFORMACIÓN BÁSICA');
    console.log('─'.repeat(60));
    console.log(`Slug:           ${post.slug}`);
    console.log(`Site:           ${post.site || '(sin sitio)'}`);
    console.log(`Featured Image: ${post.featured_image || '(ninguna)'}`);
    console.log(`Website:        ${post.website || '(ninguno)'}`);
    console.log(`Instagram:      ${post.instagram || '(ninguno)'}`);
    console.log(`Email:          ${post.email || '(ninguno)'}`);
    console.log(`Phone:          ${post.phone || '(ninguno)'}`);
    console.log(`Address:        ${post.address || '(ninguna)'}`);
    
    console.log('\n🌍 TRADUCCIONES');
    console.log('─'.repeat(60));
    const translations = Array.isArray(post.translations) ? post.translations : [];
    
    if (translations.length === 0) {
      console.log('⚠️  No hay traducciones');
    } else {
      translations.forEach(tr => {
        console.log(`\n[${tr.lang?.toUpperCase() || '??'}]`);
        console.log(`  Nombre:      ${tr.name || '(vacío)'}`);
        console.log(`  Subtítulo:   ${tr.subtitle || '(vacío)'}`);
        console.log(`  Categoría:   ${tr.category || '(vacía)'}`);
        console.log(`  Descripción: ${Array.isArray(tr.description) ? tr.description.length + ' párrafos' : '(vacía)'}`);
        if (tr.info_html) {
          console.log(`  Info HTML:   ${tr.info_html.substring(0, 50)}...`);
        }
      });
    }
    
    console.log('\n🏷️  CATEGORÍAS');
    console.log('─'.repeat(60));
    const categoryLinks = Array.isArray(post.category_links) ? post.category_links : [];
    
    if (categoryLinks.length === 0) {
      console.log('⚠️  No hay categorías asignadas');
    } else {
      categoryLinks.forEach(link => {
        const cat = link.category;
        console.log(`  - ${cat?.slug || '?'} (${cat?.label_es || '?'} / ${cat?.label_en || '?'})`);
      });
    }
    
    console.log('\n📸 IMÁGENES');
    console.log('─'.repeat(60));
    const images = Array.isArray(post.images) ? post.images : [];
    
    if (images.length === 0) {
      console.log('⚠️  No hay imágenes');
    } else {
      console.log(`Total: ${images.length} imágenes`);
      images
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.url} (pos: ${img.position ?? 0})`);
        });
    }
    
    console.log('\n📍 UBICACIONES');
    console.log('─'.repeat(60));
    const locations = Array.isArray(post.locations) ? post.locations : [];
    
    if (locations.length === 0) {
      console.log('⚠️  No hay ubicaciones');
    } else {
      locations
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .forEach((loc, idx) => {
          console.log(`\n  Ubicación ${idx + 1}:`);
          console.log(`    Label:    ${loc.label || '(sin label)'}`);
          console.log(`    Address:  ${loc.address || '(sin dirección)'}`);
          console.log(`    Hours:    ${loc.hours || '(sin horario)'}`);
          console.log(`    Website:  ${loc.website || '(sin sitio web)'}`);
          console.log(`    Phone:    ${loc.phone || '(sin teléfono)'}`);
        });
    }
    
    console.log('\n');
    console.log('='.repeat(60));
    console.log('✅ Inspección completada\n');
    
    // Verificar si pasaría los filtros del frontend
    console.log('🔍 VERIFICACIÓN DE FILTROS DEL FRONTEND');
    console.log('─'.repeat(60));
    
    const postSite = post.site || '(sin sitio)';
    
    // Filtro 1: HIDDEN_FRONT_SLUGS
    const hiddenSlugs = ['w-santiago'];
    const isHidden = hiddenSlugs.includes(post.slug);
    console.log(`  HIDDEN_FRONT_SLUGS: ${isHidden ? '❌ BLOQUEADO' : '✅ Pasa'}`);
    
    // Filtro 2: Sitio correcto
    console.log(`\n  Verificación por sitio:`);
    console.log(`    Post pertenece a: ${postSite}`);
    
    const sitesToCheck = ['santiagoadicto', 'chileadicto'];
    sitesToCheck.forEach(siteId => {
      const matchesSite = !post.site || post.site === siteId;
      const willShow = matchesSite && !isHidden;
      console.log(`    En ${siteId}: ${willShow ? '✅ SE MUESTRA' : `❌ OCULTO (${post.site !== siteId ? 'pertenece a ' + postSite : 'sin motivo'})`}`);
    });
    
    // Filtro 3: Restaurantes
    const esTranslation = translations.find(t => t.lang === 'es');
    const enTranslation = translations.find(t => t.lang === 'en');
    const esCat = esTranslation?.category?.toUpperCase();
    const enCat = enTranslation?.category?.toUpperCase();
    const categoryLabels = categoryLinks.map(c => c.category?.label_es?.toUpperCase());
    
    const isRestaurant = (
      categoryLabels.includes('RESTAURANTES') ||
      categoryLabels.includes('RESTAURANTS') ||
      esCat === 'RESTAURANTES' ||
      enCat === 'RESTAURANTS' ||
      enCat === 'RESTAURANTES'
    );
    
    console.log(`\n  Filtro Restaurantes: ${isRestaurant ? '❌ BLOQUEADO en Home' : '✅ Pasa'}`);
    
    // Filtro 4: w-santiago
    const isWSantiago = post.slug === 'w-santiago';
    console.log(`  Filtro w-santiago:   ${isWSantiago ? '❌ BLOQUEADO' : '✅ Pasa'}`);
    
    console.log('\n');
    
    console.log('📊 RESUMEN:');
    console.log('─'.repeat(60));
    if (post.site === 'chileadicto') {
      const willShow = !isHidden && !isRestaurant && !isWSantiago;
      console.log(`  Con ?previewSite=chileadicto: ${willShow ? '✅ SE MUESTRA' : '❌ NO SE MUESTRA'}`);
      console.log(`  Con ?previewSite=santiagoadicto: ❌ NO SE MUESTRA (pertenece a chileadicto)`);
    } else if (post.site === 'santiagoadicto') {
      const willShow = !isHidden && !isRestaurant && !isWSantiago;
      console.log(`  Con ?previewSite=santiagoadicto: ${willShow ? '✅ SE MUESTRA' : '❌ NO SE MUESTRA'}`);
      console.log(`  Con ?previewSite=chileadicto: ❌ NO SE MUESTRA (pertenece a santiagoadicto)`);
    } else {
      console.log(`  ⚠️  Post sin sitio asignado - solo se muestra en santiagoadicto`);
    }
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs();
  const slug = args.slug || 'test';
  
  await inspectPost(slug);
}

main();
