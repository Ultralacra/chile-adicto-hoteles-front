"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { SiteId } from "@/lib/sites-config";
import { DEFAULT_SITE } from "@/lib/sites-config";

interface SiteContextType {
  currentSite: SiteId;
  setSite: (siteId: SiteId) => void;
  isChanging: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [currentSite, setCurrentSite] = useState<SiteId>(DEFAULT_SITE);
  const [isChanging, setIsChanging] = useState(false);

  // Cargar el sitio desde localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin:currentSite");
      if (saved === "santiagoadicto" || saved === "chileadicto") {
        setCurrentSite(saved);
      }
    }
  }, []);

  // Guardar cuando cambia
  const setSite = (siteId: SiteId) => {
    if (siteId === currentSite) return; // No hacer nada si es el mismo sitio

    setIsChanging(true);
    setCurrentSite(siteId);

    if (typeof window !== "undefined") {
      localStorage.setItem("admin:currentSite", siteId);
    }

    // Simular un delay para que se vea el loading y se recarguen todos los datos
    setTimeout(() => {
      setIsChanging(false);
    }, 800);
  };

  return (
    <SiteContext.Provider value={{ currentSite, setSite, isChanging }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSiteContext debe usarse dentro de SiteProvider");
  }
  return context;
}
