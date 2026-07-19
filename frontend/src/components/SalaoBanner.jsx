import React, { useState } from 'react';

const HERO_IMAGEM = '/images/estudio-valdo-santos-hero-crop.png';

export default function SalaoBanner() {
  const [erroImagem, setErroImagem] = useState(false);

  return (
    <section className="w-full overflow-hidden bg-black" aria-hidden="true">
      {!erroImagem ? (
        <img
          src={HERO_IMAGEM}
          alt="Foto do estúdio com identidade visual Valdo Santos"
          className="block w-full select-none object-cover object-center"
          onError={() => setErroImagem(true)}
        />
      ) : (
        <div className="flex h-[18rem] w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(214,170,89,0.14),transparent_30%),linear-gradient(180deg,#151515_0%,#090909_100%)] px-4 text-center">
          <p className="max-w-xl text-sm font-semibold text-slate-200 sm:text-base">
            A imagem hero não foi encontrada. Use <span className="text-amber-200">frontend/public/images/estudio-valdo-santos-hero-crop.png</span>.
          </p>
        </div>
      )}
    </section>
  );
}