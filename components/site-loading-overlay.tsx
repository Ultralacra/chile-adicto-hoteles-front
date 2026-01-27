"use client";

import { useSiteContext } from "@/contexts/site-context";
import { SITES } from "@/lib/sites-config";
import { Loader2 } from "lucide-react";

export function SiteLoadingOverlay() {
  const { isChanging, currentSite } = useSiteContext();

  if (!isChanging) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 max-w-md mx-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-1">
            Cambiando a {SITES[currentSite].displayName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Cargando posts, categorías, comunas y sliders...
          </p>
        </div>
      </div>
    </div>
  );
}
