"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Images as ImagesIcon, Save, Search, X } from "lucide-react";
import { useAdminApi } from "@/hooks/use-admin-api";
import { useSiteContext } from "@/contexts/site-context";

type PostLite = {
  slug: string;
  featuredImage?: string | null;
  images?: string[];
  es?: { name?: string };
  en?: { name?: string };
};

export default function AdminImagesPage() {
  const { fetchWithSite } = useAdminApi();
  const { currentSite } = useSiteContext();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostLite[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostLite | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWithSite("/api/posts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!cancelled) setPosts(Array.isArray(rows) ? rows : []);
      })
      .catch(() => !cancelled && setPosts([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite, currentSite]);

  useEffect(() => {
    if (!selectedSlug) {
      setSelectedPost(null);
      setImages([]);
      setFeaturedIndex(0);
      return;
    }
    let cancelled = false;
    setSelectedPost(null);
    fetchWithSite(`/api/posts/${encodeURIComponent(selectedSlug)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (cancelled || !row) return;
        setSelectedPost(row);
        const gal: string[] = Array.isArray(row.images)
          ? row.images.slice()
          : [];
        const feat: string | undefined =
          row.featuredImage || gal[0] || undefined;
        const without = gal.filter((u) => u !== feat);
        const combined = feat ? [feat, ...without] : without;
        setImages(combined);
        setFeaturedIndex(0);
      })
      .catch(() => !cancelled && setSelectedPost(null));
    return () => {
      cancelled = true;
    };
  }, [selectedSlug, fetchWithSite]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const name = String(p.es?.name || p.en?.name || "").toLowerCase();
      return p.slug.toLowerCase().includes(q) || name.includes(q);
    });
  }, [posts, query]);

  const move = (from: number, to: number) => {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= images.length ||
      to >= images.length
    )
      return;
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setImages(arr);
    setFeaturedIndex((fi) => (fi === from ? to : fi));
  };

  const remove = (idx: number) => {
    const arr = images.filter((_, i) => i !== idx);
    setImages(arr);
    if (idx === featuredIndex) setFeaturedIndex(0);
  };

  const handleDropFiles = async (files: FileList | File[]) => {
    if (!selectedSlug) return alert("Selecciona un post primero");
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of arr) form.append("files", f);
      const res = await fetch(
        `/api/posts/${encodeURIComponent(selectedSlug)}/images`,
        {
          method: "POST",
          body: form,
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const fresh = await fetch(
        `/api/posts/${encodeURIComponent(selectedSlug)}`,
        { cache: "no-store" }
      ).then((r) => (r.ok ? r.json() : null));
      if (fresh) {
        setSelectedPost(fresh);
        const gal: string[] = Array.isArray(fresh.images)
          ? fresh.images.slice()
          : [];
        const feat: string | undefined =
          fresh.featuredImage || gal[0] || undefined;
        const without = gal.filter((u: string) => u !== feat);
        const combined = feat ? [feat, ...without] : without;
        setImages(combined);
        setFeaturedIndex((fi) => Math.min(fi, combined.length - 1));
      }
    } catch (e: any) {
      console.error(e);
      alert("No se pudo subir: " + (e?.message || e));
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPost) return;
    setSaving(true);
    try {
      const fi = Math.max(0, Math.min(featuredIndex, images.length - 1));
      const featured = images[fi] || "";
      const gallery = images.filter((_, i) => i !== fi);
      const payload = { featuredImage: featured || null, images: gallery };
      const res = await fetch(
        `/api/posts/${encodeURIComponent(selectedPost.slug)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const fresh = await fetch(
        `/api/posts/${encodeURIComponent(selectedPost.slug)}`,
        { cache: "no-store" }
      ).then((r) => (r.ok ? r.json() : null));
      if (fresh) {
        setSelectedPost(fresh);
        const gal: string[] = Array.isArray(fresh.images)
          ? fresh.images.slice()
          : [];
        const feat: string | undefined =
          fresh.featuredImage || gal[0] || undefined;
        const without = gal.filter((u) => u !== feat);
        const combined = feat ? [feat, ...without] : without;
        setImages(combined);
        setFeaturedIndex(0);
      }
      alert("Imágenes guardadas correctamente");
    } catch (e: any) {
      console.error(e);
      alert("No se pudo guardar: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts">
            <Button variant="outline" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImagesIcon size={20} className="text-green-600" />
            Administrar imágenes
          </h1>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Search size={16} className="text-gray-500" />
              <Input
                placeholder="Buscar por nombre o slug…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredPosts.length} posts
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-0 overflow-hidden">
            <div className="border-b p-3 text-sm font-medium">Posts</div>
            <div className="max-h-[60vh] overflow-auto">
              {loading ? (
                <div className="p-4 text-gray-600 flex items-center gap-2">
                  <Spinner className="size-4" /> Cargando…
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-4 text-gray-600">Sin resultados</div>
              ) : (
                <ul>
                  {filteredPosts.map((p) => {
                    const active = selectedSlug === p.slug;
                    return (
                      <li key={p.slug}>
                        <button
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b ${
                            active ? "bg-green-50" : "bg-white"
                          }`}
                          onClick={() => setSelectedSlug(p.slug)}
                        >
                          <div className="font-medium">
                            {p.es?.name || p.en?.name || p.slug}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {p.slug}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card className="p-4">
              {(saving || uploading) && (
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center">
                  <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
                    <Spinner className="size-5" />
                    <div className="text-gray-700 font-medium">
                      {saving ? "Guardando…" : "Subiendo imágenes…"}
                    </div>
                  </div>
                </div>
              )}
              {!selectedPost ? (
                <div className="text-gray-600">
                  Selecciona un post para administrar sus imágenes.
                </div>
              ) : (
                <div
                  className="space-y-4"
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
                  onDrop={async (e) => {
                    e.preventDefault();
                    const files = e.dataTransfer?.files;
                    if (files && files.length > 0) {
                      handleDropFiles(files);
                    }
                    setIsDragging(false);
                  }}
                >
                  <div>
                    <div className="text-sm text-gray-500">Post</div>
                    <div className="font-semibold">
                      {selectedPost.es?.name ||
                        selectedPost.en?.name ||
                        selectedPost.slug}
                    </div>
                    <div className="relative">
                      {isDragging && (
                        <div className="absolute inset-0 z-10 border-2 border-dashed border-green-500 bg-green-50/60 rounded flex items-center justify-center text-green-700 font-medium">
                          Suelta tus imágenes aquí para subirlas…
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500">
                        {selectedPost.slug}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Destacada</Label>
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
                    <Label className="text-xs text-gray-600">Galería</Label>
                    {images.length === 0 ? (
                      <div className="text-gray-500 text-sm">
                        No hay imágenes.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images.map((src, idx) => (
                          <div
                            key={idx}
                            className={`relative group border rounded ${
                              idx === featuredIndex
                                ? "ring-2 ring-green-500"
                                : ""
                            }`}
                          >
                            <img
                              src={src}
                              alt={`img-${idx}`}
                              className="w-full aspect-[4/3] object-cover rounded"
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
                                  onClick={() => move(idx, idx - 1)}
                                >
                                  ↑
                                </Button>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => move(idx, idx + 1)}
                                >
                                  ↓
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => remove(idx)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) handleDropFiles(files);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Subir archivos
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Save size={18} /> Guardar cambios
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSlug(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
