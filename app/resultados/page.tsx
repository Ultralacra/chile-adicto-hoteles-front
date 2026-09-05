"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { CategoryNav } from "@/components/category-nav";
import { Footer } from "@/components/footer";
import { supabase } from "@/lib/supabase-client";

type HotelResult = { hotelSlug: string; count: number };
type CategoryResult = {
  category: string;
  hearts: number;
  total: number;
  hotels: HotelResult[];
};
type VoteSummary = {
  total: number;
  totalHotels: number;
  uniqueVoters: number;
  hotels: HotelResult[];
  categorySummaries: CategoryResult[];
};

const displayNames: Record<string, string> = {
  "hotel-puerta-del-sur": "Hotel Puerta del Sur",
  "el-remanso-del-puelo": "El Remanso del Puelo",
  "corralco-hotel-spa": "Corralco Hotel & Spa",
  "tawa-refugio-puelo": "Tawa Refugio Puelo",
  "puyuhuapi-lodge-spa": "Puyuhuapi Lodge & Spa",
  "hotel-ski-portillo": "Hotel Ski Portillo",
  "hotel-cava-estancia-rilan": "Hotel Cava Estancia Rilán",
  "la-pesebrera-del-maule": "La Pesebrera del Maule",
  "reserva-biologica-huilo-huilo": "Reserva Biológica Huilo Huilo",
  "rio-serrano-hotel-spa": "Río Serrano Hotel & Spa",
  "hotel-cabo-de-hornos": "Hotel Cabo de Hornos",
  "hotel-termas-de-chillan": "Hotel Termas de Chillán",
  "hotel-refugia-chiloe": "Hotel Refugia Chiloé",
  "hotel-las-majadas": "Hotel Las Majadas",
  "debaines-hotel": "Debaines Hotel",
};

const formatNumber = (value: number) => value.toLocaleString("es-CL");
const hotelName = (slug: string) =>
  displayNames[slug] ||
  slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const Heart = () => (
  <span aria-hidden="true" className="results-heart">
    &hearts;
  </span>
);

function OverallRow({
  entry,
  index,
  maxVotes,
}: {
  entry: HotelResult;
  index: number;
  maxVotes: number;
}) {
  return (
    <li
      className="overall-row"
      id={index === 0 ? "hotel-mas-votado" : undefined}
    >
      <span className={`overall-rank rank-${index + 1}`}>{index + 1}</span>
      <div className="overall-detail">
        <div className="overall-name-line">
          <span>{hotelName(entry.hotelSlug)}</span>
          <strong>{formatNumber(entry.count)} votos</strong>
        </div>
        <div className="overall-track">
          <span
            className={`overall-bar ${index < 3 ? "podium-bar" : ""}`}
            style={{
              width: `${Math.max(13, (entry.count / maxVotes) * 100)}%`,
            }}
          />
        </div>
      </div>
    </li>
  );
}

function CategoryBlock({ category }: { category: CategoryResult }) {
  const maxVotes = category.hotels[0]?.count || 1;
  return (
    <section className="category-block">
      <div className="category-heading">
        <div>
          <h3>
            {category.category}{" "}
            {category.hearts ? `${category.hearts} corazones` : ""}
          </h3>
          <p>
            <Heart /> {formatNumber(category.total)} votos{" "}
            <span className="dot">·</span> {category.hotels.length} hoteles
            participantes
          </p>
        </div>
        <span className="category-count">TIEMPO REAL</span>
      </div>
      <ol className="category-list">
        {category.hotels.slice(0, 3).map((entry, index) => (
          <li className="category-row" key={entry.hotelSlug}>
            <span className="category-rank">{index + 1}</span>
            <div className="category-detail">
              <div className="category-name-line">
                <span>{hotelName(entry.hotelSlug)}</span>
                <strong>{formatNumber(entry.count)}</strong>
              </div>
              <div className="category-track">
                <span
                  className="category-bar"
                  style={{
                    width: `${Math.max(9, (entry.count / maxVotes) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResultadosContent() {
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const loadSummary = async () => {
    try {
      const response = await fetch("/api/votes?site=chileadicto&pageSize=10", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("No se pudo cargar el resumen");
      const data = await response.json();
      setSummary(data);
      setLastUpdate(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const channel = supabase
      .channel("public-vote-results")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        loadSummary,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(
    () =>
      [...(summary?.categorySummaries || [])].sort(
        (first, second) =>
          first.category.localeCompare(second.category) ||
          second.hearts - first.hearts,
      ),
    [summary],
  );
  const categoryCount = new Set(
    categories.map((category) => category.category.toLowerCase()),
  ).size;
  const ranking = (summary?.hotels || []).slice(0, 15);
  const maxVotes = ranking[0]?.count || 1;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="site-inner">
        <CategoryNav activeCategory="todos" compact />
      </div>
      <main className="results-page">
        <div className="results-paper">
          <section className="results-intro">
            <p className="results-kicker">Chile Adicto Hoteles</p>
            <h1>Resumen de la votación</h1>
            <p className="results-subtitle">
              Datos consolidados desde el sitio oficial de votación
            </p>
            {loading ? (
              <div className="results-state">Cargando resultados...</div>
            ) : error ? (
              <div className="results-state">
                No fue posible cargar los resultados.
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  {[
                    [formatNumber(summary?.total || 0), "Votos totales"],
                    [
                      formatNumber(summary?.uniqueVoters || 0),
                      "Votantes únicos",
                    ],
                    [
                      formatNumber(summary?.totalHotels || 0),
                      "Hoteles participantes",
                    ],
                    [formatNumber(categoryCount), "Categorías"],
                  ].map(([value, label]) => (
                    <div className="stat" key={label}>
                      <Heart />
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="results-note">
                  Norte, Sur, Centro, Santiago y Torres del Paine se dividen en
                  subcategorías de 5 y 4 corazones. Los resultados se actualizan
                  automáticamente cuando se registra un nuevo voto.
                </p>
              </>
            )}
          </section>
          <section className="overall-section" id="top-15">
            <div className="section-intro">
              <p className="results-kicker">
                Ranking general <span className="live-dot">● EN VIVO</span>
              </p>
              <h2>Top 15 hoteles más votados</h2>
              <p>
                <Heart /> Ranking general, todas las categorías y subcategorías{" "}
                {lastUpdate
                  ? `· actualizado ${lastUpdate.toLocaleTimeString("es-CL")}`
                  : ""}
              </p>
            </div>
            {!loading && !error && ranking.length ? (
              <ol className="overall-grid">
                {ranking.map((entry, index) => (
                  <OverallRow
                    entry={entry}
                    index={index}
                    maxVotes={maxVotes}
                    key={entry.hotelSlug}
                  />
                ))}
              </ol>
            ) : (
              <div className="results-state">Aún no hay votos registrados.</div>
            )}
          </section>
          <section className="categories-section" id="resultados-por-categoria">
            <div className="section-intro categories-intro">
              <p className="results-kicker">Resultados por categoría</p>
              <h2>Los favoritos de cada destino</h2>
            </div>
            {categories.length ? (
              <div className="categories-grid">
                {categories.map((category) => (
                  <CategoryBlock
                    category={category}
                    key={`${category.category}-${category.hearts}`}
                  />
                ))}
              </div>
            ) : (
              <div className="results-state">
                Las categorías aparecerán cuando existan votos.
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer activeCategory="todos" />
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResultadosContent />
    </Suspense>
  );
}
