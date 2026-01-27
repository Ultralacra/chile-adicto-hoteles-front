"use client";

import type React from "react";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

export default function NewPostPage() {
  const router = useRouter();
  const { fetchWithSite } = useAdminApi();
  const [creating, setCreating] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [categoriesApi, setCategoriesApi] = useState<string[]>([]);

  // Slug
  const [editSlug, setEditSlug] = useState<string>("");
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  // Contacto
  const [website, setWebsite] = useState("");
  const [websiteDisplay, setWebsiteDisplay] = useState("");
  const [instagram, setInstagram] = useState("");
  const [instagramDisplay, setInstagramDisplay] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photosCredit, setPhotosCredit] = useState("");
  const [hours, setHours] = useState("");
  const [reservationLink, setReservationLink] = useState("");
  const [reservationPolicy, setReservationPolicy] = useState("");
  const [interestingFact, setInterestingFact] = useState("");

  // Contenido ES/EN (bloque único por idioma)
  const [nameEs, setNameEs] = useState("");
  const [subtitleEs, setSubtitleEs] = useState("");
  const [descriptionUnified, setDescriptionUnified] = useState<string>("");
  const [infoHtmlEs, setInfoHtmlEs] = useState<string>("");
  const [nameEn, setNameEn] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [descriptionUnifiedEn, setDescriptionUnifiedEn] = useState<string>("");
  const [infoHtmlEn, setInfoHtmlEn] = useState<string>("");

  // Categorías y comunas
  const [categories, setCategories] = useState<string[]>(["TODOS"]);
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
    phone?: string;
  };
  const [locations, setLocations] = useState<LocationState[]>([]);

  // Imágenes con destacada y reorden
  const [images, setImages] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
    setFeaturedIndex((fi) => {
      if (fi === from) return to;
      if (from < fi && to >= fi) return fi - 1;
      if (from > fi && to <= fi) return fi + 1;
      return fi;
    });
  };
  const removeImage = (index: number) => {
    const arr = images.filter((_, i) => i !== index);
    setImages(arr);
    if (index === featuredIndex) setFeaturedIndex(0);
    else if (index < featuredIndex)
      setFeaturedIndex(Math.max(0, featuredIndex - 1));
  };

  // Sincronizar featuredImage cuando cambian images/featuredIndex
  useEffect(() => {
    if (images.length === 0) return;
    if (featuredIndex >= 0 && featuredIndex < images.length) {
      setFeaturedImage(images[featuredIndex]);
    }
  }, [featuredIndex, images]);

  // Cargar categorías del API
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      setLoadingCats(true);
      try {
        const r = await fetchWithSite("/api/categories", { cache: "no-store" });
        const c = r.ok ? await r.json() : [];
        if (!cancelled) setCategoriesApi(Array.isArray(c) ? c : []);
      } catch {
        if (!cancelled) setCategoriesApi([]);
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite]);

  // Cargar comunas del API
  useEffect(() => {
    let cancelled = false;
    async function loadCommunes() {
      setLoadingCommunes(true);
      try {
        const r = await fetchWithSite("/api/communes?full=1&includeHidden=1", { cache: "no-store" });
        const data = r.ok ? await r.json() : [];
        if (!cancelled) {
          const communesList = Array.isArray(data)
            ? data.map((c: any) => String(c.label || c.slug || "").trim()).filter(Boolean)
            : [];
          setPossibleCommunes(communesList);
        }
      } catch {
        if (!cancelled) setPossibleCommunes([]);
      } finally {
        if (!cancelled) setLoadingCommunes(false);
      }
    }
    loadCommunes();
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite]);

  // Auto-detección de comunas desde campos ingresados
  useEffect(() => {
    const found = new Set<string>();
    const tryAdd = (raw?: string) => {
      if (!raw) return;
      const haystack = normalizeComuna(String(raw));
      for (const pc of possibleCommunes) {
        if (haystack.includes(normalizeComuna(pc))) found.add(pc);
      }
    };
    tryAdd(address);
    (Array.isArray(locations) ? locations : []).forEach((l) => {
      tryAdd(l?.address);
      tryAdd(l?.label);
    });
    // Descripciones como texto plano para heurística simple
    const plainEs = descriptionUnified.replace(/<[^>]+>/g, " ");
    const plainEn = descriptionUnifiedEn.replace(/<[^>]+>/g, " ");
    tryAdd(plainEs);
    tryAdd(plainEn);
    setAutoDetectedCommunes(possibleCommunes.filter((c) => found.has(c)));
  }, [address, locations, descriptionUnified, descriptionUnifiedEn]);

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
      const res = await fetch(`/api/media/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const urls: string[] = Array.isArray(data?.urls) ? data.urls : [];
      if (urls.length) {
        setImages((prev) => {
          const next = [...prev, ...urls];
          // Ajustar destacada si no había
          if (next.length > 0 && featuredIndex >= next.length) {
            setFeaturedIndex(0);
          }
          return next;
        });
      }
    } catch (e: any) {
      console.error(e);
      alert("No se pudo subir: " + (e?.message || e));
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const allCategories = categoriesApi;
  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const buildPayload = () => {
    // Convertir HTML del editor a array de párrafos
    const htmlToParagraphs = (html: string): string[] => {
      const container = document.createElement("div");
      container.innerHTML = html || "";
      const ps = Array.from(container.querySelectorAll("p"));
      if (ps.length > 0)
        return ps.map((p) => p.innerHTML.trim()).filter(Boolean);
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

    const normalizedFeaturedIdx = Math.min(
      Math.max(0, featuredIndex || 0),
      Math.max(0, images.length - 1)
    );
    const finalFeatured = images[normalizedFeaturedIdx] || featuredImage || "";
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

    // Autogenerar infoHtml si el usuario dejó vacías las cajas pero llenó los campos de contacto
    const fixUrl = (u?: string) => {
      if (!u) return "";
      let v = String(u).trim();
      if (!v) return "";
      // Quitar comillas envolventes y espacios raros
      v = v.replace(/^['\"]+|['\"]+$/g, "");
      // Añadir dos puntos si se omitieron después de http/https
      v = v
        .replace(/^(https)(?!:)/i, "https:")
        .replace(/^(http)(?!:)/i, "http:");
      // Normalizar un solo slash después del protocolo -> //
      v = v.replace(/^(https?:)\/(?!\/)/i, (m, proto) => proto + "//");
      // Si el protocolo está pero hay más de dos barras (https:////) reducir a dos
      v = v.replace(/^(https?:\/\/)+/i, (m) => m.replace(/\/\/+$/, "//"));
      // Si falta protocolo pero parece dominio (contiene punto y letras) agregar https://
      if (!/^(https?:\/\/)/i.test(v) && /[A-Za-z0-9]\.[A-Za-z]/.test(v)) {
        v = "https://" + v.replace(/^\/+/, "");
      }
      // Colapsar repeticiones de protocolo (https://https://example) dejando solo uno
      v = v.replace(/^(https?:\/\/){2,}/i, (m) =>
        m.substring(0, m.indexOf("//") + 2)
      );
      // Arreglar ocurrencias internas de 'https//'
      v = v.replace(/https\/{2}(?=[^:])/gi, "https://");
      // Si queda patrón https://https// (segundo sin colon) convertir a https://
      v = v.replace(/https:\/\/https\/\//i, "https://");
      // Limpiar triple slash en path (mantener protocolo + dominio)
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

    const buildInfoEs = (): string => {
      if (infoHtmlEs && infoHtmlEs.trim() !== "") return infoHtmlEs;
      const parts: string[] = [];
      const addr = (address || "").trim();
      if (addr)
        parts.push(`<p><strong>DIRECCIÓN:</strong> ${addr.toUpperCase()}</p>`);
      const web = (website || "").trim();
      if (web) {
        const display = (websiteDisplay || web).toUpperCase();
        const href = fixUrl(web);
        parts.push(
          `<p><strong>WEB:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a></p>`
        );
      }
      const ig = (instagram || "").trim();
      if (ig) {
        const display = (instagramDisplay || ig).toUpperCase();
        const href = igHref(ig);
        parts.push(
          `<p><strong>INSTAGRAM:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a></p>`
        );
      }
      const hoursText = (hours || "").trim();
      if (hoursText)
        parts.push(`<p><strong>HORARIO:</strong> ${hoursText}</p>`);
      const resPolicy = (reservationPolicy || "").trim();
      const resLink = (reservationLink || "").trim();
      if (resPolicy || resLink) {
        if (resLink) {
          const href = fixUrl(resLink);
          const text = (resPolicy || resLink).toString();
          parts.push(
            `<p><strong>RESERVAS:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a></p>`
          );
        } else {
          parts.push(`<p><strong>RESERVAS:</strong> ${resPolicy}</p>`);
        }
      }
      const fact = (interestingFact || "").trim();
      if (fact) parts.push(`<p><strong>DATO DE INTERÉS:</strong> ${fact}</p>`);
      const tel = (phone || "").trim();
      if (tel) {
        const disp = tel.replace(/^tel:/i, "").toUpperCase();
        const href = telHref(tel);
        parts.push(
          `<p><strong>TEL:</strong> <a href="${href}">${disp}</a></p>`
        );
      }
      const mail = (email || "").trim();
      if (mail) {
        const disp = mail.replace(/^mailto:/i, "").toUpperCase();
        const href = mailHref(mail);
        parts.push(
          `<p><strong>EMAIL:</strong> <a href="${href}">${disp}</a></p>`
        );
      }
      const credit = (photosCredit || "").trim();
      if (credit)
        parts.push(
          `<p><strong>FOTOGRAFÍAS:</strong> ${credit.toUpperCase()}</p>`
        );
      return parts.join("");
    };
    const buildInfoEn = (): string => {
      if (infoHtmlEn && infoHtmlEn.trim() !== "") return infoHtmlEn;
      const parts: string[] = [];
      const addr = (address || "").trim();
      if (addr)
        parts.push(`<p><strong>ADDRESS:</strong> ${addr.toUpperCase()}</p>`);
      const web = (website || "").trim();
      if (web) {
        const display = (websiteDisplay || web).toUpperCase();
        const href = fixUrl(web);
        parts.push(
          `<p><strong>WEB:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a></p>`
        );
      }
      const ig = (instagram || "").trim();
      if (ig) {
        const display = (instagramDisplay || ig).toUpperCase();
        const href = igHref(ig);
        parts.push(
          `<p><strong>INSTAGRAM:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a></p>`
        );
      }
      const hoursText = (hours || "").trim();
      if (hoursText) parts.push(`<p><strong>HOURS:</strong> ${hoursText}</p>`);
      const resPolicy = (reservationPolicy || "").trim();
      const resLink = (reservationLink || "").trim();
      if (resPolicy || resLink) {
        if (resLink) {
          const href = fixUrl(resLink);
          const text = (resPolicy || resLink).toString();
          parts.push(
            `<p><strong>RESERVATIONS:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a></p>`
          );
        } else {
          parts.push(`<p><strong>RESERVATIONS:</strong> ${resPolicy}</p>`);
        }
      }
      const fact = (interestingFact || "").trim();
      if (fact) parts.push(`<p><strong>INTERESTING FACT:</strong> ${fact}</p>`);
      const tel = (phone || "").trim();
      if (tel) {
        const disp = tel.replace(/^tel:/i, "").toUpperCase();
        const href = telHref(tel);
        parts.push(
          `<p><strong>TEL:</strong> <a href="${href}">${disp}</a></p>`
        );
      }
      const mail = (email || "").trim();
      if (mail) {
        const disp = mail.replace(/^mailto:/i, "").toUpperCase();
        const href = mailHref(mail);
        parts.push(
          `<p><strong>EMAIL:</strong> <a href="${href}">${disp}</a></p>`
        );
      }
      const credit = (photosCredit || "").trim();
      if (credit)
        parts.push(
          `<p><strong>PHOTOGRAPHS:</strong> ${credit.toUpperCase()}</p>`
        );
      return parts.join("");
    };

    const updated = {
      slug: editSlug,
      featuredImage: finalFeatured || undefined,
      es: {
        name: nameEs,
        subtitle: subtitleEs,
        description: descriptionEs,
        infoHtml: (infoHtmlEs || "").trim()
          ? infoHtmlEs
          : buildInfoEs() || undefined,
      },
      en: {
        name: nameEn,
        subtitle: subtitleEn,
        description: descriptionEn,
        infoHtml: (infoHtmlEn || "").trim()
          ? infoHtmlEn
          : buildInfoEn() || undefined,
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
    } as any;

    const normalized = normalizePost(updated);
    const payloadToSend = {
      slug: normalized.slug,
      featuredImage: normalized.featuredImage ?? null,
      es: normalized.es,
      en: normalized.en,
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
      images: normalized.images,
      categories: normalized.categories,
      locations: normalized.locations,
      communes,
    } as any;
    return { payloadToSend, normalized, finalFeatured };
  };

  const openPreview = () => {
    const built = buildPayload();
    const { payloadToSend } = built;
    try {
      setPreviewJson(
        JSON.stringify(payloadToSend, null, 2).replace(/\n/g, "\n")
      );
    } catch {
      setPreviewJson("{" + '\n  "error": "No se pudo serializar"\n' + "}");
    }
    setPreviewOpen(true);
  };

  const printUseful = () => {
    const built = buildPayload();
    const { normalized } = built;
    const esInfo = (normalized as any)?.es?.infoHtml || "";
    const enInfo = (normalized as any)?.en?.infoHtml || "";
    // Imprimir en consola del navegador
    console.log("[Datos útiles - ES]\n", esInfo);
    console.log("[Useful info - EN]\n", enInfo);
    // Pequeña confirmación en UI
    alert("Datos útiles impresos en la consola (F12)");
  };

  const handleCreate = () => {
    if (!editSlug || !slugRegex.test(editSlug)) {
      alert("Slug inválido. Usa minúsculas, números y guiones.");
      return;
    }
    const { payloadToSend, normalized, finalFeatured } = buildPayload();
    const result = validatePost(normalized as any);
    if (!result.ok) {
      const first = result.issues?.[0];
      alert(
        `Error de validación: ${first?.path || ""} - ${first?.message || ""}`
      );
      return;
    }
    setCreating(true);
    fetch(`/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadToSend),
    })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.text();
          throw new Error(msg || `Error ${r.status}`);
        }
        return r.json();
      })
      .then(async (data) => {
        try {
          const newSlug: string = String(data?.slug || normalized.slug);
          const key = `post:communes:${newSlug}`;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(communes));
          }
          router.replace(`/admin/posts/edit/${encodeURIComponent(newSlug)}`);
        } catch {}
        alert("Post creado correctamente");
      })
      .catch((e) => {
        console.error("Create failed", e);
        alert("No se pudo crear: " + (e?.message || e));
      })
      .finally(() => setCreating(false));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 lg:px-8 py-6 space-y-6">
        {(creating || uploading) && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center">
            <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
              <Spinner className="size-5" />
              <div className="text-gray-700 font-medium">
                {creating ? "Creando post…" : "Subiendo imágenes…"}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/posts">
            <Button variant="outline" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Crear post</h1>
            <p className="text-gray-600 mt-1">
              Completa la información del lugar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={printUseful}
              className="gap-2"
              disabled={creating}
              title="Generar y mostrar los Datos útiles en consola"
            >
              <Printer size={18} /> Imprimir datos útiles
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openPreview}
              className="gap-2"
              disabled={creating}
            >
              <Code size={18} /> Ver JSON
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-green-600 hover:bg-green-700 gap-2 disabled:opacity-60"
              disabled={creating}
            >
              <Save size={20} />
              {creating ? "Creando..." : "Crear post"}
            </Button>
          </div>
        </div>

        {/* Información básica */}
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
              {!slugRegex.test(editSlug || "") && editSlug && (
                <p className="text-xs text-red-600 mt-1">
                  Usa minúsculas, números y guiones. Ej: mi-post-ejemplo
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Categorías
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
              {loadingCats && (
                <p className="text-xs text-gray-500 mt-1">
                  Cargando categorías…
                </p>
              )}
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

        {/* Contacto oculto por solicitud (solo se usarán los bloques de Datos útiles) */}

        {/* Sucursales ocultas por solicitud */}

        {/* Imágenes */}
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

        {/* Contenido ES/EN */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-green-600" size={20} />
            <h2 className="font-semibold text-lg">Contenido</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
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
            </div>
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex gap-4 sticky bottom-6 bg-white p-4 rounded-lg shadow-lg border">
          <Button
            onClick={handleCreate}
            className="flex-1 bg-green-600 hover:bg-green-700 gap-2 disabled:opacity-60"
            disabled={creating}
          >
            <Save size={20} />
            {creating ? "Creando..." : "Crear post"}
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
                Esta es la estructura exacta que se enviará al crear.
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
