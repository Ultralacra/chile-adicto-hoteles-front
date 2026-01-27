"use client";

import { useSiteContext } from "@/contexts/site-context";
import { SITES, type SiteId } from "@/lib/sites-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteSelector() {
  const { currentSite, setSite, isChanging } = useSiteContext();

  const handleViewSite = () => {
    const site = SITES[currentSite];
    // En desarrollo, usar localhost con parámetro de sitio
    // En producción, usar el dominio configurado
    if (process.env.NODE_ENV === 'development') {
      // Usar el parámetro ?previewSite= para forzar el sitio en desarrollo
      const url = `http://localhost:3000?previewSite=${currentSite}`;
      window.open(url, '_blank');
    } else {
      const url = `https://${site.domain}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        {isChanging ? (
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
        ) : (
          <Globe className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-300">Sitio:</span>
      </div>
      <Select 
        value={currentSite} 
        onValueChange={(value) => setSite(value as SiteId)}
        disabled={isChanging}
      >
        <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(SITES).map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={handleViewSite}
        variant="outline"
        size="sm"
        className="w-full mt-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        disabled={isChanging}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Ver Web
      </Button>

      {isChanging && (
        <p className="text-xs text-gray-400 mt-2 animate-pulse text-center">
          Cambiando a {SITES[currentSite].displayName}...
        </p>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Dominio: <span className="text-gray-400">{SITES[currentSite].domain}</span>
        </p>
      </div>
    </div>
  );
}
