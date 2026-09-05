"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HotelMasVotadoPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/votes?site=chileadicto", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const winnerSlug = data?.hotels?.[0]?.hotelSlug;
        if (!cancelled && typeof winnerSlug === "string" && winnerSlug) {
          router.replace(`/${winnerSlug}`);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <div className="min-h-screen bg-white" />;
}
