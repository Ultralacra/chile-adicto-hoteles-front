"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminApi } from "@/hooks/use-admin-api";
import { useSiteContext } from "@/contexts/site-context";

type CategoryRow = {
  slug: string;
  label_es: string | null;
  label_en: string | null;
  show_in_menu?: boolean | null;
};

export default function AdminCategoriesPage() {
  const { fetchWithSite } = useAdminApi();
  const { currentSite } = useSiteContext();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [labelEs, setLabelEs] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [showInMenu, setShowInMenu] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const normalizeSlug = (input: string) =>
    String(input || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const effectiveSlug = useMemo(() => {
    if (slug.trim()) return normalizeSlug(slug);
    return normalizeSlug(labelEs || labelEn);
  }, [slug, labelEs, labelEn]);

  const loadCategories = async () => {
    setLoadingCats(true);
    setCatsError(null);
    try {
      const res = await fetchWithSite("/api/categories?full=1&includeHidden=1", {
        cache: "no-store",
      });
      const json = res.ok ? await res.json() : [];
      setCategories(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setCatsError(String(e?.message || e));
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWithSite, currentSite]);

  const resetForm = () => {
    setSelectedSlug(null);
    setSlug("");
    setLabelEs("");
    setLabelEn("");
    setShowInMenu(true);
    setCatsError(null);
  };

  const startEdit = (row: CategoryRow) => {
    setSelectedSlug(row.slug);
    setSlug(row.slug);
    setLabelEs(row.label_es || "");
    setLabelEn(row.label_en || "");
    setShowInMenu(row.show_in_menu !== false);
    setCatsError(null);
  };

  const saveCategory = async () => {
    const s = effectiveSlug;
    if (!s) {
      setCatsError("Ingresa un slug o un nombre para generar slug.");
      return;
    }
    setSaving(true);
    setCatsError(null);
    try {
      const payload = {
        slug: s,
        label_es: labelEs.trim() || null,
        label_en: labelEn.trim() || null,
        show_in_menu: Boolean(showInMenu),
      };
      const res = await fetchWithSite("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `Error ${res.status}`);
      }
      resetForm();
      await loadCategories();
    } catch (e: any) {
      setCatsError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (row: CategoryRow) => {
    const ok = window.confirm(
      `¿Eliminar la categoría "${row.slug}"? Esto no se puede deshacer.`
    );
    if (!ok) return;
    setDeletingSlug(row.slug);
    setCatsError(null);
    try {
      const res = await fetchWithSite(
        `/api/categories?slug=${encodeURIComponent(row.slug)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `Error ${res.status}`);
      }
      if (selectedSlug === row.slug) resetForm();
      await loadCategories();
    } catch (e: any) {
      setCatsError(String(e?.message || e));
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
        <p className="text-gray-600 mt-1">
          Crea, edita y elimina categorías guardadas en la base de datos.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">CRUD</h2>
            <p className="text-gray-600 mt-1">
              El slug se normaliza automáticamente.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Nuevo
            </button>
            <button
              type="button"
              onClick={loadCategories}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loadingCats}
            >
              {loadingCats ? "Cargando…" : "Recargar"}
            </button>
          </div>
        </div>

        {catsError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {catsError}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="ninos"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se normaliza automáticamente: {effectiveSlug || "—"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label ES
            </label>
            <input
              type="text"
              value={labelEs}
              onChange={(e) => setLabelEs(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="NIÑOS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label EN
            </label>
            <input
              type="text"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="KIDS"
            />
          </div>

          <div className="flex items-center gap-3 pt-7">
            <input
              id="show_in_menu"
              type="checkbox"
              checked={showInMenu}
              onChange={(e) => setShowInMenu(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="show_in_menu" className="text-sm text-gray-700">
              Mostrar en menú
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveCategory}
            disabled={saving}
            className="px-4 py-2 bg-[var(--color-brand-red)] text-white rounded-lg font-bold uppercase hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? "Guardando…"
              : selectedSlug
              ? "Actualizar categoría"
              : "Crear categoría"}
          </button>
          {selectedSlug && (
            <span className="text-sm text-gray-600">
              Editando: <span className="font-mono">{selectedSlug}</span>
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Existentes</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">
                    slug
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">
                    label_es
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">
                    label_en
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">
                    menú
                  </th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-700">
                    acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-gray-500" colSpan={5}>
                      {loadingCats
                        ? "Cargando categorías…"
                        : "No hay categorías (o no se pudo leer la BD)."}
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.slug} className="border-t border-gray-200">
                      <td className="px-4 py-2 font-mono">{c.slug}</td>
                      <td className="px-4 py-2">{c.label_es || "—"}</td>
                      <td className="px-4 py-2">{c.label_en || "—"}</td>
                      <td className="px-4 py-2">
                        {c.show_in_menu === false ? "Oculta" : "Visible"}
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 mr-2"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(c)}
                          disabled={deletingSlug === c.slug}
                          className="px-3 py-1 border border-red-200 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingSlug === c.slug ? "Eliminando…" : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
