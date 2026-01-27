import Image from "next/image";
import Link from "next/link";

interface HotelCardProps {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  imageVariant?: "default" | "tall";
}

export function HotelCard({
  slug,
  name,
  subtitle,
  description,
  image,
  imageVariant = "default",
}: HotelCardProps) {
  const imageContainerClass =
    imageVariant === "tall" ? "h-[500px]" : "aspect-[386/264]";

  return (
    <Link href={`/${slug}`}>
      <article className="group cursor-pointer flex flex-col h-full gap-3">
        {/* Image Container */}
        <div className={`relative ${imageContainerClass} overflow-hidden`}>
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="space-y-3 flex-1">
          {/* Heart Icon and Title */}
          <div className="flex items-start gap-[10px]">
            <div className="flex-shrink-0">
              <div
                className="flex items-center justify-center"
                style={{ width: 41, height: 50 }}
              >
                <img
                  src="/favicon.svg"
                  alt="icon"
                  style={{ width: 41, height: 50 }}
                />
              </div>
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
          <p className="font-neutra text-[15px] text-black leading-[22px] font-normal line-clamp-5 min-h-[110px]">
            {description}
          </p>
        </div>

        {/* Elegant divider pushed to bottom so all cards align */}
        <div className="mt-auto pt-2 pb-5">
          <div className="mx-auto h-[1px] w-3/4 bg-[#b4b4b8]" />
        </div>
      </article>
    </Link>
  );
}
