import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { TIPO_SALAO_FIXO } from '../config/salao';

const MESES = [
  { valor: '01', nome: 'Janeiro' },
  { valor: '02', nome: 'Fevereiro' },
  { valor: '03', nome: 'Março' },
  { valor: '04', nome: 'Abril' },
  { valor: '05', nome: 'Maio' },
  { valor: '06', nome: 'Junho' },
  { valor: '07', nome: 'Julho' },
  { valor: '08', nome: 'Agosto' },
  { valor: '09', nome: 'Setembro' },
  { valor: '10', nome: 'Outubro' },
  { valor: '11', nome: 'Novembro' },
  { valor: '12', nome: 'Dezembro' },
];

const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Comissoes() {
  const hoje = new Date();
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, '0'));
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [expandido, setExpandido] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setErro('');
      const { data } = await axios.get(
        `/api/comissoes?tipo_salao=${TIPO_SALAO_FIXO}&mes=${mes}&ano=${ano}`
      );
      setDados(data);
    } catch (err) {
      console.error('Erro ao carregar comissões:', err);
      setErro('Não foi possível carregar as comissões neste momento.');
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const nomeMes = MESES.find((m) => m.valor === mes)?.nome || mes;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="ui-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl md:text-2xl">Comissões</h2>
            <p className="ui-muted mt-1 text-sm">
              Cálculo automático por profissional · {nomeMes} {ano}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="ui-select"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            >
              {MESES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.nome}
                </option>
              ))}
            </select>
            <select
              className="ui-select"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
            >
              {[2024, 2025, 2026, 2027].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-amber-400 animate-pulse">
          Calculando comissões…
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-xl border border-slate-300/10 bg-slate-900/40 px-4 py-6 text-center text-slate-300">
          {erro}
        </div>
      )}

      {!loading && !erro && !dados && (
        <div className="rounded-xl border border-slate-300/10 bg-slate-900/40 px-4 py-6 text-center text-slate-300">
          Nenhum dado de comissão disponível para este período.
        </div>
      )}

      {!loading && !erro && dados && (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="ui-surface-gold rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">
                Faturamento Total
              </p>
              <p className="mt-2 text-2xl font-extrabold text-amber-100">
                {fmt(dados.totais.total_faturado)}
              </p>
            </div>
            <div className="ui-surface rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                Total Comissões
              </p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-200">
                {fmt(dados.totais.total_comissoes)}
              </p>
            </div>
            <div className="ui-surface rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">
                Retenção Salão
              </p>
              <p className="mt-2 text-2xl font-extrabold text-cyan-200">
                {fmt(dados.totais.total_faturado - dados.totais.total_comissoes)}
              </p>
            </div>
            <div className="ui-surface rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-violet-100/80">
                Comandas
              </p>
              <p className="mt-2 text-2xl font-extrabold text-violet-200">
                {dados.totais.total_comandas}
              </p>
            </div>
          </div>

          {/* Lista por profissional */}
          <div className="ui-surface rounded-xl p-6 md:p-8">
            <h3 className="ui-title mb-5 text-lg">Comissão por Profissional</h3>

            {dados.profissionais.length === 0 && (
              <p className="py-8 text-center text-slate-400">
                Nenhuma comanda registrada neste período.
              </p>
            )}

            <div className="space-y-3">
              {dados.profissionais.map((p) => {
                const retencao = Number(p.total_faturado) - Number(p.comissao_calculada);
                const aberto = expandido === p.id;
                const pct = Number(p.comissao_percentual) || 0;

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-300/15 bg-slate-900/50 overflow-hidden"
                  >
                    {/* Linha principal */}
                    <button
                      className="w-full p-4 text-left"
                      onClick={() => setExpandido(aberto ? null : p.id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-900"
                            style={{ backgroundColor: corProf(p.nome) }}
                          >
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{p.nome}</p>
                            <p className="text-xs text-slate-400">
                              {p.cargo || 'Profissional'} · {p.total_comandas} comanda
                              {p.total_comandas !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-right">
                          <div>
                            <p className="text-xs text-slate-400">Faturado</p>
                            <p className="font-semibold text-slate-200">
                              {fmt(p.total_faturado)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">
                              Comissão ({pct}%)
                            </p>
                            <p className="font-bold text-emerald-300">
                              {fmt(p.comissao_calculada)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Retenção</p>
                            <p className="font-semibold text-amber-200">
                              {fmt(retencao)}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-slate-500">
                              {aberto ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      {Number(dados.totais.total_faturado) > 0 && (
                        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-700">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (Number(p.total_faturado) /
                                  Number(dados.totais.total_faturado)) *
                                  100
                              )}%`,
                              backgroundColor: corProf(p.nome),
                            }}
                          />
                        </div>
                      )}
                    </button>

                    {/* Detalhamento de itens */}
                    {aberto && (
                      <div className="border-t border-slate-300/10 bg-slate-950/40 px-4 pb-4 pt-3">
                        <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                          Serviços / Produtos realizados
                        </p>
                        {p.itens.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Sem itens registrados neste período.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {p.itens.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm"
                              >
                                <span className="text-slate-300">
                                  {item.descricao}
                                  <span className="ml-2 text-xs text-slate-500">
                                    ×{item.qtd}
                                  </span>
                                </span>
                                <span className="font-semibold text-amber-200">
                                  {fmt(item.total_item)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mini resumo financeiro */}
                        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-300/10 bg-slate-900/50 p-3 text-center text-xs">
                          <div>
                            <p className="text-slate-500">Bruto</p>
                            <p className="font-bold text-slate-200">
                              {fmt(p.total_faturado)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">
                              Comissão {pct}%
                            </p>
                            <p className="font-bold text-emerald-300">
                              {fmt(p.comissao_calculada)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Retém salão</p>
                            <p className="font-bold text-amber-200">
                              {fmt(retencao)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aviso comissão 0% */}
          {dados.profissionais.some((p) => !p.comissao_percentual) && (
            <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-200">
              ⚠️ Alguns profissionais estão com <strong>comissão 0%</strong>. Acesse{' '}
              <strong>Equipe</strong> para configurar o percentual de cada um.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function corProf(nome = '') {
  const paleta = [
    '#06b6d4', '#34d399', '#f59e0b', '#f472b6',
    '#818cf8', '#fb7185', '#a78bfa', '#2dd4bf',
  ];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash += nome.charCodeAt(i);
  return paleta[hash % paleta.length];
}
