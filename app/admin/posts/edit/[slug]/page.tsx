"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { use, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import AdminRichText from "@/components/admin-rich-text";
import { useAdminApi } from "@/hooks/use-admin-api";
import {
  ArrowLeft,
  Save,
  Tag,
  Globe,
  Plus,
  X,
  Code,
  Image as ImageIcon,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { normalizePost, validatePost } from "@/lib/post-service";
import { Spinner } from "@/components/ui/spinner";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { fetchWithSite } = useAdminApi();
  const { slug } = use(params);
  // Edición de slug
  const [editSlug, setEditSlug] = useState<string>("");
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hotel, setHotel] = useState<any | null>(null);
  const [categoriesApi, setCategoriesApi] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pRes, cRes, commRes] = await Promise.all([
          fetchWithSite(`/api/posts/${encodeURIComponent(slug)}`, {
            cache: "no-store",
          }),
          fetchWithSite("/api/categories", { cache: "no-store" }),
          fetchWithSite("/api/communes?full=1&includeHidden=1", { cache: "no-store" }),
        ]);
        const p = pRes.ok ? await pRes.json() : null;
        const c = cRes.ok ? await cRes.json() : [];
        const comm = commRes.ok ? await commRes.json() : [];
        // Debug: imprimir lo cargado
        console.log("[Admin Edit] GET post", p);
        console.log("[Admin Edit] GET categories", c);
        console.log("[Admin Edit] GET communes", comm);
        if (!cancelled) {
          setHotel(p && p.slug ? p : null);
          setCategoriesApi(Array.isArray(c) ? c : []);
          const communesList = Array.isArray(comm)
            ? comm.map((co: any) => String(co.label || co.slug || "").trim()).filter(Boolean)
            : [];
          setPossibleCommunes(communesList);
          setLoadingCommunes(false);
          if (p && p.slug) setEditSlug(p.slug);
        }
      } catch (e) {
        if (!cancelled) {
          setHotel(null);
          setCategoriesApi([]);
          setPossibleCommunes([]);
          setLoadingCommunes(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, fetchWithSite]);

  // Local editable state (pre-filled)
  const [nameEs, setNameEs] = useState("");
  const [subtitleEs, setSubtitleEs] = useState("");
  // Descripción: un solo bloque (párrafos separados por línea en blanco)
  const [descriptionUnified, setDescriptionUnified] = useState<string>("");
  const [infoHtmlEs, setInfoHtmlEs] = useState<string>("");

  // Inglés
  const [nameEn, setNameEn] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [descriptionUnifiedEn, setDescriptionUnifiedEn] = useState<string>("");
  const [infoHtmlEn, setInfoHtmlEn] = useState<string>("");

  // Contacto editable
  const [website, setWebsite] = useState("");
  const [websiteDisplay, setWebsiteDisplay] = useState("");
  const [instagram, setInstagram] = useState("");
  const [instagramDisplay, setInstagramDisplay] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photosCredit, setPhotosCredit] = useState("");
  // Operación / reservas
  const [hours, setHours] = useState("");
  const [reservationLink, setReservationLink] = useState("");
  const [reservationPolicy, setReservationPolicy] = useState("");
  const [interestingFact, setInterestingFact] = useState("");

  // Imágenes: mantener arreglo y featured index + featuredImage persistente
  const [images, setImages] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const moveImage = moveImageFactory(images, setImages);
  // Estados para drag & drop de la galería
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reorderImages = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    // Ajustar featuredIndex si corresponde
    setFeaturedIndex((fi) => {
      if (fi === from) return to; // la destacada se movió
      if (from < fi && to >= fi) return fi - 1; // elemento antes de featured se movió detrás
      if (from > fi && to <= fi) return fi + 1; // elemento después de featured se movió delante
      return fi;
    });
  };
  const removeImage = (index: number) => {
    const arr = images.filter((_, i) => i !== index);
    setImages(arr);
    if (index === featuredIndex) {
      setFeaturedIndex(0);
    } else if (index < featuredIndex) {
      setFeaturedIndex(Math.max(0, featuredIndex - 1));
    }
  };
  const [categories, setCategories] = useState<string[]>(["TODOS"]);
  // Comunas (admin-only hasta que DB soporte): seleccionables tipo categorías
  const [possibleCommunes, setPossibleCommunes] = useState<string[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(true);
  const [communes, setCommunes] = useState<string[]>([]);
  const [autoDetectedCommunes, setAutoDetectedCommunes] = useState<string[]>(
    []
  );
  const normalizeComuna = (s: string) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  // Sucursales / Locations
  type LocationState = {
    label?: string;
    address?: string;
    hours?: string;
    website?: string;
    website_display?: string;
    instagram?: string;
    instagram_display?: string;
    reservationLink?: string;
    reservationPolicy?: string;
    interestingFact?: string;
    email?: string;
    phone?: string; // input sin "tel:"; lo formateamos al guardar
  };
  const [locations, setLocations] = useState<LocationState[]>([]);
  // Vista previa JSON
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewJson, setPreviewJson] = useState<string>("{}");

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of arr) form.append("files", f);
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/images`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      // Refrescar datos del post para reconstruir la galería con orden correcto
      const fresh = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : null));
      if (fresh) {
        let next: string[] = Array.isArray(fresh.images)
          ? fresh.images.slice()
          : [];
        if (fresh.featuredImage && !next.includes(fresh.featuredImage)) {
          next = [fresh.featuredImage, ...next];
        } else if (fresh.featuredImage) {
          const without = next.filter((u: string) => u !== fresh.featuredImage);
          next = [fresh.featuredImage, ...without];
        }
        setImages(next);
        setFeaturedImage(fresh.featuredImage || next[0] || "");
        setFeaturedIndex(0);
      }
    } catch (e: any) {
      console.error(e);
      alert("No se pudo subir: " + (e?.message || e));
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  // Cargar datos del hotel en los estados locales cuando llegue
  useEffect(() => {
    if (!hotel) return;
    const fixUrl = (u?: string) => {
      if (!u) return "";
      let v = String(u).trim();
      if (!v) return "";
      v = v.replace(/^['\"]+|['\"]+$/g, "");
      v = v
        .replace(/^(https)(?!:)/i, "https:")
        .replace(/^(http)(?!:)/i, "http:");
      v = v.replace(/^(https?:)\/(?!\/)/i, (m, proto) => proto + "//");
      v = v.replace(/^(https?:\/\/)+/i, (m) => m.replace(/\/\/+$/, "//"));
      if (!/^(https?:\/\/)/i.test(v) && /[A-Za-z0-9]\.[A-Za-z]/.test(v)) {
        v = "https://" + v.replace(/^\/+/, "");
      }
      v = v.replace(/^(https?:\/\/){2,}/i, (m) =>
        m.substring(0, m.indexOf("//") + 2)
      );
      v = v.replace(/https\/{2}(?=[^:])/gi, "https://");
      v = v.replace(/https:\/\/https\/\//i, "https://");
      if (/^https?:\/\//i.test(v)) {
        try {
          const urlObj = new URL(v);
          const cleanPath = urlObj.pathname.replace(/\/{2,}/g, "/");
          v = urlObj.origin + cleanPath + urlObj.search + urlObj.hash;
        } catch {}
      }
      return v;
    };
    const igHref = (v?: string) => {
      const s = String(v || "").trim();
      if (!s) return "";
      if (/^https?:\/\//i.test(s)) return s;
      const handle = s.replace(/^@+/, "");
      return `https://instagram.com/${handle}`;
    };
    const telHref = (v?: string) => {
      const s = String(v || "")
        .trim()
        .replace(/^tel:/i, "");
      if (!s) return "";
      return `tel:${s.replace(/[^+\d]/g, "")}`;
    };
    const mailHref = (v?: string) => {
      const s = String(v || "")
        .trim()
        .replace(/^mailto:/i, "");
      if (!s) return "";
      return `mailto:${s}`;
    };
    // Helpers para convertir entre array de párrafos y HTML para el editor
    const paragraphsToHtml = (arr: string[] | undefined) => {
      if (!Array.isArray(arr) || arr.length === 0) return "";
      return arr
        .map((p) => `<p>${p}</p>`) // permitimos HTML dentro del párrafo
        .join("\n");
    };
    setNameEs(hotel.es?.name || "");
    setSubtitleEs(hotel.es?.subtitle || "");
    setDescriptionUnified(paragraphsToHtml(hotel.es?.description));

    setNameEn(hotel.en?.name || "");
    setSubtitleEn(hotel.en?.subtitle || "");
    setDescriptionUnifiedEn(paragraphsToHtml(hotel.en?.description));

    // Prefiere el bloque nuevo si existe; si no, usa el legacy; si tampoco, queda vacío
    const esNew = hotel.es?.infoHtmlNew || "";
    const esLegacy = hotel.es?.infoHtml || "";
    setInfoHtmlEs(esNew || esLegacy || "");

    const enNew = hotel.en?.infoHtmlNew || "";
    const enLegacy = hotel.en?.infoHtml || "";
    setInfoHtmlEn(enNew || enLegacy || "");

    setWebsite(hotel.website || "");
    setWebsiteDisplay(hotel.website_display || "");
    setInstagram(hotel.instagram || "");
    setInstagramDisplay(hotel.instagram_display || "");
    setEmail(hotel.email || "");
    setPhone(String(hotel.phone || "").replace(/^tel:/i, ""));
    setAddress(hotel.address || "");
    setPhotosCredit(hotel.photosCredit || "");
    setHours(hotel.hours || "");
    setReservationLink(hotel.reservationLink || "");
    setReservationPolicy(hotel.reservationPolicy || "");
    setInterestingFact(hotel.interestingFact || "");
    setEditSlug(hotel.slug || slug);

    let initialImgs: string[] = Array.isArray(hotel.images)
      ? hotel.images.slice()
      : [];
    // Incluir la featuredImage en la lista local si no está (para poder volver a seleccionarla).
    if (hotel.featuredImage && !initialImgs.includes(hotel.featuredImage)) {
      initialImgs = [hotel.featuredImage, ...initialImgs];
    }
    setImages(initialImgs);
    // Marcar índice de la featured si existe
    const idx = hotel.featuredImage
      ? initialImgs.indexOf(hotel.featuredImage)
      : -1;
    setFeaturedIndex(idx >= 0 ? idx : 0);
    setFeaturedImage(hotel.featuredImage || initialImgs[0] || "");
    // Unir categorías provenientes de category_links y posibles category en traducciones
    const mergedCats = [
      ...(Array.isArray(hotel.categories) ? hotel.categories : []),
      hotel.es?.category || "",
      hotel.en?.category || "",
    ]
      .map((c: any) => String(c || "").trim())
      .filter(Boolean)
      .map((c) => c.toUpperCase());
    setCategories(
      mergedCats.length > 0 ? Array.from(new Set(mergedCats)) : ["TODOS"]
    );
    // locations existentes
    const locs = Array.isArray(hotel.locations) ? hotel.locations : [];
    setLocations(
      locs.map((l: any) => ({
        label: l?.label || "",
        address: l?.address || "",
        hours: l?.hours || "",
        website: l?.website || "",
        website_display: l?.website_display || "",
        instagram: l?.instagram || "",
        instagram_display: l?.instagram_display || "",
        reservationLink: l?.reservationLink || "",
        reservationPolicy: l?.reservationPolicy || "",
        interestingFact: l?.interestingFact || "",
        email: l?.email || "",
        phone: String(l?.phone || "").replace(/^tel:/i, ""),
      }))
    );

    // Comunas: detección automática desde address/locations/descripciones
    const found = new Set<string>();
    const tryAdd = (raw?: string) => {
      if (!raw) return;
      const haystack = normalizeComuna(String(raw));
      for (const pc of possibleCommunes) {
        if (haystack.includes(normalizeComuna(pc))) {
          found.add(pc);
        }
      }
    };
    tryAdd(hotel.address);
    (Array.isArray(locs) ? locs : []).forEach((l: any) => {
      tryAdd(l?.address);
      tryAdd(l?.label);
    });
    if (Array.isArray(hotel.es?.description))
      tryAdd(hotel.es.description.join("\n"));
    if (Array.isArray(hotel.en?.description))
      tryAdd(hotel.en.description.join("\n"));
    const detected = possibleCommunes.filter((c) => found.has(c));
    setAutoDetectedCommunes(detected);

    // Cargar comunas manuales desde localStorage (si existen)
    try {
      const key = `post:communes:${hotel.slug}`;
      const saved =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setCommunes(arr.map((s) => String(s)));
        else setCommunes(detected);
      } else {
        setCommunes(detected);
      }
    } catch {
      setCommunes(detected);
    }
  }, [hotel]);

  const allCategories = categoriesApi;

  // Mantener sincronizado featuredImage cuando cambia featuredIndex o images
  useEffect(() => {
    if (images.length === 0) return;
    if (featuredIndex >= 0 && featuredIndex < images.length) {
      setFeaturedImage(images[featuredIndex]);
    }
  }, [featuredIndex, images]);

  const buildPayload = () => {
    if (!hotel) {
      return null;
    }
    // Convertir HTML del editor a array de párrafos (HTML permitido por párrafo)
    const htmlToParagraphs = (html: string): string[] => {
      const container = document.createElement("div");
      container.innerHTML = html || "";
      const ps = Array.from(container.querySelectorAll("p"));
      if (ps.length > 0) {
        return ps.map((p) => p.innerHTML.trim()).filter(Boolean);
      }
      // Fallback: dividir por saltos dobles de línea o <br><br>
      const cleaned = container.innerHTML
        .replace(/(?:<br\s*\/?>(\s|&nbsp;)*){2,}/gi, "\n\n")
        .replace(/<br\s*\/?>(\s|&nbsp;)*/gi, "\n")
        .replace(/<[^>]+>/g, "");
      return cleaned
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
    };
    const descriptionEs = htmlToParagraphs(String(descriptionUnified));
    const descriptionEn = htmlToParagraphs(String(descriptionUnifiedEn));
    // Determinar featured final; si no hay imágenes mantener la previa
    const normalizedFeaturedIdx = Math.min(
      Math.max(0, featuredIndex || 0),
      Math.max(0, images.length - 1)
    );
    const finalFeatured = images[normalizedFeaturedIdx] || featuredImage || "";
    // Galería SIN la destacada (para no duplicarla en post_images)
    const galleryImages = images.filter(
      (img, i) => img && img !== finalFeatured && i !== normalizedFeaturedIdx
    );

    const sanitizePhone = (p: string) =>
      p ? `tel:${p.replace(/[^+\d]/g, "")}` : "";
    const sanitizedLocations = (locations || []).map((l) => ({
      label: l.label || undefined,
      address: l.address || undefined,
      hours: l.hours || undefined,
      website: l.website || undefined,
      website_display: l.website_display || undefined,
      instagram: l.instagram || undefined,
      instagram_display: l.instagram_display || undefined,
      reservationLink: l.reservationLink || undefined,
      reservationPolicy: l.reservationPolicy || undefined,
      interestingFact: l.interestingFact || undefined,
      email: l.email || undefined,
      phone: l.phone ? sanitizePhone(l.phone) : "",
    }));

    const updated = {
      slug: editSlug || hotel?.slug || slug,
      featuredImage: finalFeatured || undefined,
      es: {
        name: nameEs,
        subtitle: subtitleEs,
        description: descriptionEs,
        infoHtml: infoHtmlEs || undefined,
      },
      en: {
        name: nameEn,
        subtitle: subtitleEn,
        description: descriptionEn,
        infoHtml: infoHtmlEn || undefined,
      },
      website,
      website_display: websiteDisplay,
      instagram,
      instagram_display: instagramDisplay,
      email,
      phone: phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "",
      address,
      photosCredit,
      hours,
      reservationLink,
      reservationPolicy,
      interestingFact,
      images: galleryImages,
      categories,
      locations: sanitizedLocations,
    };
    const normalized = normalizePost(updated as any);
    // Enviar exactamente las claves top-level que el backend espera para considerar campos "provided".
    // Si el usuario deja vacío => enviar null para limpiar en DB.
    const payloadToSend = {
      slug: normalized.slug,
      featuredImage: normalized.featuredImage ?? null,
      es: normalized.es,
      en: normalized.en,
      // Enviar cadenas vacías en lugar de null para pasar validación Zod en el API.
      // La normalización del API convierte "" de URLs a undefined y luego se guarda como NULL en DB.
      website: website.trim() === "" ? "" : normalized.website,
      website_display: websiteDisplay.trim() === "" ? "" : websiteDisplay,
      instagram: instagram.trim() === "" ? "" : instagram,
      instagram_display: instagramDisplay.trim() === "" ? "" : instagramDisplay,
      email: email.trim() === "" ? "" : normalized.email,
      phone: phone.trim() === "" ? "" : normalized.phone,
      address: address.trim() === "" ? "" : address,
      photosCredit: photosCredit.trim() === "" ? "" : photosCredit,
      hours: hours.trim() === "" ? "" : hours,
      reservationLink:
        reservationLink.trim() === "" ? "" : normalized.reservationLink,
      reservationPolicy:
        reservationPolicy.trim() === "" ? "" : reservationPolicy,
      interestingFact: interestingFact.trim() === "" ? "" : interestingFact,
      images: normalized.images, // galería sin destacada
      categories: normalized.categories,
      locations: normalized.locations,
      // Campo provisional solo para vista previa/compatibilidad futura
      communes: communes,
    } as any;
    return { payloadToSend, normalized, galleryImages, finalFeatured };
  };

  const openPreview = () => {
    const built = buildPayload();
    if (!built) {
      alert("No hay post cargado para vista previa");
      return;
    }
    const { payloadToSend } = built;
    try {
      setPreviewJson(
        JSON.stringify(payloadToSend, null, 2).replace(/\n/g, "\n")
      );
    } catch (e) {
      setPreviewJson('{\n  "error": "No se pudo serializar"\n}');
    }
    setPreviewOpen(true);
  };

  const printUseful = () => {
    const built = buildPayload();
    if (!built) {
      alert("No hay post cargado");
      return;
    }
    const { normalized } = built;
    const esInfo = (normalized as any)?.es?.infoHtml || "";
    const enInfo = (normalized as any)?.en?.infoHtml || "";
    console.log("[Datos útiles - ES]\n", esInfo);
    console.log("[Useful info - EN]\n", enInfo);
    alert("Datos útiles impresos en la consola (F12)");
  };

  const handleSave = () => {
    const built = buildPayload();
    if (!built) {
      alert("No hay post cargado para guardar");
      return;
    }
    const { payloadToSend, normalized, finalFeatured } = built;
    console.log("[Admin Edit] PUT payloadToSend", payloadToSend);
    console.log("[Admin Edit] Validating normalized:", normalized);
    const result = validatePost(normalized as any);
    if (!result.ok) {
      console.error("[Admin Edit] Validation errors:", result.issues);
      const first = result.issues?.[0];
      alert(
        `Error de validación: ${first?.path || ""} - ${first?.message || ""}`
      );
      return;
    }
    setSaving(true);
    fetch(`/api/posts/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadToSend),
    })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.text();
          throw new Error(msg || `Error ${r.status}`);
        }
        const data = await r.json();
        console.log("[Admin Edit] PUT response", data);
        // Actualizar estado local de imágenes si cambió
        if (Array.isArray(normalized.images)) {
          // Después de guardar, reconstruir lista local combinando featured + galería
          const nextFeatured = normalized.featuredImage || finalFeatured;
          const nextGallery = normalized.images.filter(
            (img: string) => img !== nextFeatured
          );
          const rebuilt = nextFeatured
            ? [nextFeatured, ...nextGallery]
            : nextGallery;
          setImages(rebuilt);
          setFeaturedImage(nextFeatured || "");
          setFeaturedIndex(0);
        }
        return data;
      })
      .then(async (data: any) => {
        // Guardar comunas en localStorage tras guardar
        try {
          const newSlug: string = String(data?.slug || slug);
          const key = `post:communes:${newSlug}`;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(communes));
          }
        } catch {}
        // Refrescar el post desde el servidor para actualizar el estado local y la UI
        try {
          const newSlug: string = String(data?.slug || slug);
          if (newSlug && newSlug !== slug) {
            router.replace(`/admin/posts/edit/${encodeURIComponent(newSlug)}`);
          }
          const resp = await fetch(
            `/api/posts/${encodeURIComponent(newSlug)}`,
            { cache: "no-store" }
          );
          if (resp.ok) {
            const fresh = await resp.json();
            console.log("[Admin Edit] Refreshed post after save", fresh);
            setHotel(fresh && fresh.slug ? fresh : null);
          }
        } catch (e) {
          console.warn("No se pudo refrescar post después de guardar", e);
        }
        alert("Cambios guardados correctamente");
      })
      .catch((e) => {
        console.error("Update failed", e);
        alert("No se pudo guardar: " + (e?.message || e));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Pegado inteligente e infoHtml han sido eliminados del editor.

  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 lg:px-8 py-6 space-y-6">
        {(saving || uploading) && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center">
            <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
              <Spinner className="size-5" />
              <div className="text-gray-700 font-medium">
                {saving ? "Guardando cambios…" : "Subiendo imágenes…"}
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="w-full p-6 bg-white rounded-lg shadow flex items-center gap-2 text-gray-600">
            <Spinner className="size-4" /> Cargando post…
          </div>
        ) : !hotel ? (
          <div className="w-full p-6 bg-white rounded-lg shadow text-gray-700">
            No se encontró el post "{slug}".{" "}
            <button
              className="text-red-600 underline"
              onClick={() => router.push("/admin/posts")}
            >
              Volver a la lista
            </button>
          </div>
        ) : null}
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/posts">
            <Button variant="outline" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Editar post</h1>
            <p className="text-gray-600 mt-1">
              {hotel?.es?.name || hotel?.en?.name || slug}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={printUseful}
              className="gap-2"
              disabled={saving}
              title="Generar y mostrar los Datos útiles en consola"
            >
              <Printer size={18} /> Imprimir datos útiles
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openPreview}
              className="gap-2"
              disabled={saving}
            >
              <Code size={18} /> Ver JSON
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 gap-2 disabled:opacity-60"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="text-green-600" size={20} />
            <h2 className="font-semibold text-lg">Información básica</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Slug</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase())}
                  placeholder="mi-super-slug"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const base = (nameEs || nameEn || "").trim();
                    if (!base) return;
                    const s = base
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setEditSlug(s);
                  }}
                >
                  Generar
                </Button>
              </div>
              {!slugRegex.test(editSlug || "") && (
                <p className="text-xs text-red-600 mt-1">
                  Usa minúsculas, números y guiones. Ej: mi-post-ejemplo
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Categorías <span className="text-red-600">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(["TODOS", ...allCategories])).map((cat) => (
                  <label
                    key={cat}
                    className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                      categories.includes(cat)
                        ? "border-green-600 bg-green-50 text-green-700 font-medium"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="sr-only"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Comunas</Label>
              <div className="flex flex-wrap gap-2">
                {possibleCommunes.map((com) => {
                  const active = communes.includes(com);
                  return (
                    <label
                      key={com}
                      className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        active
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() =>
                          setCommunes((prev) =>
                            prev.includes(com)
                              ? prev.filter((c) => c !== com)
                              : [...prev, com]
                          )
                        }
                        className="sr-only"
                      />
                      {com}
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {autoDetectedCommunes.length > 0 ? (
                  <>
                    <span className="uppercase tracking-wide text-gray-500">
                      Sugeridas:
                    </span>
                    {autoDetectedCommunes.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-gray-100 border text-gray-700"
                      >
                        {c}
                      </span>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 ml-1"
                      onClick={() => setCommunes(autoDetectedCommunes)}
                    >
                      Usar sugeridas
                    </Button>
                  </>
                ) : (
                  <span className="text-gray-500">
                    No detectadas automáticamente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Nota: las comunas aún no se guardan en la base de datos. Se
                conservan localmente y se incluyen en el JSON de vista
                previa/guardado para futura compatibilidad.
              </p>
            </div>
          </div>
        </Card>

        {/* Contacto oculto por solicitud (se mantiene a nivel de backend para compatibilidad) */}

        {/* Sucursales ocultas por solicitud (contenido se conserva si ya existe) */}

        {/* Imágenes: destacada + galería */}
        <Card
          className="p-6"
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragging) setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
              uploadFiles(files);
            }
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="text-green-600" size={20} />
            <h2 className="font-semibold text-lg">Imágenes</h2>
          </div>
          <div className="space-y-4">
            {isDragging && (
              <div className="relative">
                <div className="absolute inset-0 z-10 border-2 border-dashed border-green-500 bg-green-50/60 rounded flex items-center justify-center text-green-700 font-medium">
                  Suelta tus imágenes aquí para subirlas…
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-2">Destacada</h3>
              {images[featuredIndex] ? (
                <img
                  src={images[featuredIndex]}
                  alt="Destacada"
                  className="w-full max-w-xl aspect-[16/9] object-cover border rounded"
                />
              ) : (
                <div className="w-full max-w-xl aspect-[16/9] bg-gray-100 border rounded grid place-items-center text-gray-500">
                  Sin imagen
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Galería</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group border border-transparent rounded"
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === idx) return;
                      reorderImages(dragIndex, idx);
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    style={{ cursor: "grab" }}
                  >
                    <img
                      src={src}
                      alt={`img-${idx}`}
                      className={`w-full aspect-[4/3] object-cover border rounded ${
                        dragOverIndex === idx ? "ring-2 ring-green-400" : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute bottom-1 left-1 right-1 flex gap-1 justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setFeaturedIndex(idx)}
                      >
                        Destacar
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => reorderImages(idx, idx - 1)}
                        >
                          ↑
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => reorderImages(idx, idx + 1)}
                        >
                          ↓
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeImage(idx)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) uploadFiles(files);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir archivos
              </Button>
              <span className="text-xs text-gray-500">
                También puedes arrastrar y soltar sobre este bloque.
              </span>
            </div>
          </div>
        </Card>

        {/* Contenido ES/EN (bloque único por idioma + datos útiles) */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-green-600" size={20} />
            <h2 className="font-semibold text-lg">Contenido</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Español */}
            <div className="space-y-3">
              <h3 className="font-semibold">Español</h3>
              <div>
                <Label className="text-xs text-gray-600">Nombre</Label>
                <Input
                  value={nameEs}
                  onChange={(e) => setNameEs(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Subtítulo</Label>
                <Input
                  value={subtitleEs}
                  onChange={(e) => setSubtitleEs(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">
                  Descripción (bloque único)
                </Label>
                <AdminRichText
                  value={descriptionUnified}
                  onChange={(v) => setDescriptionUnified(v)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Usa la barra superior para dar formato; Enter crea nuevos
                  párrafos.
                </p>
              </div>

              <div>
                <Label className="text-xs text-gray-600">
                  Datos útiles (bloque, puedes pegar todo el bloque con títulos
                  en negrita)
                </Label>
                <AdminRichText
                  value={infoHtmlEs}
                  onChange={(v) => setInfoHtmlEs(v)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Este bloque se mostrará bajo "Datos útiles". Puedes usar
                  <strong> negritas</strong> para los títulos.
                </p>
              </div>

              {/* Secciones eliminadas: pegado inteligente + datos útiles HTML */}
            </div>

            {/* English */}
            <div className="space-y-3">
              <h3 className="font-semibold">English</h3>
              <div>
                <Label className="text-xs text-gray-600">Name</Label>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Subtitle</Label>
                <Input
                  value={subtitleEn}
                  onChange={(e) => setSubtitleEn(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">
                  Description (single block)
                </Label>
                <AdminRichText
                  value={descriptionUnifiedEn}
                  onChange={(v) => setDescriptionUnifiedEn(v)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Use the toolbar for formatting; Enter creates new paragraphs.
                </p>
              </div>

              <div>
                <Label className="text-xs text-gray-600">
                  Useful info (block, you can paste full block with bold titles)
                </Label>
                <AdminRichText
                  value={infoHtmlEn}
                  onChange={(v) => setInfoHtmlEn(v)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  This block is rendered under "Useful information". You can use
                  <strong> bold</strong> for the labels.
                </p>
              </div>

              {/* Secciones eliminadas: smart paste + useful info HTML */}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-6 bg-white p-4 rounded-lg shadow-lg border">
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-700 gap-2 disabled:opacity-60"
            disabled={saving}
          >
            <Save size={20} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/posts")}>
            Cancelar
          </Button>
        </div>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Vista previa JSON (sin enviar)</DialogTitle>
              <DialogDescription>
                Esta es la estructura exacta que se enviará al guardar. Úsala
                para revisar categorías, comunas (locations) y campos vacíos.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border bg-gray-50 p-2 max-h-[60vh] overflow-auto text-xs font-mono">
              <pre className="whitespace-pre-wrap break-words">
                {previewJson}
              </pre>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(previewJson).catch(() => {});
                }}
                className="gap-2"
              >
                Copiar JSON
              </Button>
              <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Helpers para galería
function moveImageFactory(
  images: string[],
  setImages: (imgs: string[]) => void
): (index: number, dir: -1 | 1) => void {
  return (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= images.length) return;
    const arr = [...images];
    const [item] = arr.splice(index, 1);
    arr.splice(newIndex, 0, item);
    setImages(arr);
  };
}

// removeImageFactory ya no se usa; la lógica de eliminación ajusta featuredIndex in-line
