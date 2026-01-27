"use client";

import Image from "next/image";

export function AgendaCulturalBanner() {
  return (
    <div
      className="rounded-[15px] px-5 py-4 inline-grid grid-cols-[auto_auto_auto] items-start gap-x-4"
      style={{ backgroundColor: "#0C6B59" }}
      aria-label="Agenda Cultural"
    >
      <div className="flex items-center gap-3">
        <div className="text-white leading-tight">
          <div className="font-neutra font-semibold tracking-wide text-[20px]">
            *AGENDA CULTURAL
          </div>
          <div className="font-neutra text-[13px] opacity-90">
            CINE, EXPOS, CONCIERTOS,
          </div>
          <div className="font-neutra text-[13px] opacity-90">
            TEATRO, FERIAS, MERCADOS Y +
          </div>
        </div>
      </div>

      <div className="flex items-start justify-center pt-[2px]">
        <Image
          src="/favicon.svg"
          alt="Agenda Cultural"
          width={36}
          height={36}
          className="h-9 w-9"
        />
      </div>

      <div className="flex items-end justify-end gap-2 text-white self-end">
        <div className="font-neutra text-[10px] opacity-90 leading-none h-[40px] flex items-end">
          PRESENTADO POR
        </div>
        <Image
          src="/aguas-andinas-logo-scaled.jpeg"
          alt="Aguas Andinas"
          width={120}
          height={64}
          className="h-[40px] w-auto rounded-[10px]"
        />
      </div>
    </div>
  );
}
