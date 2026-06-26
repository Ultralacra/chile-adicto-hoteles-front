"use client";

interface BackButtonProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

export function BackButton({ className = "", showText = true, onClick }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    window.history.back();
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-black hover:text-red-600 transition-colors font-medium tracking-wide ${className}`}
      aria-label="Volver"
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
          VOLVER
        </span>
      )}
    </button>
  );
}
