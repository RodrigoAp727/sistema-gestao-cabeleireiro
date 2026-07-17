import React from 'react';

export default function Navbar({ pagina, setPagina, tipoSalao, setTipoSalao, perfil, setPerfil }) {
  const todasTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'precos', label: 'Preços' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'operacao', label: 'Operação' },
    { id: 'comissoes', label: 'Comissões' },
    { id: 'equipe', label: 'Equipe' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'whatsapp', label: 'WhatsApp' },
  ];

  const tabs = todasTabs.filter((tab) => {
    if (perfil === 'administrador') return true;
    if (perfil === 'recepcao') return ['agenda', 'clientes', 'operacao', 'whatsapp', 'dashboard'].includes(tab.id);
    if (perfil === 'profissional') return ['agenda', 'dashboard', 'clientes', 'comissoes'].includes(tab.id);
    return true;
  });

  const renderTabIcon = (id) => {
    if (id === 'dashboard') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="3" y="10" width="4" height="11" rx="1" />
          <rect x="10" y="3" width="4" height="18" rx="1" />
          <rect x="17" y="7" width="4" height="14" rx="1" />
        </svg>
      );
    }

    if (id === 'agenda') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M7 3V7M17 3V7M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3L14.5 8.2L20 9.1L16 13L17 18.5L12 16L7 18.5L8 13L4 9.1L9.5 8.2L12 3Z" fill="currentColor" />
      </svg>
    );
  };

  return (
    <nav className="relative z-40 px-2 pt-3 md:px-4 md:pt-4">
      <div className="mx-auto w-full max-w-[1160px] rounded-[24px] border border-white/55 bg-gradient-to-r from-[#1d1f24]/95 via-[#272a2f]/95 to-[#23262c]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 pt-0.5">
            <img
              src="/images/logo-tesoura-profissional.png"
              alt="Tesoura profissional"
              className="h-[40px] w-[24px] object-contain"
            />

            <div>
              <p className="font-display text-[1.78rem] uppercase leading-none tracking-[0.01em] text-amber-200 md:text-[1.92rem]">Estúdio Valdo Santos</p>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.24em] text-slate-300/90 md:text-[0.74rem]">Gestão Profissional</p>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          <select
            className="ui-select max-w-[170px]"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
          >
            <option value="administrador">Administrador</option>
            <option value="recepcao">Recepção</option>
            <option value="profissional">Profissional</option>
          </select>

          {/* Seletor de Salão */}
          <div className="flex gap-1">
            <button
              onClick={() => setTipoSalao('masculino')}
              className={`ui-button whitespace-nowrap px-3 py-1.5 text-sm transition-all ${
                tipoSalao === 'masculino' ? 'ui-button-primary' : 'ui-button-ghost'
              }`}
            >
              👨‍💼 Masculino
            </button>
            <button
              onClick={() => setTipoSalao('feminino')}
              className={`ui-button whitespace-nowrap px-3 py-1.5 text-sm transition-all ${
                tipoSalao === 'feminino' ? 'ui-button-primary' : 'ui-button-ghost'
              }`}
            >
              👩‍🦰 Feminino
            </button>
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPagina(tab.id)}
              className={`flex items-center rounded-md whitespace-nowrap px-2.5 py-1.5 text-[0.95rem] font-semibold transition-all ${
                pagina === tab.id
                  ? 'text-amber-200'
                  : 'text-slate-200/95 hover:text-amber-100'
              }`}
            >
              <span className="mr-1.5 text-amber-200/90">{renderTabIcon(tab.id)}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
