"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HotelCardProps {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  images?: string[];
  imageVariant?: "default" | "tall";
  externalUrl?: string;
  voteElement?: ReactNode;
  asDiv?: boolean;
  hideDescription?: boolean;
  voteIconSize?: "default" | "large";
}

export function HotelCard({
  slug,
  name,
  subtitle,
  description,
  image,
  images,
  imageVariant = "default",
  externalUrl,
  voteElement,
  asDiv = false,
  hideDescription = false,
  voteIconSize = "default",
}: HotelCardProps) {
  const imageContainerClass =
    imageVariant === "tall" ? "h-[500px]" : "aspect-[386/264]";

  const allImages =
    images && images.length > 0
      ? images.filter(Boolean)
      : image
        ? [image]
        : [];
  const hasCarousel = allImages.length > 1;

  const href = externalUrl || `/${slug}`;
  const isExternal = Boolean(externalUrl);

  const content = (
    <article className="group cursor-pointer flex flex-col h-full gap-3">
        {/* Image Container */}
        <div className={`relative ${imageContainerClass} overflow-hidden`}>
          {hasCarousel ? (
            <CardCarousel images={allImages} alt={name} />
          ) : (
            <img
              src={allImages[0] || "/placeholder.svg"}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>

        {/* Content */}
        <div className="space-y-3 flex-1">
          {/* Heart Icon and Title */}
          <div className="flex items-start gap-[10px]">
            <div className="flex-shrink-0">
              {voteElement ? (
                <div
                  className="flex items-center justify-center"
                  style={{ width: voteIconSize === "large" ? 60 : 50, height: voteIconSize === "large" ? 72 : 60 }}
                >
                  {voteElement}
                </div>
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{ width: voteIconSize === "large" ? 49 : 41, height: voteIconSize === "large" ? 60 : 50 }}
                >
                  <img
                    src="/favicon.svg"
                    alt="icon"
                    style={{ width: voteIconSize === "large" ? 49 : 41, height: voteIconSize === "large" ? 60 : 50 }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="font-neutra text-[15px] font-normal text-black leading-[19px] mb-0 first-line:font-[600]">
                {name}
              </h2>
              <p className="font-neutra text-[15px] font-normal text-black uppercase leading-[19px]">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Description */}
          {!hideDescription && (
            <p className="font-neutra text-[15px] text-black leading-[22px] font-normal line-clamp-5 min-h-[110px]">
              {description}
            </p>
          )}
        </div>

        {/* Elegant divider pushed to bottom so all cards align */}
        <div className="mt-auto pt-2 pb-5">
          <div className="mx-auto h-[1px] w-3/4 bg-[#b4b4b8]" />
        </div>
      </article>
  );

  if (asDiv) {
    return content;
  }

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("scroll:position", String(window.scrollY));
          sessionStorage.setItem("scroll:path", window.location.pathname);
        }
      }}
    >
      {content}
    </Link>
  );
}

function CardCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, watchDrag: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative h-full w-full">
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {images.map((src, idx) => (
            <div
              key={idx}
              className="relative min-w-full h-full flex-shrink-0"
            >
              <img
                src={src || "/placeholder.svg"}
                alt={`${alt} ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Flechas */}
      <button
        type="button"
        aria-label="Imagen previa"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          emblaApi?.scrollPrev();
        }}
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-3 h-3" />
      </button>
      <button
        type="button"
        aria-label="Imagen siguiente"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          emblaApi?.scrollNext();
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
          {images.map((_, dotIdx) => (
            <span
              key={dotIdx}
              className={`rounded-full transition-all ${
                dotIdx === selectedIndex
                  ? "bg-[#E40E36] w-2 h-2"
                  : "bg-white/70 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
