import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MESES = [
  { valor: '01', nome: 'Janeiro' }, { valor: '02', nome: 'Fevereiro' },
  { valor: '03', nome: 'Março' },   { valor: '04', nome: 'Abril' },
  { valor: '05', nome: 'Maio' },    { valor: '06', nome: 'Junho' },
  { valor: '07', nome: 'Julho' },   { valor: '08', nome: 'Agosto' },
  { valor: '09', nome: 'Setembro' },{ valor: '10', nome: 'Outubro' },
  { valor: '11', nome: 'Novembro' },{ valor: '12', nome: 'Dezembro' },
];

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const diasSemRetorno = (dataStr) => {
  if (!dataStr) return null;
  const diff = (new Date() - new Date(dataStr)) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
};

export default function Relatorios({ tipoSalao }) {
  const hoje = new Date();
  const [dados, setDados] = useState(null);
  const [secao, setSecao] = useState('geral');
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, '0'));
  const [ano, setAno] = useState(String(hoje.getFullYear()));

  useEffect(() => { carregar(); }, [tipoSalao]);

  const carregar = async () => {
    const { data } = await axios.get(`/api/relatorios/basico?tipo_salao=${tipoSalao}`);
    setDados(data);
  };

  if (!dados) return <div className="py-12 text-center animate-pulse text-amber-400">Carregando relatórios…</div>;

  const secoes = [
    { id: 'geral', label: 'Geral' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'desempenho', label: 'Desempenho' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'estoque', label: 'Estoque' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="ui-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl md:text-2xl">Relatórios</h2>
            <p className="ui-muted mt-1 text-sm">Faturamento · desempenho · clientes · estoque</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="ui-select" value={mes} onChange={(e) => setMes(e.target.value)}>
              {MESES.map((m) => <option key={m.valor} value={m.valor}>{m.nome}</option>)}
            </select>
            <select className="ui-select" value={ano} onChange={(e) => setAno(e.target.value)}>
              {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button className="ui-button ui-button-ghost" onClick={carregar}>Atualizar</button>
          </div>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="ui-surface-gold rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Faturamento</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-100">{fmt(dados.faturamento)}</p>
        </div>
        <div className="ui-surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Comandas</p>
          <p className="mt-1 text-2xl font-extrabold text-cyan-200">{dados.comandas}</p>
        </div>
        <div className="ui-surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Clientes atendidos</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-200">{dados.clientes_atendidos}</p>
        </div>
        <div className="ui-surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-red-100/80">Cancelamentos</p>
          <p className="mt-1 text-2xl font-extrabold text-red-300">{dados.faltas_cancelamentos?.cancelamentos ?? 0}</p>
        </div>
      </div>

      {/* Abas de seção */}
      <div className="flex gap-1.5 overflow-x-auto">
        {secoes.map((s) => (
          <button key={s.id} onClick={() => setSecao(s.id)}
            className={`ui-button whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              secao === s.id ? 'ui-button-primary' : 'ui-button-ghost'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Geral */}
      {secao === 'geral' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="ui-surface rounded-xl p-6">
            <h3 className="ui-title mb-4 text-lg">Resumo financeiro</h3>
            <div className="space-y-3">
              <div className="flex justify-between rounded-lg bg-slate-900/40 px-4 py-3 text-sm">
                <span className="text-slate-300">Total faturado</span>
                <span className="font-bold text-amber-200">{fmt(dados.faturamento)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-900/40 px-4 py-3 text-sm">
                <span className="text-slate-300">Comandas abertas</span>
                <span className="font-bold text-cyan-200">{dados.comandas}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-900/40 px-4 py-3 text-sm">
                <span className="text-slate-300">Cancelamentos</span>
                <span className="font-bold text-red-300">{dados.faltas_cancelamentos?.cancelamentos ?? 0}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-900/40 px-4 py-3 text-sm">
                <span className="text-slate-300">Agendamentos pendentes</span>
                <span className="font-bold text-amber-300">{dados.faltas_cancelamentos?.pendentes ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="ui-surface rounded-xl p-6">
            <h3 className="ui-title mb-4 text-lg">Comissões por profissional</h3>
            <div className="space-y-2">
              {(dados.desempenho || []).map((item, idx) => {
                const comissaoPct = dados.comissoes?.find((c) => c.nome === item.nome)?.comissao_percentual || 0;
                const comissaoValor = Number(item.faturamento || 0) * (comissaoPct / 100);
                return (
                  <div key={idx} className="rounded-lg border border-slate-300/10 bg-slate-900/45 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.nome}</span>
                      <span className="font-bold text-emerald-300">{fmt(comissaoValor)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                      <span>{item.atendimentos} atend. · faturou {fmt(item.faturamento)}</span>
                      <span>{comissaoPct}% comissão</span>
                    </div>
                  </div>
                );
              })}
              {!dados.desempenho?.length && <p className="text-sm text-slate-500">Sem dados</p>}
            </div>
          </div>
        </div>
      )}

      {/* Serviços */}
      {secao === 'servicos' && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h3 className="ui-title mb-4 text-lg">Serviços mais realizados</h3>
          {dados.servicos_mais_vendidos?.length === 0 && (
            <p className="text-sm text-slate-500">Sem dados de serviços ainda.</p>
          )}
          <div className="space-y-2">
            {(dados.servicos_mais_vendidos || []).map((item, idx) => (
              <div key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-300/10 bg-slate-900/45 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200">{item.descricao}</span>
                </div>
                <div className="flex gap-4 text-right">
                  <span className="text-slate-400">{item.quantidade}×</span>
                  <span className="font-bold text-amber-200">{fmt(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desempenho */}
      {secao === 'desempenho' && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h3 className="ui-title mb-4 text-lg">Desempenho por profissional</h3>
          <div className="space-y-3">
            {(dados.desempenho || []).map((item, idx) => {
              const comissaoPct = dados.comissoes?.find((c) => c.nome === item.nome)?.comissao_percentual || 0;
              const comissaoValor = Number(item.faturamento || 0) * (comissaoPct / 100);
              const totalGeral = dados.desempenho.reduce((a, d) => a + Number(d.faturamento || 0), 0);
              const participacao = totalGeral > 0 ? ((Number(item.faturamento) / totalGeral) * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">{item.nome}</p>
                    <div className="flex gap-4 text-sm text-right">
                      <div><p className="text-xs text-slate-500">Atendimentos</p><p className="font-bold text-cyan-200">{item.atendimentos}</p></div>
                      <div><p className="text-xs text-slate-500">Faturado</p><p className="font-bold text-amber-200">{fmt(item.faturamento)}</p></div>
                      <div><p className="text-xs text-slate-500">Comissão</p><p className="font-bold text-emerald-300">{fmt(comissaoValor)}</p></div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700">
                    <div className="h-1.5 rounded-full bg-amber-400"
                      style={{ width: `${participacao}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500">{participacao}% do faturamento total</p>
                </div>
              );
            })}
            {!dados.desempenho?.length && <p className="text-sm text-slate-500">Sem dados de desempenho.</p>}
          </div>
        </div>
      )}

      {/* Clientes */}
      {secao === 'clientes' && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h3 className="ui-title mb-2 text-lg">Clientes sem retorno</h3>
          <p className="ui-muted mb-4 text-xs">Clientes com mais de 30 dias sem atendimento · do mais antigo para o mais recente</p>
          <div className="space-y-2">
            {(dados.clientes_sem_retorno || []).map((c, idx) => {
              const dias = diasSemRetorno(c.ultimo_atendimento);
              const cor = dias === null ? 'text-slate-500' : dias > 90 ? 'text-red-300' : dias > 60 ? 'text-amber-300' : 'text-emerald-300';
              return (
                <div key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-300/10 bg-slate-900/45 px-4 py-3 text-sm">
                  <span className="text-slate-200">{c.nome}</span>
                  <span className={`font-semibold ${cor}`}>
                    {dias === null ? 'Nunca atendida' : `${dias} dias atrás`}
                  </span>
                </div>
              );
            })}
            {!dados.clientes_sem_retorno?.length && (
              <p className="py-6 text-center text-sm text-slate-500">Todos os clientes retornaram recentemente.</p>
            )}
          </div>
        </div>
      )}

      {/* Estoque */}
      {secao === 'estoque' && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h3 className="ui-title mb-2 text-lg">Controle de estoque</h3>
          <p className="ui-muted mb-4 text-xs">Produtos com alerta de estoque baixo aparecem primeiro</p>
          <div className="space-y-2">
            {(dados.estoque || []).map((item, idx) => (
              <div key={idx}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                  item.alerta
                    ? 'border-red-400/30 bg-red-900/15'
                    : 'border-slate-300/10 bg-slate-900/45'}`}>
                <div className="flex items-center gap-2">
                  {item.alerta && <span className="text-red-400">⚠</span>}
                  <span className="text-slate-200">{item.nome}</span>
                </div>
                <div className="flex gap-4 text-right text-xs">
                  <span className={item.alerta ? 'font-bold text-red-300' : 'text-slate-300'}>
                    Qtd: {item.quantidade}
                  </span>
                  <span className="text-slate-500">Mín: {item.estoque_minimo}</span>
                </div>
              </div>
            ))}
            {!dados.estoque?.length && (
              <p className="py-6 text-center text-sm text-slate-500">Estoque não cadastrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
