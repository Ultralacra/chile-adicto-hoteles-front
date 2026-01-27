"use client";

import { FileText, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAdminApi } from "@/hooks/use-admin-api";
import { useSiteContext } from "@/contexts/site-context";

export default function AdminDashboard() {
  const { fetchWithSite, currentSite } = useAdminApi();
  const { isChanging } = useSiteContext();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          fetchWithSite("/api/posts", { cache: "no-store" }),
          fetchWithSite("/api/categories", { cache: "no-store" }),
        ]);
        const p = pRes.ok ? await pRes.json() : [];
        const c = cRes.ok ? await cRes.json() : [];
        if (!cancelled) {
          setPosts(Array.isArray(p) ? p : []);
          setCategories(Array.isArray(c) ? c : []);
        }
      } catch (e) {
        if (!cancelled) {
          setPosts([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite, currentSite]);

  const totalPosts = posts.length;
  const postsByCategory = useMemo(() => {
    return categories.map((cat) => {
      const has = (h: any) => {
        const cats = new Set<string>([
          ...(h.categories || []).map((c: string) => String(c).toUpperCase()),
        ]);
        if (h.es?.category) cats.add(String(h.es.category).toUpperCase());
        if (h.en?.category) cats.add(String(h.en.category).toUpperCase());
        return cats.has(cat);
      };
      return { name: cat, count: posts.filter(has).length };
    });
  }, [posts, categories]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to Chile Adicto Hotels Admin Panel
        </p>
      </div>

      {loading && (
        <div className="w-full p-6 bg-white rounded-lg shadow flex items-center gap-2 text-gray-600">
          <Spinner className="size-4" /> Cargando datos…
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalPosts}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {categories.length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Link
            href="/admin/posts/new"
            className="flex items-center justify-center gap-2 bg-[var(--color-brand-red)] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus size={20} />
            Create New Post
          </Link>
        </div>
      </div>

      {/* Posts by Category */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Posts por categoría
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {postsByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <a
                  href={`/admin/posts?category=${encodeURIComponent(cat.name)}`}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  {cat.count} posts
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/posts"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[var(--color-brand-red)] hover:bg-red-50 transition-colors"
          >
            <FileText size={24} className="text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">View All Posts</p>
              <p className="text-sm text-gray-600">
                Manage existing hotel posts
              </p>
            </div>
          </Link>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[var(--color-brand-red)] hover:bg-red-50 transition-colors"
          >
            <Plus size={24} className="text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Create New Post</p>
              <p className="text-sm text-gray-600">
                Add a new hotel to the site
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
