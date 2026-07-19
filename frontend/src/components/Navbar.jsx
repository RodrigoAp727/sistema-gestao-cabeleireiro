import React from 'react';
import { obterTabsPermitidas } from '../config/navigation';

const ICONES = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="11" width="3.5" height="9" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="10.25" y="7" width="3.5" height="13" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16.5" y="4" width="3.5" height="16" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  agenda: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 3.5V7M16.5 3.5V7M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  precos: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5L12.5 5H19V11.5L11.5 19 5 12.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="16.2" cy="7.9" r="1.3" fill="currentColor" />
    </svg>
  ),
  clientes: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.2a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12.2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19.5c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  operacao: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.5 8.5h13a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5V10a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 11h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 15.25h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  comissoes: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.5l1.9 3.85 4.25.62-3.07 2.99.73 4.23L12 14.7l-3.81 2.49.73-4.23-3.07-2.99 4.25-.62L12 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  equipe: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM16.5 11.5a2.25 2.25 0 1 0-2.25-2.25 2.25 2.25 0 0 0 2.25 2.25Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 19.5c.8-2.9 2.9-4.5 4.5-4.5s3.7 1.6 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13.5 19.5c.4-1.8 1.8-3 3-3s2.6 1.2 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  estoque: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 9.5 12 5l7.5 4.5v9L12 23l-7.5-4.5v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 13.5v9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 8.5 12 11l5-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  relatorios: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 16V12M12 16V8.5M16.5 16V5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  whatsapp: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.5a7.5 7.5 0 0 0-6.6 11.1L4.5 19.5l3.95-.84A7.5 7.5 0 1 0 12 4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.5 9.6c.2 2 1.8 4 3.8 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  usuarios: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const PERFIS_LABEL = {
  administrador: 'Administrador',
  recepcao: 'Recepção',
  profissional: 'Profissional',
};

export default function Navbar({ pagina, setPagina, perfil, usuario, onLogout }) {
  const tabs = obterTabsPermitidas(perfil, usuario);

  const renderMenuButton = (tab) => {
    const active = pagina === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => setPagina(tab.id)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[0.86rem] font-semibold transition-all ${
          active
            ? 'border-amber-200/25 bg-white/10 text-amber-100 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
            : 'border-transparent text-slate-100 hover:border-white/10 hover:bg-white/5 hover:text-amber-100'
        }`}
      >
        <span className="text-amber-300">{ICONES[tab.id] ?? ICONES.dashboard}</span>
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <nav className="relative z-40 w-full overflow-x-hidden px-2 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto w-full max-w-[1440px] overflow-hidden rounded-[30px] border border-amber-100/20 bg-[linear-gradient(180deg,rgba(28,28,29,0.98)_0%,rgba(14,14,16,0.98)_58%,rgba(10,10,12,0.98)_100%)] px-3 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:px-4 sm:py-4 lg:px-5">
        <div className="rounded-[24px] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/images/vs-logo-icon.png"
                alt="Logo VS"
                className="h-[58px] w-auto shrink-0 object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)] sm:h-[66px] lg:h-[70px]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/90 sm:text-[0.74rem]">
                  GESTÃO PROFISSIONAL · SALÃO FEMININO
                </p>
              </div>
            </div>

            <div className="text-left lg:text-right">
              <h1 className="font-display text-[clamp(1.85rem,4vw,3.45rem)] font-bold uppercase leading-none tracking-[0.1em] text-transparent">
                <span className="bg-gradient-to-b from-[#fbe9ba] via-[#d2ad5a] to-[#855d1e] bg-clip-text drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
                  ESTUDIO VALDO SANTOS
                </span>
              </h1>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto">
              <div className="inline-flex max-w-full items-center rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(26,34,49,0.98),rgba(13,18,28,0.98))] px-3 py-2 text-sm font-semibold text-slate-100 shadow-[0_10px_24px_rgba(0,0,0,0.3)] ring-1 ring-amber-100/5">
                <span className="truncate">
                  {usuario?.nome || usuario?.login || 'Usuário'} · {PERFIS_LABEL[perfil] || 'Administrador'}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-200/30 hover:text-amber-100"
              >
                Sair
              </button>
            </div>

            <div className="flex w-full flex-wrap items-center gap-1.5 xl:w-auto xl:justify-end">
              {tabs.map((tab) => renderMenuButton(tab))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
