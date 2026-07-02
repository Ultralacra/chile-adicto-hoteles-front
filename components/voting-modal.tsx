"use client";

import { useState } from "react";
import { VoteHeart } from "./vote-heart";
import { getHotelHearts } from "@/lib/voting-config";

interface VotingModalProps {
  hotelName: string;
  hotelSlug: string;
  categorySlug: string;
}

export function VotingModal({ hotelName, hotelSlug, categorySlug }: VotingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
    setSubmitted(false);
    setError("");
    setName("");
    setEmail("");
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo válido");
      return;
    }

    setLoading(true);

    try {
      const hearts = getHotelHearts(categorySlug, hotelSlug);
      if (hearts !== 4 && hearts !== 5) {
        setError("No se pudo determinar el rating de corazones para este hotel");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_slug: hotelSlug,
          voter_name: name.trim(),
          voter_email: email.toLowerCase().trim(),
          site: "chileadicto",
          category: categorySlug,
          hearts,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || "Error al enviar el voto");
      }
    } catch {
      setError("Error al enviar el voto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <VoteHeart onClick={openModal} className="absolute bottom-2 right-2 z-20" />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <h3 className="font-neutra-demi text-xl text-center mb-2 uppercase">
                  Votar por
                </h3>
                <p className="text-center text-gray-700 mb-6 font-medium">
                  {hotelName}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#E4032C]"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Correo</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#E4032C]"
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-[#E4032C] text-white rounded hover:bg-[#c00224] transition-colors disabled:opacity-50"
                    >
                      {loading ? "Enviando..." : "Votar"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mb-4 flex justify-center">
                  <VoteHeart className="w-16 h-20" />
                </div>
                <h3 className="font-neutra-demi text-xl mb-2 uppercase">¡Gracias!</h3>
                <p className="text-gray-600 mb-6">
                  Tu voto por <strong>{hotelName}</strong> ha sido registrado.
                </p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-[#E4032C] text-white rounded hover:bg-[#c00224] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
