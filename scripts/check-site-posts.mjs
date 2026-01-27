// Script para verificar qué posts están asignados a cada sitio
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
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Falta configurar NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function fetchFromSupabase(path) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  
  return res.json();
}

async function checkSitePosts() {
  console.log('🔍 Verificando posts por sitio...\n');
  
  try {
    // Obtener todos los posts con site
    const posts = await fetchFromSupabase('/posts?select=slug,site');
    
    // Contar por sitio
    const countBySite = {};
    posts.forEach(post => {
      const site = post.site || 'sin-sitio';
      countBySite[site] = (countBySite[site] || 0) + 1;
    });
    
    console.log('📊 Resumen:');
    console.log('─'.repeat(50));
    for (const [site, count] of Object.entries(countBySite)) {
      console.log(`  ${site}: ${count} posts`);
    }
    console.log('─'.repeat(50));
    console.log(`  Total: ${posts.length} posts\n`);
    
    // Mostrar posts de chileadicto
    const chileadictoPosts = posts.filter(p => p.site === 'chileadicto');
    if (chileadictoPosts.length > 0) {
      console.log('🏨 Posts de chileadicto:');
      chileadictoPosts.forEach(p => {
        console.log(`  - ${p.slug}`);
      });
    } else {
      console.log('⚠️  No hay posts asignados a chileadicto');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSitePosts();
