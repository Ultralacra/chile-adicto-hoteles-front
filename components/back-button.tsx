"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";

interface BackButtonProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

export function BackButton({ className = "", showText = true, onClick }: BackButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("nav:direction", "back");
      }
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-black hover:text-[var(--color-brand-red)] transition-colors font-neutra tracking-wide ${className}`}
      aria-label={t("Volver", "Back")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
      {showText && (
        <span className="text-[15px] leading-[20px] uppercase font-semibold">
          {t("Volver", "Back")}
        </span>
      )}
    </button>
  );
}

export function BackButtonMobile({ onClick }: { onClick?: () => void }) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("nav:direction", "back");
      }
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-white hover:text-gray-300 transition-colors font-neutra-demi text-[14px] leading-[19px] font-[600]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
      {t("VOLVER", "BACK")}
    </button>
  );
}
