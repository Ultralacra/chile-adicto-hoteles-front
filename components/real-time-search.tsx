"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

interface SearchResult {
  slug: string;
  featuredImage: string | null;
  name_es: string;
}

export function RealTimeSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/search?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setResults(data.items || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    router.push(`/${result.slug}`);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && query.length >= 2;

  return (
    <div className={`relative ${className || ""}`}>
      <div className="relative w-full flex items-center">
        <SearchIcon className="absolute left-3 size-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar..."
          aria-label="Buscar lugares"
          className="w-full h-9 pl-9 pr-8 text-sm rounded-md border border-input bg-background shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2 p-1 hover:bg-gray-100 rounded"
            aria-label="Limpiar búsqueda"
          >
            <XIcon className="size-3 text-gray-400" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[320px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              Sin resultados para "{query}"
            </div>
          ) : (
            <ul role="listbox" className="py-1">
              {results.map((r, i) => (
                <li key={r.slug}>
                  <button
                    onClick={() => navigateToResult(r)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                      i === selectedIndex ? "bg-gray-100" : ""
                    }`}
                    role="option"
                    aria-selected={i === selectedIndex}
                  >
                    {r.featuredImage && (
                      <img
                        src={r.featuredImage}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span className="text-sm font-medium line-clamp-1">
                      {r.name_es || r.slug}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
