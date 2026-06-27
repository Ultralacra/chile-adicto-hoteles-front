"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";

type VoteCounts = Record<string, number>;

type UseRealtimeVotesOptions = {
  site?: string;
};

export function useRealtimeVotes({ site = "chileadicto" }: UseRealtimeVotesOptions = {}) {
  const [counts, setCounts] = useState<VoteCounts>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar conteo inicial
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/votes?group=hotel&site=${site}`);
      const data = await res.json();
      if (data.ok) {
        setCounts(data.counts);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error fetching vote counts:", err);
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => {
    fetchCounts();

    // Suscribirse a cambios en tiempo real en la tabla votes
    const channel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "votes",
        },
        () => {
          // Cuando hay un cambio, recargar los conteos
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounts]);

  return { counts, total, loading, refetch: fetchCounts };
}
