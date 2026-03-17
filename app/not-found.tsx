import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[var(--color-brand-red)]">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl font-bold">Página no encontrada</h1>
        <p className="mt-4 text-base text-gray-600">
          La ruta que intentaste abrir no existe o fue movida.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-sm bg-[var(--color-brand-red)] px-6 py-3 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
