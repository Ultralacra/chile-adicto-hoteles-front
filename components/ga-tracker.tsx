"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = "G-LDF4JN0LDG";

function GATrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    // Enviar evento de page_view en cambios de ruta (App Router)
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GATracker() {
  // Envolver en Suspense para cumplir requisito de Next 15 cuando se usan hooks de navegación
  return (
    <Suspense fallback={null}>
      <GATrackerInner />
    </Suspense>
  );
}
