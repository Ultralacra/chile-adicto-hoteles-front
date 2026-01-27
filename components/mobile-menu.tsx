"use client";

import { MobileFooterContent } from "./mobile-footer-content";
import { Suspense } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white hover:text-gray-300"
          aria-label="Close menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* useSearchParams en MobileFooterContent requiere Suspense en Next 15 */}
        <Suspense fallback={null}>
          <MobileFooterContent onNavigate={onClose} showMenu />
        </Suspense>
      </div>
    </div>
  );
}
