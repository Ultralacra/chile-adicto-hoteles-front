"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import clsx from "clsx";

interface LanguageSwitcherProps {
  className?: string;
  dark?: boolean; // Para fondo oscuro (menú móvil)
}

export function LanguageSwitcher({ className, dark }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const other = language === "es" ? "en" : "es";
  const flagSrc = other === "es" ? "/flags/cl.svg" : "/flags/us.svg";
  const label = other.toUpperCase();

  return (
    <div className={clsx("flex items-center", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(other as "es" | "en")}
        className={clsx(
          "text-[16px] leading-[20px] font-medium flex items-center font-neutra",
          dark && "!text-white hover:!text-gray-300"
        )}
        aria-label={`Cambiar idioma a ${label}`}
      >
        {label}
        <Image
          src={flagSrc}
          alt={`Flag ${label}`}
          width={20}
          height={14}
          className="ml-2"
        />
      </Button>
    </div>
  );
}
