import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard({ tipoSalao }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('mes');
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));

  const opcoesMes = [
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

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, [filtro, tipoSalao, anoSelecionado, mesSelecionado]);

  const carregarDados = async () => {
    try {
      let url = `/api/dashboard/dia?tipo_salao=${tipoSalao}`;

      if (filtro === 'mes') {
        url = `/api/dashboard/mes?tipo_salao=${tipoSalao}&ano=${anoSelecionado}&mes=${mesSelecionado}`;
      }

      if (filtro === 'anual') {
        url = `/api/dashboard/anual?tipo_salao=${tipoSalao}&ano=${anoSelecionado}`;
      }

      const { data } = await axios.get(url);
      setDashboard(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="animate-pulse text-xl text-amber-400">Carregando...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">Sem dados para exibir</p>
      </div>
    );
  }

  const isAnual = filtro === 'anual';

  const resumo = isAnual
    ? (dashboard.resumoAnual || { total: 0, agendamentos: 0 })
    : (dashboard.resumo || dashboard.total || { total: 0, agendamentos: 0 });

  const resumoFinanceiro = isAnual
    ? (dashboard.resumoFinanceiroAnual || {
        total_comissao_profissionais: 0,
        total_retencao_salao: 0,
        percentual_medio_comissao: 0,
      })
    : (dashboard.resumoFinanceiro || {
        total_comissao_profissionais: 0,
        total_retencao_salao: 0,
        percentual_medio_comissao: 0,
      });

  const mesesAnuais = dashboard.meses || [];
  const porProfissional = isAnual ? (dashboard.porProfissionalAnual || []) : (dashboard.porProfissional || []);

  const porServico = isAnual
    ? mesesAnuais
        .flatMap((mes) => mes.porServico || [])
        .reduce((acc, item) => {
          const existente = acc.find((s) => s.nome === item.nome);
          if (existente) {
            existente.total += Number(item.total || 0);
            existente.quantidade += Number(item.quantidade || 0);
          } else {
            acc.push({
              nome: item.nome,
              total: Number(item.total || 0),
              quantidade: Number(item.quantidade || 0),
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.total - a.total)
    : (dashboard.porServico || []);

  const totalGeral = Number(resumo.total || 0);
  const melhorProfissional = porProfissional[0];
  const maiorValorProfissional = melhorProfissional ? Number(melhorProfissional.valor_comissao || 0) : 0;

  const dadosGrafico = porProfissional.slice(0, 8).map((item) => ({
    nome: item.nome,
    valor: Number(item.valor_comissao || 0),
  }));

  const valorMaximoGrafico = dadosGrafico.length > 0
    ? Math.max(...dadosGrafico.map((item) => item.valor), 1)
    : 1;

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const tituloPeriodo = filtro === 'dia'
    ? 'Hoje'
    : (filtro === 'mes' ? 'Mês' : 'Ano');

  const tituloGrafico = filtro === 'dia'
    ? 'Top profissionais por comissão no dia'
    : (filtro === 'mes' ? 'Top profissionais por comissão no mês' : 'Top profissionais por comissão no ano');

  const mesesComDados = mesesAnuais.filter((mes) => Number(mes.resumo?.agendamentos || 0) > 0);

  const resumoAnualMeses = mesesAnuais.reduce((acc, mes) => {
    acc.totalComissao += Number(mes.resumoFinanceiro?.total_comissao_profissionais || 0);
    acc.totalRetencao += Number(mes.resumoFinanceiro?.total_retencao_salao || 0);
    return acc;
  }, { totalComissao: 0, totalRetencao: 0 });

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ui-title text-lg md:text-xl">Painel de Performance</p>
            <p className="ui-muted text-sm">
              {tipoSalao === 'feminino' ? 'Visão do salão feminino' : 'Visão do salão masculino'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltro('dia')}
              className={`ui-button ${filtro === 'dia' ? 'ui-button-primary' : 'ui-button-ghost'}`}
            >
              Hoje
            </button>
            <button
              onClick={() => setFiltro('mes')}
              className={`ui-button ${filtro === 'mes' ? 'ui-button-primary' : 'ui-button-ghost'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setFiltro('anual')}
              className={`ui-button ${filtro === 'anual' ? 'ui-button-primary' : 'ui-button-ghost'}`}
            >
              Anual (12 meses)
            </button>

            <select
              className="ui-select min-w-[108px]"
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            >
              {[anoSelecionado - 1, anoSelecionado, anoSelecionado + 1].map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>

            {filtro === 'mes' && (
              <select
                className="ui-select min-w-[148px]"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
              >
                {opcoesMes.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>{mes.nome}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button className="ui-surface-gold min-w-0 rounded-xl p-6 text-left" type="button">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/85">Faturamento ({tituloPeriodo})</p>
          <p className="mt-3 text-[clamp(1.75rem,3vw,2.55rem)] font-extrabold leading-tight text-amber-100">
            {formatarMoeda(totalGeral)}
          </p>
        </button>

        <button className="ui-surface min-w-0 rounded-xl border-cyan-300/20 p-6 text-left" type="button">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/85">Agendamentos</p>
          <p className="mt-3 text-[clamp(1.75rem,3vw,2.55rem)] font-extrabold leading-tight text-cyan-200">
            {resumo.agendamentos || 0}
          </p>
        </button>

        <button className="ui-surface min-w-0 rounded-xl border-emerald-300/25 p-6 text-left" type="button">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/85">Comissão a Pagar</p>
          <p className="mt-3 text-[clamp(1.55rem,2.7vw,2.2rem)] font-extrabold leading-tight text-emerald-200">
            {formatarMoeda(resumoFinanceiro.total_comissao_profissionais)}
          </p>
        </button>

        <button className="ui-surface min-w-0 rounded-xl border-violet-300/25 p-6 text-left" type="button">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-100/85">Retenção do Salão</p>
          <p className="mt-3 text-[clamp(1.55rem,2.7vw,2.2rem)] font-extrabold leading-tight text-violet-200">
            {formatarMoeda(resumoFinanceiro.total_retencao_salao)}
          </p>
        </button>
      </div>

      <div className="ui-surface rounded-xl p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl">Gráfico Vertical de Comissão</h2>
            <p className="ui-muted text-sm">{tituloGrafico}</p>
          </div>
        </div>

        {dadosGrafico.length > 0 ? (
          <div className="rounded-xl border border-slate-200/10 bg-slate-950/45 p-4">
            <div className="h-72 overflow-x-auto">
              <div className="flex h-full min-w-max items-end gap-3">
                {dadosGrafico.map((item, idx) => {
                  const altura = Math.max((item.valor / valorMaximoGrafico) * 100, 6);

                  return (
                    <div key={`${item.nome}-${idx}`} className="flex w-24 flex-col items-center gap-2">
                      <p className="text-xs font-semibold text-cyan-100">{formatarMoeda(item.valor)}</p>
                      <div className="flex h-52 w-full items-end rounded-lg bg-slate-800/85 p-1">
                        <div
                          className="w-full rounded-md bg-gradient-to-t from-cyan-500 via-blue-500 to-indigo-400 transition-all duration-700"
                          style={{ height: `${altura}%` }}
                        />
                      </div>
                      <p className="w-full truncate text-center text-xs font-semibold text-slate-200" title={item.nome}>
                        {item.nome}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-slate-400">Sem dados para exibir no gráfico.</p>
        )}
      </div>

      <div className="ui-surface rounded-xl p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl">Pagamento de Comissão por Profissional</h2>
            <p className="ui-muted text-sm">Fechamento automático com comissão do profissional e retenção do salão</p>
          </div>

          <div className="rounded-xl border border-emerald-200/25 bg-emerald-200/10 px-4 py-2 text-sm text-emerald-100">
            Comissão média aplicada: {Number(resumoFinanceiro.percentual_medio_comissao || 0).toFixed(1)}%
          </div>
        </div>

        {porProfissional.length > 0 ? (
          <div className="space-y-3">
            {porProfissional.map((item, idx) => {
              const valor = Number(item.total || 0);
              const valorComissao = Number(item.valor_comissao || 0);
              const valorRetencaoSalao = Number(item.valor_retencao_salao || 0);
              const percentualTop = maiorValorProfissional > 0 ? (valorComissao / maiorValorProfissional) * 100 : 0;
              const participacao = Number(resumoFinanceiro.total_comissao_profissionais || 0) > 0
                ? (valorComissao / Number(resumoFinanceiro.total_comissao_profissionais || 0)) * 100
                : 0;

              return (
                <div key={`${item.nome}-${idx}`} className="rounded-xl border border-slate-200/10 bg-slate-900/55 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">{idx + 1}. {item.nome}</p>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-200">Comissão: {formatarMoeda(valorComissao)}</p>
                      <p className="text-xs text-slate-300">Bruto: {formatarMoeda(valor)}</p>
                      <p className="text-xs text-violet-300">Retenção salão: {formatarMoeda(valorRetencaoSalao)}</p>
                      <p className="text-xs text-slate-400">{item.agendamentos} atendimentos • {Number(item.percentual_comissao || 0).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-700/70">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 transition-all duration-700"
                      style={{ width: `${Math.max(percentualTop, 4)}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-300/80">
                    Participação na comissão total: {participacao.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-slate-400">Sem faturamento por profissional neste periodo.</p>
        )}
      </div>

      {isAnual && (
        <div className="ui-surface rounded-xl p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="ui-title text-xl">Controle dos 12 Meses</h2>
              <p className="ui-muted text-sm">Visão completa do ano com todos os meses, inclusive sem movimento</p>
            </div>
            <div className="text-right text-sm text-slate-300">
              <p>Comissão anual (soma dos meses): <span className="font-bold text-emerald-200">{formatarMoeda(resumoAnualMeses.totalComissao)}</span></p>
              <p>Retenção anual (soma dos meses): <span className="font-bold text-violet-200">{formatarMoeda(resumoAnualMeses.totalRetencao)}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mesesAnuais.map((mes) => (
              <div key={mes.mes_numero} className="rounded-xl border border-slate-200/10 bg-slate-900/55 p-4">
                <p className="font-semibold text-amber-100">{mes.mes_nome}</p>
                <p className="mt-1 text-sm text-slate-300">Faturamento: <span className="font-bold text-amber-200">{formatarMoeda(mes.resumo?.total)}</span></p>
                <p className="text-sm text-slate-300">Agendamentos: <span className="font-bold text-cyan-200">{mes.resumo?.agendamentos || 0}</span></p>
                <p className="text-sm text-slate-300">Comissão: <span className="font-bold text-emerald-200">{formatarMoeda(mes.resumoFinanceiro?.total_comissao_profissionais)}</span></p>
                <p className="text-sm text-slate-300">Retenção: <span className="font-bold text-violet-200">{formatarMoeda(mes.resumoFinanceiro?.total_retencao_salao)}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="ui-surface rounded-xl p-5 md:p-6">
          <h2 className="ui-title mb-4 text-xl">Faturamento por Serviço</h2>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {porServico.length > 0 ? (
              porServico.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-amber-200/12 bg-slate-900/55 p-4 transition hover:bg-slate-900/80">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">{item.nome}</p>
                    <p className="text-xl font-bold text-amber-200">{formatarMoeda(item.total)}</p>
                  </div>
                  <p className="text-sm text-slate-400">{item.quantidade} {item.quantidade === 1 ? 'serviço' : 'serviços'}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-400">Sem dados</p>
            )}
          </div>
        </div>

        <div className="ui-surface rounded-xl p-5 md:p-6">
          <h2 className="ui-title mb-4 text-xl">Faturamento por Profissional</h2>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {porProfissional.length > 0 ? (
              porProfissional.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200/10 bg-slate-900/55 p-4 transition hover:bg-slate-900/80">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">{item.nome}</p>
                    <p className="text-xl font-bold text-cyan-200">{formatarMoeda(item.total)}</p>
                  </div>
                  <p className="text-sm text-slate-400">{item.agendamentos} {item.agendamentos === 1 ? 'atendimento' : 'atendimentos'}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-400">Sem dados</p>
            )}
          </div>
        </div>
      </div>

      {isAnual && (
        <div className="ui-surface rounded-xl p-5 md:p-6">
          <h2 className="ui-title mb-4 text-xl">O Que Foi Feito no Ano</h2>
          <p className="ui-muted mb-4 text-sm">Detalhamento mensal por profissional e serviços executados</p>

          {mesesComDados.length > 0 ? (
            <div className="space-y-4">
              {mesesComDados.map((mes) => (
                <div key={mes.mes_numero} className="rounded-xl border border-slate-200/10 bg-slate-900/50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/10 pb-3">
                    <p className="font-semibold text-amber-100">{mes.mes_nome}</p>
                    <p className="text-sm text-slate-300">{mes.resumo?.agendamentos || 0} atendimentos • {formatarMoeda(mes.resumo?.total)}</p>
                  </div>

                  <div className="space-y-3">
                    {(mes.porProfissional || []).map((prof) => (
                      <div key={`${mes.mes_numero}-${prof.id}`} className="rounded-lg border border-slate-200/10 bg-slate-950/35 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-100">{prof.nome}</p>
                          <p className="text-sm text-emerald-200">Comissão: {formatarMoeda(prof.valor_comissao)}</p>
                        </div>
                        <p className="mb-2 text-xs text-slate-400">
                          Bruto: {formatarMoeda(prof.total)} • Retenção salão: {formatarMoeda(prof.valor_retencao_salao)} • {prof.agendamentos} atendimentos
                        </p>

                        {(prof.servicos_realizados || []).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {prof.servicos_realizados.map((servico, idx) => (
                              <span
                                key={`${prof.id}-${idx}`}
                                className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
                              >
                                {servico.nome}: {servico.quantidade}x ({formatarMoeda(servico.total)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Sem serviços detalhados neste mês.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400">Sem movimentação no ano selecionado.</p>
          )}
        </div>
      )}
    </div>
  );
}
