"use client";

import { useState } from "react";
import { HotelCard } from "./hotel-card";

interface VoteButtonProps {
  hotelName: string;
  hotelSlug: string;
  categorySlug: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  imageVariant?: "default" | "tall";
}

export function VotingHotelCard({
  hotelName,
  hotelSlug,
  categorySlug,
  slug,
  name,
  subtitle,
  description,
  image,
  imageVariant = "default",
}: VoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voterName, setVoterName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    setSubmitted(false);
    setError("");
    setVoterName("");
    setEmail("");
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!voterName.trim() || !email.trim()) {
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
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: voterName.trim(),
          email: email.trim(),
          hotelSlug,
          hotelName,
          categorySlug,
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

  // Icono del corazón que se muestra a la izquierda del nombre
  const heartIcon = (
    <svg width="50" height="60" viewBox="0 0 246 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M169.188 27.0078C139.814 27.0078 129.792 42.2223 112.6 64.2282C95.4071 42.2223 85.3687 27.0078 56.0114 27.0078C24.4948 27.0078 3.70898 50.217 3.70898 85.0472C3.70898 96.7507 6.42881 109.212 12.297 121.674V161.977C12.297 165.224 14.9343 167.845 18.1651 167.845C21.3959 167.845 24.0333 165.224 24.0333 161.977V140.861C26.1596 143.631 28.4508 146.383 30.9069 149.12L54.907 175.791V224.747C54.907 227.995 57.5279 230.616 60.7751 230.616C64.0224 230.616 66.6433 227.995 66.6433 224.747V188.846L112.6 239.978L133.204 217.082V261.704C133.204 264.935 135.858 267.572 139.089 267.572C142.319 267.572 144.973 264.951 144.973 261.704V204.027L175.369 170.153V212.418C175.369 215.648 177.99 218.286 181.237 218.286C184.484 218.286 187.105 215.665 187.105 212.418V157.098L194.259 149.136C213.248 128.317 221.474 105.487 221.474 85.0802C221.474 50.2499 200.704 27.0408 169.171 27.0408" fill="#E4032C"/>
      <path d="M41.7367 190.412C41.7367 185.302 37.5828 181.148 32.4729 181.148C27.363 181.148 23.2256 185.286 23.2256 190.412C23.2256 195.539 27.363 199.676 32.4729 199.676C37.5828 199.676 41.7367 195.539 41.7367 190.412Z" fill="#E4032C"/>
      <path d="M205.434 162.047C202.187 162.047 199.55 164.701 199.55 167.931C199.55 171.162 202.187 173.816 205.434 173.816C208.682 173.816 211.336 171.179 211.336 167.931C211.336 164.684 208.682 162.047 205.434 162.047Z" fill="#E4032C"/>
      <path d="M148.105 290.769C148.105 285.626 143.951 281.488 138.841 281.488C133.731 281.488 129.594 285.626 129.594 290.769C129.594 295.912 133.731 300 138.841 300C143.951 300 148.105 295.862 148.105 290.769Z" fill="#E4032C"/>
      <path d="M85.9459 243.624C85.9459 240.377 83.3085 237.723 80.0613 237.723C76.814 237.723 74.1602 240.377 74.1602 243.624C74.1602 246.871 76.7975 249.509 80.0613 249.509C83.325 249.509 85.9459 246.871 85.9459 243.624Z" fill="#E4032C"/>
      <path d="M64.5005 256.942C64.5005 254.898 62.8357 253.217 60.7917 253.217C58.7477 253.217 57.0664 254.882 57.0664 256.942C57.0664 259.003 58.7313 260.667 60.7917 260.667C62.8522 260.667 64.5005 259.003 64.5005 256.942Z" fill="#E4032C"/>
      <path d="M245.836 100.034C245.836 96.7867 243.182 94.1328 239.951 94.1328C236.72 94.1328 234.05 96.7867 234.05 100.034C234.05 103.281 236.687 105.935 239.951 105.935C243.215 105.935 245.836 103.281 245.836 100.034Z" fill="#E4032C"/>
      <path d="M3.7088 26.8105C1.66484 26.8105 0 28.4754 0 30.5194C0 32.5634 1.66484 34.2447 3.7088 34.2447C5.75277 34.2447 7.43411 32.5799 7.43411 30.5194C7.43411 28.4589 5.76925 26.8105 3.7088 26.8105Z" fill="#E4032C"/>
      <path d="M164.111 7.35156C162.067 7.35156 160.402 9.01642 160.402 11.0769C160.402 13.1374 162.067 14.8022 164.111 14.8022C166.155 14.8022 167.836 13.1374 167.836 11.0769C167.836 9.01642 166.172 7.35156 164.111 7.35156Z" fill="#E4032C"/>
      <path d="M204.412 9.26388C204.412 4.12094 200.275 0 195.149 0C190.022 0 185.885 4.12094 185.885 9.26388C185.885 14.4068 190.022 18.5113 195.149 18.5113C200.275 18.5113 204.412 14.3574 204.412 9.26388Z" fill="#E4032C"/>
      <path d="M55.5312 81.5612H60.709L67.6946 98.2284C67.9624 98.8374 68.2526 99.6024 68.565 100.523C68.8775 101.444 69.123 102.217 69.3015 102.841L69.5693 103.754C70.1496 101.467 70.7596 99.6247 71.3994 98.2284L78.2957 81.5612H83.0048L69.7479 112.912H69.1676L55.5312 81.5612Z" fill="white"/>
      <path d="M84.1654 97.092C84.1654 94.8192 84.582 92.6949 85.4152 90.7192C86.2633 88.7287 87.4015 87.0352 88.8298 85.6389C90.2731 84.2425 91.9767 83.1507 93.9407 82.3634C95.9196 81.5612 98.01 81.1602 100.212 81.1602C102.399 81.1602 104.475 81.5612 106.439 82.3634C108.403 83.1507 110.099 84.2425 111.527 85.6389C112.971 87.0204 114.109 88.7064 114.942 90.697C115.79 92.6875 116.214 94.8192 116.214 97.092C116.214 100.122 115.5 102.856 114.072 105.292C112.643 107.728 110.709 109.622 108.269 110.974C105.829 112.326 103.143 113.002 100.212 113.002C97.2661 113.002 94.573 112.326 92.1329 110.974C89.6928 109.622 87.7511 107.728 86.3079 105.292C84.8795 102.856 84.1654 100.122 84.1654 97.092ZM92.2445 88.803C90.1615 91.0015 89.12 93.7645 89.12 97.092C89.12 100.419 90.1615 103.182 92.2445 105.381C94.3275 107.579 96.9834 108.679 100.212 108.679C103.441 108.679 106.089 107.579 108.157 105.381C110.24 103.182 111.282 100.419 111.282 97.092C111.282 93.7645 110.24 91.0015 108.157 88.803C106.089 86.5896 103.441 85.4829 100.212 85.4829C96.9834 85.4829 94.3275 86.5896 92.2445 88.803Z" fill="white"/>
      <path d="M118.178 85.8171V81.5612H141.434V85.8171H132.194V112.6H127.396V85.8171H118.178Z" fill="white"/>
      <path d="M140.34 112.6L153.642 81.2493H154.2L167.814 112.6H162.792L160.516 106.941H147.303L145.004 112.6H140.34ZM148.932 102.93H158.775L155.382 94.4849C155.174 93.9799 154.943 93.3634 154.691 92.6355C154.452 91.9076 154.252 91.2986 154.088 90.8084C153.939 90.3033 153.857 90.0062 153.842 89.9171C153.842 89.9319 153.805 90.0508 153.731 90.2736C153.671 90.4816 153.59 90.749 153.485 91.0758C153.396 91.4026 153.292 91.7591 153.173 92.1453C153.054 92.5167 152.913 92.9178 152.749 93.3486C152.6 93.7793 152.459 94.1581 152.325 94.4849L148.932 102.93Z" fill="white"/>
      <path d="M59.1468 158.235L72.4484 126.883H73.0063L86.6204 158.235H81.5988L79.3223 152.575H66.11L63.8113 158.235H59.1468ZM67.7392 148.564H77.5815L74.1892 140.119C73.9809 139.614 73.7503 138.997 73.4973 138.27C73.2593 137.542 73.0584 136.933 72.8947 136.442C72.7459 135.937 72.6641 135.64 72.6492 135.551C72.6492 135.566 72.612 135.685 72.5376 135.908C72.4781 136.116 72.3963 136.383 72.2921 136.71C72.2029 137.037 72.0987 137.393 71.9797 137.779C71.8607 138.151 71.7193 138.552 71.5556 138.983C71.4069 139.413 71.2655 139.792 71.1316 140.119L67.7392 148.564Z" fill="white"/>
      <path d="M87.7809 142.726C87.7809 140.453 88.1975 138.329 89.0307 136.353C89.8788 134.363 91.017 132.669 92.4454 131.273C93.8886 129.877 95.5922 128.785 97.5562 127.997C99.5351 127.195 101.626 126.794 103.828 126.794C106.015 126.794 108.09 127.195 110.054 127.997C112.018 128.785 113.715 129.877 115.143 131.273C116.586 132.654 117.724 134.34 118.558 136.331C119.406 138.322 119.83 140.453 119.83 142.726C119.83 144.954 119.428 147.034 118.625 148.965C117.836 150.896 116.727 152.575 115.299 154.001L119.83 159.014L116.638 161.711L111.974 156.541C109.548 157.937 106.833 158.636 103.828 158.636C100.882 158.636 98.1886 157.96 95.7485 156.608C93.3083 155.256 91.3667 153.362 89.9234 150.926C88.4951 148.49 87.7809 145.756 87.7809 142.726ZM95.86 134.437C93.777 136.636 92.7355 139.399 92.7355 142.726C92.7355 146.054 93.777 148.817 95.86 151.015C97.9431 153.214 100.599 154.313 103.828 154.313C105.702 154.313 107.413 153.949 108.961 153.221L104.653 148.43L107.912 145.734L112.286 150.614C114.027 148.549 114.897 145.92 114.897 142.726C114.897 139.399 113.856 136.636 111.773 134.437C109.705 132.224 107.056 131.117 103.828 131.117C100.599 131.117 97.9431 132.224 95.86 134.437Z" fill="white"/>
      <path d="M125.677 147.338V127.195H130.52V147.049C130.52 151.891 132.849 154.313 137.506 154.313C142.207 154.313 144.558 151.891 144.558 147.049V127.195H149.357V147.338C149.357 149.18 149.052 150.829 148.441 152.285C147.846 153.726 147.013 154.907 145.942 155.828C144.871 156.749 143.621 157.447 142.192 157.923C140.764 158.398 139.202 158.636 137.506 158.636C135.795 158.636 134.225 158.398 132.796 157.923C131.368 157.447 130.118 156.749 129.047 155.828C127.991 154.907 127.165 153.726 126.57 152.285C125.975 150.829 125.677 149.18 125.677 147.338Z" fill="white"/>
      <path d="M156.833 158.235V127.195H161.631V158.235H156.833ZM157.48 124.276L160.225 115.609H165.515L161.051 124.276H157.48Z" fill="white"/>
    </svg>
  );

  return (
    <>
      <div onClick={openModal} className="cursor-pointer">
        <HotelCard
          slug={slug}
          name={name}
          subtitle={subtitle}
          description={description}
          image={image}
          imageVariant={imageVariant}
          voteElement={heartIcon}
          asDiv
        />
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                {/* Logo */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/logo-best-espanol.svg"
                    alt="Santiago Adicto"
                    className="h-16 w-auto"
                  />
                </div>

                <h3 className="font-neutra-demi text-xl text-center mb-2 uppercase text-[#E4032C]">
                  Votar por
                </h3>
                <p className="text-center text-gray-800 mb-6 font-neutra-demi text-lg">
                  {hotelName}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#E4032C] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Tu nombre"
                      required
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Correo</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#E4032C] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="tu@correo.com"
                      required
                      disabled
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm text-center font-medium">{error}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={true}
                      className="flex-1 px-4 py-2 bg-[#E4032C] text-white rounded hover:bg-[#c00224] transition-colors disabled:opacity-50 font-medium"
                    >
                      Votar
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/logo-best-espanol.svg"
                    alt="Santiago Adicto"
                    className="h-16 w-auto"
                  />
                </div>

                <div className="mb-4 flex justify-center">
                  <svg width="60" height="72" viewBox="0 0 246 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M169.188 27.0078C139.814 27.0078 129.792 42.2223 112.6 64.2282C95.4071 42.2223 85.3687 27.0078 56.0114 27.0078C24.4948 27.0078 3.70898 50.217 3.70898 85.0472C3.70898 96.7507 6.42881 109.212 12.297 121.674V161.977C12.297 165.224 14.9343 167.845 18.1651 167.845C21.3959 167.845 24.0333 165.224 24.0333 161.977V140.861C26.1596 143.631 28.4508 146.383 30.9069 149.12L54.907 175.791V224.747C54.907 227.995 57.5279 230.616 60.7751 230.616C64.0224 230.616 66.6433 227.995 66.6433 224.747V188.846L112.6 239.978L133.204 217.082V261.704C133.204 264.935 135.858 267.572 139.089 267.572C142.319 267.572 144.973 264.951 144.973 261.704V204.027L175.369 170.153V212.418C175.369 215.648 177.99 218.286 181.237 218.286C184.484 218.286 187.105 215.665 187.105 212.418V157.098L194.259 149.136C213.248 128.317 221.474 105.487 221.474 85.0802C221.474 50.2499 200.704 27.0408 169.171 27.0408" fill="#E4032C"/>
                  </svg>
                </div>
                <h3 className="font-neutra-demi text-2xl mb-2 uppercase text-[#E4032C]">¡Gracias!</h3>
                <p className="text-gray-600 mb-6">
                  Tu voto por <strong>{hotelName}</strong> ha sido registrado.
                </p>
                <button
                  onClick={closeModal}
                  className="px-8 py-2 bg-[#E4032C] text-white rounded hover:bg-[#c00224] transition-colors font-medium"
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
