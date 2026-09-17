"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const WINNER_IMAGE = "/WhatsApp Image 2026-09-11 at 20.34.24.png";

type SorteoWinnerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SorteoWinnerModal({
  open,
  onOpenChange,
}: SorteoWinnerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[92vh] w-[calc(100%-1.5rem)] gap-0 overflow-y-auto border-0 bg-white p-0 shadow-[0_30px_80px_rgba(0,0,0,0.4)] sm:max-w-[920px] rounded-none [&>button]:top-3 [&>button]:right-3 [&>button]:z-20 [&>button]:bg-white/95 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:shadow-md"
      >
        <div className="grid lg:grid-cols-[380px_1fr]">
          <div className="relative h-[320px] overflow-hidden bg-[#111] sm:h-[380px] lg:h-full lg:min-h-[520px]">
            <Image
              src={WINNER_IMAGE}
              alt="Fernando Ponce, ganador del sorteo"
              fill
              className="object-cover object-[center_18%]"
              sizes="(max-width: 1023px) 100vw, 380px"
              priority
            />
          </div>

          <div className="flex flex-col justify-center px-6 py-7 sm:px-10 sm:py-10">
            <Image
              src="/logo-best-espanol.svg"
              alt="Chile Adicto Hoteles"
              width={240}
              height={80}
              className="mb-5 h-12 w-auto sm:h-14"
            />

            <p className="mb-3 font-neutra text-[11px] font-semibold tracking-[0.22em] text-[var(--color-brand-red)] uppercase">
              Ganador del sorteo
            </p>

            <DialogTitle className="font-neutra mb-4 text-[26px] leading-[1.1] font-semibold text-black sm:text-[32px]">
              ¡Felicitaciones a Fernando Ponce!
            </DialogTitle>

            <div className="mb-5 h-px w-14 bg-[var(--color-brand-red)]" />

            <DialogDescription asChild>
              <div className="font-neutra space-y-4 text-[15px] leading-[24px] text-black">
                <p>
                  Fernando Ponce es el flamante ganador del sorteo de 1 estadía
                  de 3 noches, para 4 personas, en el increíble hotel{" "}
                  <strong>Taka Matanzas</strong>. Ya tomamos contacto con él, y
                  no lo podía creer.
                </p>
                <p className="text-[#555]">
                  El sorteo se llevó a cabo a través del sistema Random.org, tal
                  como lo especificaban las bases del concurso, y su voto fue el
                  número <strong className="text-black">4358</strong> del 4 de
                  agosto de 2026.
                </p>
              </div>
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
