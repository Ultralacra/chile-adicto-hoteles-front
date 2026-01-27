"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAdminApi } from "@/hooks/use-admin-api";
import { useSiteContext } from "@/contexts/site-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type CategorySuggestion = {
  slug: string;
  label_es?: string | null;
  label_en?: string | null;
};

type HrefSuggestionItem = {
  kind: "category" | "post";
  slug: string;
  label: string;
  href: string;
};

type HomeResp = { desktop: string[]; mobile: string[] };

type DbSliderItem = {
  image_url: string;
  href?: string | null;
  active?: boolean;
  position?: number;
  lang?: string | null;
};

type DbSliderResp = { key: string; items: DbSliderItem[] };

type MediaListResp = {
  urls: string[];
  total?: number;
  limit?: number;
  offset?: number;
  nextOffset?: number | null;
};

export default function AdminSlidersList() {
  const { fetchWithSite, currentSite } = useAdminApi();
  const { isChanging } = useSiteContext();
  const dbKeys = useMemo(
    () => [
      "home-desktop",
      "home-mobile",
      "restaurants-desktop-es",
      "restaurants-desktop-en",
      "restaurants-mobile-es",
      "restaurants-mobile-en",
    ],
    []
  );

  const [dbKey, setDbKey] = useState<string>(dbKeys[0] || "home-desktop");
  const [dbItems, setDbItems] = useState<DbSliderItem[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadingMore, setMediaLoadingMore] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaTotal, setMediaTotal] = useState<number | null>(null);
  const [mediaNextOffset, setMediaNextOffset] = useState<number | null>(0);
  const [mediaQuery, setMediaQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const mediaFileRef = useRef<HTMLInputElement | null>(null);
  const mediaScrollRef = useRef<HTMLDivElement | null>(null);
  const mediaSentinelRef = useRef<HTMLDivElement | null>(null);
  const mediaReqIdRef = useRef(0);
  const mediaLoadingRef = useRef(false);
  const mediaLoadingMoreRef = useRef(false);
  const mediaNextOffsetRef = useRef<number | null>(0);
  const mediaAllLoadedRef = useRef(false);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);

  const hrefSuggestAbortRef = useRef<AbortController | null>(null);
  const hrefSuggestBlurTimerRef = useRef<number | null>(null);
  const [hrefSuggest, setHrefSuggest] = useState<{
    index: number | null;
    query: string;
    loading: boolean;
    items: HrefSuggestionItem[];
  }>({ index: null, query: "", loading: false, items: [] });

  const [home, setHome] = useState<HomeResp | null>(null);
  const [restDesktopES, setRestDesktopES] = useState<string[]>([]);
  const [restDesktopEN, setRestDesktopEN] = useState<string[]>([]);
  const [restMobile, setRestMobile] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantsPosts, setRestaurantsPosts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState<
    Record<string, Record<string, string>>
  >({});

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      try {
        // Home: usa API existente
        const rHome = await fetchWithSite("/api/slider-images", { cache: "no-store" });
        const jHome = rHome.ok
          ? ((await rHome.json()) as HomeResp)
          : { desktop: [], mobile: [] };
        if (!cancelled) setHome(jHome);

        // Restaurantes Desktop: manifest por idioma (si existe objeto {es,en})
        const rMan = await fetch("/imagenes-slider/manifest.json", {
          cache: "no-store",
        });
        if (rMan.ok) {
          const j = await rMan.json();
          if (Array.isArray(j)) {
            // formato array simple: lo mostramos como ES y EN iguales
            if (!cancelled) {
              setRestDesktopES(
                j.map((s: string) =>
                  s.startsWith("/") ? s : `/imagenes-slider/${s}`
                )
              );
              setRestDesktopEN(
                j.map((s: string) =>
                  s.startsWith("/") ? s : `/imagenes-slider/${s}`
                )
              );
            }
          } else if (j && typeof j === "object") {
            const es = Array.isArray(j.es) ? j.es : [];
            const en = Array.isArray(j.en) ? j.en : [];
            if (!cancelled) {
              setRestDesktopES(
                es.map((s: string) =>
                  s.startsWith("/") ? s : `/imagenes-slider/${s}`
                )
              );
              setRestDesktopEN(
                en.map((s: string) =>
                  s.startsWith("/") ? s : `/imagenes-slider/${s}`
                )
              );
            }
          }
        }

        // Restaurantes Mobile: carpeta pública listada por API (si existe)
        try {
          const rMob = await fetchWithSite("/api/restaurant-slider-mobile", {
            cache: "no-store",
          });
          if (rMob.ok) {
            const jm = await rMob.json();
            const imgs: string[] = Array.isArray(jm.images) ? jm.images : [];
            if (!cancelled) setRestMobile(imgs);
          } else {
            if (!cancelled) setRestMobile([]);
          }
        } catch {
          if (!cancelled) setRestMobile([]);
        }

        // Posts de restaurantes (para derivar href destino de cada imagen)
        try {
          const rPosts = await fetchWithSite("/api/posts?categorySlug=restaurantes", {
            cache: "no-store",
          });
          const rows = rPosts.ok ? await rPosts.json() : [];
          if (!cancelled && Array.isArray(rows)) setRestaurantsPosts(rows);
        } catch {
          if (!cancelled) setRestaurantsPosts([]);
        }

        // Destinos (overrides)
        try {
          const rDest = await fetchWithSite("/api/slider-destinations", {
            cache: "no-store",
          });
          const j = rDest.ok ? await rDest.json() : {};
          if (!cancelled) setDestinations(j || {});
        } catch {
          if (!cancelled) setDestinations({});
        }
      } catch {
        if (!cancelled) {
          setHome({ desktop: [], mobile: [] });
          setRestDesktopES([]);
          setRestDesktopEN([]);
          setRestMobile([]);
          setRestaurantsPosts([]);
          setDestinations({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories?full=1", {
          cache: "no-store",
        });
        const rows = res.ok ? await res.json() : [];
        const list: CategorySuggestion[] = (Array.isArray(rows) ? rows : [])
          .map((r: any) => ({
            slug: String(r?.slug || "").trim(),
            label_es: r?.label_es ?? null,
            label_en: r?.label_en ?? null,
          }))
          .filter((x: CategorySuggestion) => x.slug);
        if (!cancelled) setCategories(list);
      } catch {
        if (!cancelled) setCategories([]);
      }
    };
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const idx = hrefSuggest.index;
    const raw = hrefSuggest.query;
    const q = String(raw || "").trim();

    if (idx == null) return;
    if (q.length < 1) {
      setHrefSuggest((s) => ({ ...s, loading: false, items: [] }));
      return;
    }

    const qn = q.toLowerCase();
    const prettyCategorySlugs = new Set<string>([
      "iconos",
      "ninos",
      "arquitectura",
      "barrios",
      "mercados",
      "miradores",
      "museos",
      "palacios",
      "parques",
      "paseos-fuera-de-santiago",
      "restaurantes",
    ]);

    const categoryMatches: HrefSuggestionItem[] = (categories || [])
      .filter((c) => {
        const slug = String(c.slug || "").toLowerCase();
        const les = String(c.label_es || "").toLowerCase();
        const len = String(c.label_en || "").toLowerCase();
        return slug.includes(qn) || les.includes(qn) || len.includes(qn);
      })
      .slice(0, 10)
      .map((c) => {
        const slug = String(c.slug || "").trim();
        const label =
          String(c.label_es || "").trim() ||
          String(c.label_en || "").trim() ||
          slug;
        const href = prettyCategorySlugs.has(slug)
          ? `/${slug}`
          : `/categoria/${slug}`;
        return { kind: "category", slug, label, href };
      });

    const controller = new AbortController();
    hrefSuggestAbortRef.current?.abort();
    hrefSuggestAbortRef.current = controller;

    const handle = window.setTimeout(async () => {
      try {
        // Mostramos categorías al tiro; luego completamos con posts
        setHrefSuggest((s) => ({
          ...s,
          loading: true,
          items: categoryMatches,
        }));
        const res = await fetch(`/api/posts?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const rows = res.ok ? await res.json() : [];
        const postMatches: HrefSuggestionItem[] = (
          Array.isArray(rows) ? rows : []
        )
          .map((r: any) => {
            const slug = String(r?.slug || "").trim();
            const label =
              (r?.es?.name ? String(r.es.name) : "") ||
              (r?.en?.name ? String(r.en.name) : "") ||
              slug;
            return {
              kind: "post",
              slug,
              label,
              href: `/${slug}`,
            } as HrefSuggestionItem;
          })
          .filter((x: HrefSuggestionItem) => x.slug)
          .slice(0, 10);

        const merged: HrefSuggestionItem[] = [];
        const seen = new Set<string>();
        for (const it of [...categoryMatches, ...postMatches]) {
          const k = `${it.kind}:${it.slug}`;
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push(it);
          if (merged.length >= 10) break;
        }

        setHrefSuggest((s) => ({ ...s, loading: false, items: merged }));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setHrefSuggest((s) => ({ ...s, loading: false, items: [] }));
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [hrefSuggest.index, hrefSuggest.query]);

  const MEDIA_PAGE_SIZE = 120;

  const fetchMediaPage = async (opts: {
    offset: number;
    append: boolean;
    refresh?: boolean;
  }) => {
    const { offset, append, refresh } = opts;
    const reqId = ++mediaReqIdRef.current;
    if (append) {
      mediaLoadingMoreRef.current = true;
      setMediaLoadingMore(true);
    } else {
      mediaLoadingRef.current = true;
      setMediaLoading(true);
    }

    try {
      const qs = new URLSearchParams();
      qs.set("limit", String(MEDIA_PAGE_SIZE));
      qs.set("offset", String(offset));
      if (refresh) qs.set("refresh", "1");
      const r = await fetch(`/api/media?${qs.toString()}`, {
        cache: "no-store",
      });
      const j = (r.ok ? await r.json() : null) as MediaListResp | null;
      if (reqId !== mediaReqIdRef.current) return;

      const urls = Array.isArray(j?.urls) ? j!.urls.map(String) : [];
      const clean = urls.map((u) => u.trim()).filter(Boolean);

      setMediaTotal(typeof j?.total === "number" ? j.total : null);
      const next = typeof j?.nextOffset === "number" ? j.nextOffset : null;
      mediaNextOffsetRef.current = next;
      setMediaNextOffset(next);

      if (append) {
        setMediaUrls((prev) => {
          const set = new Set<string>(prev);
          for (const u of clean) set.add(u);
          return Array.from(set).sort((a, b) => a.localeCompare(b));
        });
      } else {
        setMediaUrls(clean);
      }
    } catch {
      if (!append) {
        setMediaUrls([]);
        setMediaTotal(null);
        mediaNextOffsetRef.current = null;
        setMediaNextOffset(null);
      }
    } finally {
      if (append) {
        mediaLoadingMoreRef.current = false;
        setMediaLoadingMore(false);
      } else {
        mediaLoadingRef.current = false;
        setMediaLoading(false);
      }
    }
  };

  const reloadMedia = async (opts?: { refresh?: boolean }) => {
    mediaAllLoadedRef.current = false;
    await fetchMediaPage({ offset: 0, append: false, refresh: opts?.refresh });
  };

  const fetchMediaAll = async (opts?: { refresh?: boolean }) => {
    // Traer TODO el listado (sin paginación) para que el buscador encuentre imágenes
    // aunque no estén en la primera página.
    const reqId = ++mediaReqIdRef.current;
    mediaAllLoadedRef.current = true;
    mediaLoadingRef.current = true;
    setMediaLoading(true);
    try {
      const qs = new URLSearchParams();
      if (opts?.refresh) qs.set("refresh", "1");
      const r = await fetch(`/api/media?${qs.toString()}`, {
        cache: "no-store",
      });
      const j = (r.ok ? await r.json() : null) as MediaListResp | null;
      if (reqId !== mediaReqIdRef.current) return;

      const urls = Array.isArray(j?.urls) ? j!.urls.map(String) : [];
      const clean = urls.map((u) => u.trim()).filter(Boolean);

      setMediaTotal(typeof j?.total === "number" ? j.total : null);
      mediaNextOffsetRef.current = null;
      setMediaNextOffset(null);
      setMediaUrls(clean);
    } catch {
      // no-op
    } finally {
      mediaLoadingRef.current = false;
      setMediaLoading(false);
    }
  };

  const loadMoreMedia = async () => {
    if (mediaLoadingRef.current || mediaLoadingMoreRef.current) return;
    const next = mediaNextOffsetRef.current;
    if (next == null) return;
    await fetchMediaPage({ offset: next, append: true });
  };

  // Cargar la primera página solo cuando se abre el picker
  useEffect(() => {
    if (!pickerOpen) return;
    if (mediaUrls.length > 0) return;
    reloadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen]);

  // Scroll infinito: cuando el sentinel entra en vista, cargar más
  useEffect(() => {
    if (!pickerOpen) return;
    if (mediaNextOffset == null) return;
    // Evita disparar carga masiva mientras se está filtrando/buscando.
    if (mediaQuery.trim()) return;
    const root = mediaScrollRef.current;
    const target = mediaSentinelRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        loadMoreMedia();
      },
      {
        root,
        rootMargin: "200px",
        threshold: 0.01,
      }
    );

    obs.observe(target);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, mediaNextOffset, mediaQuery]);

  const uploadMediaFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    setMediaUploading(true);
    try {
      const form = new FormData();
      for (const f of arr) form.append("files", f);
      const res = await fetch(`/api/media/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const urls: string[] = Array.isArray(data?.urls) ? data.urls : [];
      if (urls.length) {
        setMediaUrls((prev) => {
          const set = new Set<string>(prev);
          for (const u of urls) if (u) set.add(String(u));
          return Array.from(set).sort((a, b) => a.localeCompare(b));
        });
      }
    } catch (e: any) {
      alert("No se pudo subir: " + String(e?.message || e));
    } finally {
      setMediaUploading(false);
    }
  };

  const loadDbSet = async (key: string) => {
    setDbLoading(true);
    try {
      const res = await fetch(`/api/sliders/${encodeURIComponent(key)}?all=1`, {
        cache: "no-store",
      });
      const j = (res.ok ? await res.json() : null) as DbSliderResp | null;
      const items = Array.isArray(j?.items) ? j!.items : [];
      const normalized = items
        .map((it: any, idx: number) => ({
          image_url: String(it?.image_url || "").trim(),
          href: it?.href ? String(it.href) : "",
          active: typeof it?.active === "boolean" ? it.active : true,
          position: Number.isFinite(it?.position) ? Number(it.position) : idx,
          lang: it?.lang ? String(it.lang) : null,
        }))
        .filter((it) => it.image_url)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setDbItems(normalized);
    } catch {
      setDbItems([]);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadDbSet(dbKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbKey]);

  const updateDbItem = (idx: number, patch: Partial<DbSliderItem>) => {
    setDbItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  };

  const openPickerFor = (idx: number) => {
    setPickerForIndex(idx);
    setMediaQuery("");
    mediaAllLoadedRef.current = false;
    setPickerOpen(true);
  };

  const getMediaName = (url: string) => {
    const clean = String(url || "")
      .split("#")[0]
      .split("?")[0];
    const last = clean.split("/").pop() || clean;
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  };

  const pickerSelectedUrl = useMemo(() => {
    if (pickerForIndex == null) return "";
    return String(dbItems?.[pickerForIndex]?.image_url || "").trim();
  }, [pickerForIndex, dbItems]);

  const filteredMediaUrls = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase();
    const base = !q
      ? mediaUrls
      : mediaUrls.filter((u) => {
          const name = getMediaName(u).toLowerCase();
          const full = String(u || "").toLowerCase();
          return name.includes(q) || full.includes(q);
        });

    const selected = pickerSelectedUrl;
    if (!selected) return base;

    const selName = getMediaName(selected).toLowerCase();
    const selFull = selected.toLowerCase();
    const matches = !q || selName.includes(q) || selFull.includes(q);
    if (!matches) return base;

    if (base.includes(selected)) {
      return [selected, ...base.filter((u) => u !== selected)];
    }
    // Si la imagen actual no viene en la lista (p.ej. URL antigua), igual mostrarla primero.
    return [selected, ...base];
  }, [mediaQuery, mediaUrls, pickerSelectedUrl]);

  // Si el usuario escribe en el buscador, cargamos la lista completa una sola vez
  // para que el filtrado encuentre cualquier imagen.
  useEffect(() => {
    if (!pickerOpen) return;
    const q = mediaQuery.trim();
    if (!q) return;
    if (mediaAllLoadedRef.current) return;

    const t = window.setTimeout(() => {
      fetchMediaAll();
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, mediaQuery]);

  const moveDbItem = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= dbItems.length) return;
    setDbItems((prev) => {
      const copy = prev.slice();
      const tmp = copy[idx];
      copy[idx] = copy[j];
      copy[j] = tmp;
      return copy;
    });
  };

  const removeDbItem = (idx: number) =>
    setDbItems((prev) => prev.filter((_, i) => i !== idx));

  const addDbItem = () => {
    const fallbackImage = mediaUrls[0] || "";
    setDbItems((prev) => [
      ...prev,
      { image_url: fallbackImage, href: "", active: true },
    ]);
  };

  const saveDbSet = async () => {
    setDbSaving(true);
    try {
      const inferredLang = dbKey.endsWith("-es")
        ? "es"
        : dbKey.endsWith("-en")
        ? "en"
        : null;
      const payload = {
        items: dbItems.map((it, idx) => ({
          image_url: String(it.image_url || "").trim(),
          href: it.href ? String(it.href).trim() : null,
          active: it.active !== false,
          position: idx,
          lang: inferredLang || it.lang || null,
        })),
      };
      const res = await fetch(`/api/sliders/${encodeURIComponent(dbKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadDbSet(dbKey);
      alert("Slider guardado en la base de datos");
    } catch (e: any) {
      alert("No se pudo guardar: " + String(e?.message || e));
    } finally {
      setDbSaving(false);
    }
  };

  const RestMobileES = restMobile.filter((u) => /-1\./i.test(u));
  const RestMobileEN = restMobile.filter((u) => /-2\./i.test(u));

  // Href destino para Home: se deriva por nombre de archivo como en /api/slider-images
  const homeHrefFor = (filenameOrUrl: string) => {
    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    const name = norm(
      (filenameOrUrl.split("/").pop() || filenameOrUrl).replace(/\.[^.]+$/, "")
    );
    const has = (k: string) => name.includes(k);
    let key: string | null = null;
    if (has("NINOS") || has("NIÑOS")) key = "NINOS";
    if (/^(ARQ|ARQU|AQU|AQI)/.test(name) || has("ARQUITECTURA"))
      key = "ARQUITECTURA";
    else if (has("BARRIOS")) key = "BARRIOS";
    else if (has("ICONOS")) key = "ICONOS";
    else if (has("MERCADOS")) key = "MERCADOS";
    else if (has("MIRADORES")) key = "MIRADORES";
    else if (has("CULTURA") || has("MUSEOS")) key = "CULTURA";
    else if (has("PALACIOS")) key = "PALACIOS";
    else if (has("PARQUES")) key = "PARQUES";
    else if (has("FUERA") || has("FUERA-DE-STGO") || has("OUTSIDE"))
      key = "FUERA-DE-STGO";
    else if (has("RESTAURANTES") || has("RESTAURANTS")) key = "RESTAURANTES";
    else key = "ICONOS";
    const map: Record<string, string> = {
      ICONOS: "/iconos",
      NINOS: "/ninos",
      ARQUITECTURA: "/arquitectura",
      BARRIOS: "/barrios",
      MERCADOS: "/mercados",
      MIRADORES: "/miradores",
      CULTURA: "/museos",
      PALACIOS: "/palacios",
      PARQUES: "/parques",
      "FUERA-DE-STGO": "/paseos-fuera-de-santiago",
      RESTAURANTES: "/restaurantes",
    };
    return map[key] || "/";
  };

  // Keys para overrides por conjunto
  const keyHomeDesktop = "home-desktop";
  const keyHomeMobile = "home-mobile";
  const keyRestDES = "restaurants-desktop-es";
  const keyRestDEN = "restaurants-desktop-en";
  const keyRestMES = "restaurants-mobile-es";
  const keyRestMEN = "restaurants-mobile-en";

  const baseName = (u: string) => (u.split("/").pop() || u).trim();

  // Índice para encontrar slug de restaurante por nombre/slug
  const restaurantsIndex = useMemo(() => {
    const normKey = (str: string) =>
      String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    return (restaurantsPosts || []).map((h) => {
      const slug = String(h.slug || "");
      const esName = String(h.es?.name || "");
      const enName = String(h.en?.name || "");
      return {
        slug,
        keys: [normKey(slug), normKey(esName), normKey(enName)].filter(Boolean),
      };
    });
  }, [restaurantsPosts]);

  function restaurantHrefFor(url: string) {
    const fname = url.split("/").pop() || url;
    const base = fname.replace(/\.[^.]+$/, "").replace(/-(1|2)$/i, "");
    const norm = (s: string) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const key = norm(base);
    let match: string | null = null;
    for (const row of restaurantsIndex) {
      if (
        row.keys.some((k: string) => k.startsWith(key) || key.startsWith(k))
      ) {
        match = row.slug;
        break;
      }
    }
    if (!match) {
      match = base
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    return `/${match}`;
  }

  const homeDesktopHrefs = (home?.desktop || []).map((u) => {
    const bn = baseName(u);
    return destinations?.[keyHomeDesktop]?.[bn] || homeHrefFor(u);
  });
  const homeMobileHrefs = (home?.mobile || []).map((u) => {
    const bn = baseName(u);
    return destinations?.[keyHomeMobile]?.[bn] || homeHrefFor(u);
  });
  const restDesktopESHrefs = restDesktopES.map((u) => {
    const bn = baseName(u);
    return destinations?.[keyRestDES]?.[bn] || restaurantHrefFor(u);
  });
  const restDesktopENHrefs = restDesktopEN.map((u) => {
    const bn = baseName(u);
    return destinations?.[keyRestDEN]?.[bn] || restaurantHrefFor(u);
  });
  const RestMobileESHrefs = RestMobileES.map((u) => {
    const bn = baseName(u);
    return destinations?.[keyRestMES]?.[bn] || restaurantHrefFor(u);
  });
  const RestMobileENHrefs = RestMobileEN.map((u) => {
    const bn = baseName(u);
    return destinations?.[keyRestMEN]?.[bn] || restaurantHrefFor(u);
  });

  // --- Reordenar en UI ---
  const moveIn = (arr: string[], index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = arr.slice();
    const tmp = copy[index];
    copy[index] = copy[j];
    copy[j] = tmp;
    return copy;
  };

  const moveHomeDesktop = (i: number, d: -1 | 1) => {
    if (!home) return;
    setHome({ ...home, desktop: moveIn(home.desktop, i, d) });
  };
  const moveHomeMobile = (i: number, d: -1 | 1) => {
    if (!home) return;
    setHome({ ...home, mobile: moveIn(home.mobile, i, d) });
  };
  const moveRestDES = (i: number, d: -1 | 1) =>
    setRestDesktopES((p) => moveIn(p, i, d));
  const moveRestDEN = (i: number, d: -1 | 1) =>
    setRestDesktopEN((p) => moveIn(p, i, d));
  const moveRestMES = (i: number, d: -1 | 1) =>
    setRestMobile((p) => {
      // mover solo elementos ES (-1)
      const idxs = p.map((u, idx) => ({ idx, isES: /-1\./i.test(u) }));
      const esIdxs = idxs.filter((o) => o.isES).map((o) => o.idx);
      if (i < 0 || i >= esIdxs.length) return p;
      const a = p.slice();
      const from = esIdxs[i];
      const to = esIdxs[i] + d;
      if (to < 0 || to >= p.length) return p;
      const tmp = a[from];
      a[from] = a[to];
      a[to] = tmp;
      return a;
    });
  const moveRestMEN = (i: number, d: -1 | 1) =>
    setRestMobile((p) => {
      // mover solo elementos EN (-2)
      const idxs = p.map((u, idx) => ({ idx, isEN: /-2\./i.test(u) }));
      const enIdxs = idxs.filter((o) => o.isEN).map((o) => o.idx);
      if (i < 0 || i >= enIdxs.length) return p;
      const a = p.slice();
      const from = enIdxs[i];
      const to = enIdxs[i] + d;
      if (to < 0 || to >= p.length) return p;
      const tmp = a[from];
      a[from] = a[to];
      a[to] = tmp;
      return a;
    });

  const reorder = (arr: string[], from: number, to: number) => {
    const a = arr.slice();
    const [item] = a.splice(from, 1);
    a.splice(to, 0, item);
    return a;
  };

  const onReorderHomeDesktop = (from: number, to: number) => {
    if (!home) return;
    setHome({ ...home, desktop: reorder(home.desktop, from, to) });
  };
  const onReorderHomeMobile = (from: number, to: number) => {
    if (!home) return;
    setHome({ ...home, mobile: reorder(home.mobile, from, to) });
  };
  const onReorderRestDES = (from: number, to: number) =>
    setRestDesktopES((p) => reorder(p, from, to));
  const onReorderRestDEN = (from: number, to: number) =>
    setRestDesktopEN((p) => reorder(p, from, to));
  const onReorderRestMES = (from: number, to: number) =>
    setRestMobile((p) => {
      const idxs = p.map((u, idx) => ({ idx, isES: /-1\./i.test(u) }));
      const esIdxs = idxs.filter((o) => o.isES).map((o) => o.idx);
      if (from < 0 || from >= esIdxs.length || to < 0 || to >= esIdxs.length)
        return p;
      const a = p.slice();
      const realFrom = esIdxs[from];
      const realTo = esIdxs[to];
      const [item] = a.splice(realFrom, 1);
      a.splice(realTo, 0, item);
      return a;
    });
  const onReorderRestMEN = (from: number, to: number) =>
    setRestMobile((p) => {
      const idxs = p.map((u, idx) => ({ idx, isEN: /-2\./i.test(u) }));
      const enIdxs = idxs.filter((o) => o.isEN).map((o) => o.idx);
      if (from < 0 || from >= enIdxs.length || to < 0 || to >= enIdxs.length)
        return p;
      const a = p.slice();
      const realFrom = enIdxs[from];
      const realTo = enIdxs[to];
      const [item] = a.splice(realFrom, 1);
      a.splice(realTo, 0, item);
      return a;
    });

  // Editar destinos overrides
  const setDest = (key: string, basename: string, value: string) => {
    setDestinations((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [basename]: value,
      },
    }));
  };

  // Editar URL (solo aplica a Restaurantes Desktop que usan manifest)
  const setUrlAt = (set: "es" | "en", idx: number, value: string) => {
    if (set === "es")
      setRestDesktopES((p) => p.map((u, i) => (i === idx ? value : u)));
    else setRestDesktopEN((p) => p.map((u, i) => (i === idx ? value : u)));
  };

  // --- Guardar orden ---
  const saveOrders = async () => {
    setSaving(true);
    try {
      // Home: PUT /api/slider-images
      if (home) {
        await fetch("/api/slider-images", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ desktop: home.desktop, mobile: home.mobile }),
        });
      }
      // Rest Desktop: PUT /api/imagenes-slider/manifest
      await fetch("/api/imagenes-slider/manifest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ es: restDesktopES, en: restDesktopEN }),
      });
      // Rest Mobile: PUT /api/restaurant-slider-mobile con orden por idioma
      const esOrder = restMobile
        .filter((u) => /-1\./i.test(u))
        .map((u) => u.split("/").pop());
      const enOrder = restMobile
        .filter((u) => /-2\./i.test(u))
        .map((u) => u.split("/").pop());
      if (esOrder.length)
        await fetch("/api/restaurant-slider-mobile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: "es", order: esOrder }),
        });
      if (enOrder.length)
        await fetch("/api/restaurant-slider-mobile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: "en", order: enOrder }),
        });

      // Destinos overrides
      await fetch("/api/slider-destinations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(destinations || {}),
      });

      // --- Sincronizar con Base de Datos (opcional y no bloqueante si no hay envs) ---
      try {
        const setsPayload = [
          {
            key: keyHomeDesktop,
            items: (home?.desktop || []).map((u, idx) => ({
              image_url: u,
              href: homeDesktopHrefs[idx] || null,
              position: idx,
            })),
          },
          {
            key: keyHomeMobile,
            items: (home?.mobile || []).map((u, idx) => ({
              image_url: u,
              href: homeMobileHrefs[idx] || null,
              position: idx,
            })),
          },
          {
            key: keyRestDES,
            items: restDesktopES.map((u, idx) => ({
              image_url: u,
              href: restDesktopESHrefs[idx] || null,
              position: idx,
              lang: "es",
            })),
          },
          {
            key: keyRestDEN,
            items: restDesktopEN.map((u, idx) => ({
              image_url: u,
              href: restDesktopENHrefs[idx] || null,
              position: idx,
              lang: "en",
            })),
          },
          {
            key: keyRestMES,
            items: RestMobileES.map((u, idx) => ({
              image_url: u,
              href: RestMobileESHrefs[idx] || null,
              position: idx,
              lang: "es",
            })),
          },
          {
            key: keyRestMEN,
            items: RestMobileEN.map((u, idx) => ({
              image_url: u,
              href: RestMobileENHrefs[idx] || null,
              position: idx,
              lang: "en",
            })),
          },
        ];
        await fetch("/api/sliders/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sets: setsPayload }),
        });
      } catch (e) {
        console.warn("[Admin Sliders] Sync DB saltado:", e);
      }
      alert("Orden guardado");
    } catch (e: any) {
      alert(`Error al guardar: ${String(e?.message || e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sliders</h1>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium">Editor (Base de Datos)</div>
            <div className="text-xs text-muted-foreground">
              Agrega/quita slides, reemplaza imagen usando "Imágenes", y define
              la ruta destino (href).
            </div>
            <div className="space-y-1">
              <Label htmlFor="sliderKey">Slider</Label>
              <select
                id="sliderKey"
                className="h-9 w-full md:w-[320px] rounded border bg-white px-2 text-sm"
                value={dbKey}
                onChange={(e) => setDbKey(e.target.value)}
              >
                {dbKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadDbSet(dbKey)}
              disabled={dbLoading || dbSaving}
            >
              Recargar
            </Button>
            <Button
              variant="outline"
              onClick={addDbItem}
              disabled={dbLoading || dbSaving}
            >
              Agregar slide
            </Button>
            <Button onClick={saveDbSet} disabled={dbSaving || dbLoading}>
              {dbSaving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>

        {(dbLoading || mediaLoading) && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Spinner className="size-4" /> Cargando{" "}
            {dbLoading ? "slider" : "imágenes"}…
          </div>
        )}

        {dbItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No hay slides en la BD para este key.
          </div>
        ) : (
          <div className="space-y-3">
            {dbItems.map((it, idx) => (
              <div
                key={`${dbKey}-${idx}`}
                className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 border rounded p-3 bg-white"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.image_url}
                    alt={`slide-${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="text-sm font-medium">Slide #{idx + 1}</div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveDbItem(idx, -1)}
                        disabled={idx === 0 || dbSaving}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveDbItem(idx, +1)}
                        disabled={idx === dbItems.length - 1 || dbSaving}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDbItem(idx)}
                        disabled={dbSaving}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Imagen (URL)</Label>
                      <Input
                        value={it.image_url}
                        readOnly
                        placeholder="https://..."
                      />
                      <div className="text-[11px] text-muted-foreground">
                        Se llena al seleccionar desde Imágenes.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Elegir desde imágenes</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPickerFor(idx)}
                          disabled={dbSaving || mediaLoading}
                        >
                          Seleccionar imagen
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => reloadMedia({ refresh: true })}
                          disabled={dbSaving || mediaLoading}
                        >
                          {mediaLoading ? "Cargando…" : "Refrescar"}
                        </Button>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {it.image_url || "Sin imagen"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Destino (href)</Label>
                      <div className="relative">
                        <Input
                          value={it.href || ""}
                          onFocus={() => {
                            if (hrefSuggestBlurTimerRef.current != null) {
                              window.clearTimeout(
                                hrefSuggestBlurTimerRef.current
                              );
                              hrefSuggestBlurTimerRef.current = null;
                            }
                            setHrefSuggest((s) => ({
                              ...s,
                              index: idx,
                              query: String(it.href || "").replace(/^\//, ""),
                            }));
                          }}
                          onBlur={() => {
                            if (hrefSuggestBlurTimerRef.current != null) {
                              window.clearTimeout(
                                hrefSuggestBlurTimerRef.current
                              );
                            }
                            hrefSuggestBlurTimerRef.current = window.setTimeout(
                              () => {
                                setHrefSuggest((s) =>
                                  s.index === idx
                                    ? {
                                        ...s,
                                        index: null,
                                        items: [],
                                        loading: false,
                                      }
                                    : s
                                );
                              },
                              150
                            );
                          }}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateDbItem(idx, { href: v });
                            setHrefSuggest((s) => ({
                              ...s,
                              index: idx,
                              query: String(v || "").replace(/^\//, ""),
                            }));
                          }}
                          placeholder="/iconos o /mi-post"
                        />

                        {hrefSuggest.index === idx &&
                        (hrefSuggest.loading ||
                          hrefSuggest.items.length > 0) ? (
                          <div className="absolute z-50 mt-1 w-full rounded border bg-background shadow-sm">
                            <div className="max-h-56 overflow-auto">
                              {hrefSuggest.loading ? (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  Buscando…
                                </div>
                              ) : null}
                              {hrefSuggest.items.map((p) => {
                                const kindLabel =
                                  p.kind === "category" ? "Categoría" : "Post";
                                return (
                                  <button
                                    key={`${p.kind}:${p.slug}`}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => {
                                      updateDbItem(idx, { href: p.href });
                                      setHrefSuggest((s) => ({
                                        ...s,
                                        index: null,
                                        items: [],
                                        loading: false,
                                      }));
                                    }}
                                    title={p.href}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-medium truncate">
                                        {p.label}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground shrink-0">
                                        {kindLabel}
                                      </div>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate">
                                      {p.href}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={it.active !== false}
                          onChange={(e) =>
                            updateDbItem(idx, { active: e.target.checked })
                          }
                        />
                        Activo
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) {
              setPickerForIndex(null);
              mediaAllLoadedRef.current = false;
            }
          }}
        >
          <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Seleccionar imagen</DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={mediaFileRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  uploadMediaFiles(files).finally(() => {
                    if (mediaFileRef.current) mediaFileRef.current.value = "";
                  });
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => mediaFileRef.current?.click()}
                disabled={mediaUploading || dbSaving}
              >
                {mediaUploading ? "Subiendo…" : "Subir imágenes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reloadMedia({ refresh: true })}
                disabled={mediaLoading || mediaUploading}
              >
                {mediaLoading ? "Cargando…" : "Recargar lista"}
              </Button>

              <Input
                value={mediaQuery}
                onChange={(e) => setMediaQuery(e.target.value)}
                placeholder="Buscar por nombre de imagen…"
                className="h-9 w-full sm:w-[320px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setMediaQuery("")}
                disabled={!mediaQuery.trim()}
              >
                Limpiar
              </Button>
              <div className="text-xs text-muted-foreground">
                Mostrando {filteredMediaUrls.length}
                {typeof mediaTotal === "number" ? ` de ${mediaTotal}` : ""}
                {mediaLoadingMore ? " · Cargando más…" : ""}
              </div>
            </div>

            {mediaUrls.length === 0 && mediaLoading ? (
              <div className="text-sm text-muted-foreground">Cargando…</div>
            ) : mediaUrls.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No hay imágenes disponibles.
              </div>
            ) : (
              <div
                ref={mediaScrollRef}
                className="max-h-[65vh] overflow-auto pr-1"
              >
                {filteredMediaUrls.length === 0 ? (
                  <div className="py-6 text-sm text-muted-foreground">
                    No hay resultados
                    {mediaQuery.trim() ? ` para "${mediaQuery.trim()}"` : ""}.
                  </div>
                ) : null}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {filteredMediaUrls.map((u) => (
                    <button
                      type="button"
                      key={u}
                      onClick={() => {
                        if (pickerForIndex == null) return;
                        updateDbItem(pickerForIndex, { image_url: u });
                        setPickerOpen(false);
                        setPickerForIndex(null);
                      }}
                      title={u}
                      className={`border rounded overflow-hidden text-left hover:bg-muted ${
                        u === pickerSelectedUrl ? "ring-2 ring-green-500" : ""
                      }`}
                    >
                      <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={u}
                          alt="media"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="px-2 py-1 text-[10px] text-muted-foreground truncate">
                        {getMediaName(u)}
                      </div>
                    </button>
                  ))}
                </div>

                <div ref={mediaSentinelRef} className="h-8" />

                {mediaNextOffset == null ? (
                  <div className="py-3 text-xs text-muted-foreground">
                    Fin de la lista.
                  </div>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>

      <p className="text-sm text-muted-foreground">
        Vista de todos los sliders actuales (solo lectura). Se muestran los
        orígenes existentes del proyecto.
      </p>
      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded bg-gray-900 text-white text-sm"
          onClick={saveOrders}
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar orden"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-gray-500 flex items-center gap-2">
          <Spinner className="size-5" /> Cargando…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Desktop */}
          <Card className="p-4">
            <h2 className="font-medium mb-3">Home · Desktop</h2>
            <ImagesGrid
              urls={home?.desktop || []}
              hrefs={homeDesktopHrefs}
              emptyText="Sin imágenes"
              onMove={(i, d) => moveHomeDesktop(i, d)}
              onReorder={(from, to) => onReorderHomeDesktop(from, to)}
              onChangeHref={(i, v) => {
                const u = home?.desktop?.[i];
                if (!u) return;
                setDest(keyHomeDesktop, baseName(u), v);
              }}
            />
          </Card>

          {/* Home Mobile */}
          <Card className="p-4">
            <h2 className="font-medium mb-3">Home · Móvil</h2>
            <ImagesGrid
              urls={home?.mobile || []}
              hrefs={homeMobileHrefs}
              emptyText="Sin imágenes"
              onMove={(i, d) => moveHomeMobile(i, d)}
              onReorder={(from, to) => onReorderHomeMobile(from, to)}
              onChangeHref={(i, v) => {
                const u = home?.mobile?.[i];
                if (!u) return;
                setDest(keyHomeMobile, baseName(u), v);
              }}
            />
          </Card>

          {/* Restaurantes Desktop ES */}
          <Card className="p-4">
            <h2 className="font-medium mb-3">Restaurantes · Desktop (ES)</h2>
            <ImagesGrid
              urls={restDesktopES}
              hrefs={restDesktopESHrefs}
              emptyText="Sin imágenes (manifest)"
              onMove={(i, d) => moveRestDES(i, d)}
              onReorder={(from, to) => onReorderRestDES(from, to)}
              onChangeUrl={(i, v) => setUrlAt("es", i, v)}
              onChangeHref={(i, v) =>
                setDest(keyRestDES, baseName(restDesktopES[i] || ""), v)
              }
            />
          </Card>

          {/* Restaurantes Desktop EN */}
          <Card className="p-4">
            <h2 className="font-medium mb-3">Restaurantes · Desktop (EN)</h2>
            <ImagesGrid
              urls={restDesktopEN}
              hrefs={restDesktopENHrefs}
              emptyText="Sin imágenes (manifest)"
              onMove={(i, d) => moveRestDEN(i, d)}
              onReorder={(from, to) => onReorderRestDEN(from, to)}
              onChangeUrl={(i, v) => setUrlAt("en", i, v)}
              onChangeHref={(i, v) =>
                setDest(keyRestDEN, baseName(restDesktopEN[i] || ""), v)
              }
            />
          </Card>

          {/* Restaurantes Móvil ES */}
          <Card className="p-4">
            <h2 className="font-medium mb-3">Restaurantes · Móvil (ES)</h2>
            <ImagesGrid
              urls={RestMobileES}
              hrefs={RestMobileESHrefs}
              emptyText="Sin imágenes (carpeta -1)"
              onMove={(i, d) => moveRestMES(i, d)}
              onReorder={(from, to) => onReorderRestMES(from, to)}
              onChangeHref={(i, v) =>
                setDest(keyRestMES, baseName(RestMobileES[i] || ""), v)
              }
            />
          </Card>

          {/* Restaurantes Móvil EN */}
          <Card className="p-4">
            <h2 className="font-medium mb-3">Restaurantes · Móvil (EN)</h2>
            <ImagesGrid
              urls={RestMobileEN}
              hrefs={RestMobileENHrefs}
              emptyText="Sin imágenes (carpeta -2)"
              onMove={(i, d) => moveRestMEN(i, d)}
              onReorder={(from, to) => onReorderRestMEN(from, to)}
              onChangeHref={(i, v) =>
                setDest(keyRestMEN, baseName(RestMobileEN[i] || ""), v)
              }
            />
          </Card>
        </div>
      )}
    </div>
  );
}

function ImagesGrid({
  urls,
  hrefs,
  emptyText,
  onMove,
  onReorder,
  onChangeUrl,
  onChangeHref,
}: {
  urls: string[];
  hrefs?: string[];
  emptyText?: string;
  onMove?: (index: number, dir: -1 | 1) => void;
  onReorder?: (from: number, to: number) => void;
  onChangeUrl?: (index: number, value: string) => void;
  onChangeHref?: (index: number, value: string) => void;
}) {
  if (!urls || urls.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {emptyText || "Sin imágenes"}
      </div>
    );
  }
  return (
    <div className="relative">
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent>
          {urls.map((u, i) => (
            <CarouselItem
              key={i}
              className="basis-1/2 sm:basis-1/3 lg:basis-1/4"
            >
              <div className="border rounded overflow-hidden bg-white group">
                <div className="relative w-full h-24 bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt={`img-${i}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {onMove ? (
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        className="px-1.5 py-0.5 text-[11px] rounded bg-white/90 hover:bg-white shadow"
                        onClick={() => onMove(i, -1)}
                        title="Subir"
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        className="px-1.5 py-0.5 text-[11px] rounded bg-white/90 hover:bg-white shadow"
                        onClick={() => onMove(i, +1)}
                        title="Bajar"
                        type="button"
                      >
                        ↓
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="px-2 py-1 bg-black/40 text-white text-[10px] space-y-0.5">
                  <div className="truncate">{u}</div>
                  {hrefs?.[i] ? (
                    <div className="truncate text-emerald-200">
                      Destino: {hrefs[i]}
                    </div>
                  ) : null}
                </div>

                {onChangeUrl || onChangeHref ? (
                  <div className="px-2 py-2 text-[11px] space-y-1 bg-white">
                    {onChangeUrl ? (
                      <div className="flex gap-1 items-center">
                        <span className="min-w-[60px] text-gray-500">
                          Imagen:
                        </span>
                        <input
                          className="flex-1 border rounded px-2 py-1"
                          value={u}
                          onChange={(e) => onChangeUrl(i, e.target.value)}
                        />
                      </div>
                    ) : null}
                    {onChangeHref ? (
                      <div className="flex gap-1 items-center">
                        <span className="min-w-[60px] text-gray-500">
                          Destino:
                        </span>
                        <input
                          className="flex-1 border rounded px-2 py-1"
                          value={hrefs?.[i] || ""}
                          onChange={(e) => onChangeHref(i, e.target.value)}
                          placeholder="p. ej. /iconos o /mi-post"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="!left-2" />
        <CarouselNext className="!right-2" />
      </Carousel>
    </div>
  );
}
