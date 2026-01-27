"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, MapPin } from "lucide-react";

/**
 * Componente para cambiar entre sitios usando previewSite
 * Solo visible en desarrollo
 */
export function SitePreviewSwitcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentPreview = searchParams?.get("previewSite") || "santiagoadicto";

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const switchSite = (site: "santiagoadicto" | "chileadicto") => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("previewSite", site);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3">
      <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
        🔍 Vista Previa
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={currentPreview === "santiagoadicto" ? "default" : "outline"}
          onClick={() => switchSite("santiagoadicto")}
          className="text-xs"
        >
          <MapPin className="w-3 h-3 mr-1" />
          Santiago
        </Button>
        <Button
          size="sm"
          variant={currentPreview === "chileadicto" ? "default" : "outline"}
          onClick={() => switchSite("chileadicto")}
          className="text-xs"
        >
          <Building2 className="w-3 h-3 mr-1" />
          Chile
        </Button>
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center">
        Actual: <strong>{currentPreview}</strong>
      </div>
    </div>
  );
}
