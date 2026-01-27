"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className={`fixed right-6 bottom-6 z-50 w-16 h-16 bg-black text-white shadow-lg flex items-center justify-center transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-8 h-8"
        aria-hidden="true"
      >
        {/* Filled triangle pointing up with slight white stroke for contrast */}
        <path
          d="M12 6l6 6H6l6-6z"
          fill="white"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="0.5"
        />
      </svg>
    </button>
  );
}
