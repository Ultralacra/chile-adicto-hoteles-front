# Consumir el API de este Admin desde otro Frontend (mismo stack)

Este repo puede funcionar como **CMS/Admin + API** (headless) y otro repo como **Frontend**.
Tu caso: el frontend externo es “el mismo proyecto” (Next.js), pero con home/estructura distinta y debe mostrar **solo contenido de `chileadicto`**.

## Idea central

- El API de este repo está en `app/api/*`.
- El “sitio” se resuelve en servidor con esta prioridad (ver `lib/site-utils.ts`):
  1. `?adminSite=` (para admin)
  2. `?previewSite=` (para previews / overrides)
  3. header `x-site-id` (inyectado por `middleware.ts` según dominio)
  4. fallback `DEFAULT_SITE`

En **otro dominio/otro repo**, lo más estable es **pasar siempre `previewSite=chileadicto`** al consumir el API.

## Variables de entorno sugeridas (en el frontend externo)

En tu otro repo:

- `NEXT_PUBLIC_CMS_API_BASE_URL=https://TU-DOMINIO-DEL-ADMIN`  
  Ej: `https://admin.mi-dominio.com`
- (opcional) `NEXT_PUBLIC_SITE_ID=chileadicto`

## Helper recomendado en el frontend externo

Crea un helper tipo `lib/cms-api.ts`:

```ts
const CMS_BASE = process.env.NEXT_PUBLIC_CMS_API_BASE_URL;
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "chileadicto";

export async function fetchCms(path: string, init?: RequestInit) {
  if (!CMS_BASE) throw new Error("Falta NEXT_PUBLIC_CMS_API_BASE_URL");
  const url = new URL(`/api/${path.replace(/^\/+/, "")}`, CMS_BASE);
  url.searchParams.set("previewSite", SITE_ID);
  return fetch(url.toString(), init);
}
```

Uso (Server Component / Route Handler / Server Action):

```ts
const res = await fetchCms("posts");
const posts = await res.json();
```

## SSR vs Browser (CORS)

Recomendación: **consumir el API desde el servidor** del frontend externo (SSR / Server Components), así:

- No dependes de CORS.
- Puedes cachear mejor.

Si necesitas llamar el API desde componentes client (`useEffect`, etc.), entonces este repo debe agregar **CORS** en las rutas que el frontend externo consuma.

## Seguridad

- No expongas operaciones de escritura (POST/PUT/DELETE) al frontend público.
- Varias rutas de admin usan `SUPABASE_SERVICE_ROLE_KEY` para escribir; eso debe quedar solo en este repo.

## Checklist rápida

1. Despliega este repo (Admin/API) en una URL estable.
2. En el repo frontend, configura `NEXT_PUBLIC_CMS_API_BASE_URL`.
3. En el repo frontend, usa `fetchCms("posts")`, `fetchCms("categories")`, etc. (siempre con `previewSite=chileadicto`).
4. (Opcional) Si requieres llamadas desde browser, agrega CORS en este repo.
