"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CategoryNav } from "@/components/category-nav";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HotelCard } from "@/components/hotel-card";

type RankedHotel = { hotelSlug: string; count: number };
type VotingPost = {
  slug: string;
  featuredImage?: string | null;
  images?: string[];
  es?: { name?: string; subtitle?: string; description?: string[] };
};

function postImage(post: VotingPost) {
  return post.featuredImage || post.images?.[0] || "/placeholder.svg";
}

function postName(post: VotingPost) {
  return post.es?.name || post.slug.replace(/-/g, " ");
}

function postDescription(post: VotingPost) {
  return (post.es?.description || [])
    .map((paragraph) =>
      String(paragraph)
        .replace(/<[^>]*>/g, "")
        .trim(),
    )
    .filter(Boolean);
}

function RankHeart({ rank }: { rank: number }) {
  const rankNumber = String(rank).padStart(2, "0");

  return (
    <img
      src={`/banner-resultados/CORAZONES/corazon_${rankNumber}.webp`}
      alt={`Puesto ${rank}`}
      className="h-[72px] w-[60px] object-contain"
    />
  );
}

const TOP_15_BANNER_DESKTOP = "/banner-resultados/TOP 15/top-15_desktop.webp";
const TOP_15_BANNER_MOBILE = "/banner-resultados/TOP 15/top-15_movil.webp";

export function VotingResultsView({
  variant,
}: {
  variant: "top-15" | "winner";
}) {
  const [ranking, setRanking] = useState<RankedHotel[]>([]);
  const [posts, setPosts] = useState<Record<string, VotingPost>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      try {
        const [votesResponse, postsResponse] = await Promise.all([
          fetch("/api/votes?site=chileadicto", { cache: "no-store" }),
          fetch("/api/posts", { cache: "no-store" }),
        ]);
        if (!votesResponse.ok || !postsResponse.ok)
          throw new Error("No se pudieron cargar los resultados");

        const votes = await votesResponse.json();
        const postList = await postsResponse.json();
        if (cancelled) return;

        setRanking(
          Array.isArray(votes.hotels) ? votes.hotels.slice(0, 15) : [],
        );
        setPosts(
          Array.isArray(postList)
            ? Object.fromEntries(
                postList.map((post: VotingPost) => [post.slug, post]),
              )
            : {},
        );
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadResults();
    return () => {
      cancelled = true;
    };
  }, []);

  const rankedPosts = ranking
    .map((entry) => ({ entry, post: posts[entry.hotelSlug] }))
    .filter((item): item is { entry: RankedHotel; post: VotingPost } =>
      Boolean(item.post),
    );
  const winner = rankedPosts[0];

  return (
    <div className="min-h-screen bg-white">
      <Header showHomeSecurityBanner={false} />
      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="votacion" />
        </div>

        <section className="voting-results-page">
          {variant === "top-15" ? (
            <picture className="block w-full overflow-hidden">
              <source
                media="(max-width: 767px)"
                srcSet={TOP_15_BANNER_MOBILE}
              />
              <Image
                src={TOP_15_BANNER_DESKTOP}
                alt="Top 15 más votados"
                width={1920}
                height={500}
                className="block h-auto w-full"
                priority
              />
            </picture>
          ) : (
            <header className="voting-results-page__header">
              <span
                className="voting-results-page__header-heart"
                aria-hidden="true"
              >
                &hearts;
              </span>
              <h1>HOTEL MAS VOTADO DE TODAS LAS CATEGORIAS</h1>
              <strong>Chile adicto</strong>
            </header>
          )}

          {loading ? (
            <p className="voting-results-page__state">Cargando resultados...</p>
          ) : error ? (
            <p className="voting-results-page__state">
              No fue posible cargar los resultados.
            </p>
          ) : variant === "top-15" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-[18px]">
              {rankedPosts.map(({ entry, post }, index) => (
                <div className="col-span-1" key={post.slug}>
                  <HotelCard
                    slug={post.slug}
                    name={postName(post)}
                    subtitle={post.es?.subtitle || ""}
                    description=""
                    image={postImage(post)}
                    voteElement={<RankHeart rank={index + 1} />}
                    voteIconSize="large"
                    votePosition="right"
                    hideDescription
                  />
                  <span className="sr-only">{entry.count} votos</span>
                </div>
              ))}
            </div>
          ) : winner ? (
            <article className="voting-winner">
              <Image
                src={postImage(winner.post)}
                alt={postName(winner.post)}
                width={1920}
                height={1080}
                className="voting-winner__image"
                priority
              />
              <div className="voting-winner__heading">
                <span aria-hidden="true">&hearts;</span>
                <div>
                  <h2>{postName(winner.post)}</h2>
                  {winner.post.es?.subtitle && <p>{winner.post.es.subtitle}</p>}
                </div>
              </div>
              <div className="voting-winner__body">
                {postDescription(winner.post).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ) : (
            <p className="voting-results-page__state">
              Aun no hay resultados disponibles.
            </p>
          )}
        </section>
      </main>
      <Footer activeCategory="votacion" />
    </div>
  );
}
