import React, { useEffect, useMemo, useState } from 'react';

const configuracaoSalao = {
  feminino: {
    titulo: 'Salão Feminino',
    subtitulo: 'Cabeleireiros • Maquiagem • Estética',
    baseImagem: 'salao-feminino',
  },
  masculino: {
    titulo: 'Salão Masculino',
    subtitulo: 'Barbearia • Cuidado • Estilo',
    baseImagem: 'salao-masculino',
  },
};

const extensoesSuportadas = ['png', 'jpg', 'jpeg', 'webp'];

export default function SalaoBanner({ tipoSalao }) {
  const [erroImagem, setErroImagem] = useState(false);
  const [indiceExtensao, setIndiceExtensao] = useState(0);

  useEffect(() => {
    setErroImagem(false);
    setIndiceExtensao(0);
  }, [tipoSalao]);

  const dados = useMemo(() => {
    return configuracaoSalao[tipoSalao] || configuracaoSalao.masculino;
  }, [tipoSalao]);

  const caminhoImagem = `/images/${dados.baseImagem}.${extensoesSuportadas[indiceExtensao]}`;

  const tentarProximaExtensao = () => {
    if (indiceExtensao < extensoesSuportadas.length - 1) {
      setIndiceExtensao((anterior) => anterior + 1);
      return;
    }

    setErroImagem(true);
  };

  return (
    <section className="overflow-hidden rounded-0">
      <div className="relative">
        {!erroImagem && (
          <div className="flex w-full items-center justify-center bg-black">
            <img
              src={caminhoImagem}
              alt={dados.titulo}
              className="w-full h-[60vh] md:h-[70vh] object-cover"
              onError={tentarProximaExtensao}
            />
          </div>
        )}

        {erroImagem && (
          <div className="flex h-64 w-full items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 md:h-[22rem]">
            <p className="max-w-2xl px-4 text-center text-sm font-semibold text-slate-200 md:text-base">
              Imagem não encontrada. Coloque os arquivos salao-feminino e salao-masculino em
              /frontend/public/images (png, jpg, jpeg ou webp).
            </p>
          </div>
        )}


      </div>
    </section>
  );
}