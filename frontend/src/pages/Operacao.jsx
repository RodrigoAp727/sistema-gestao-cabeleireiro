import React, { useEffect, useState } from 'react';
import axios from 'axios';

const itemVazio = () => ({ tipo_item: 'servico', descricao: '', quantidade: 1, valor_unitario: '' });

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Operacao({ tipoSalao }) {
  const [comandas, setComandas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [caixa, setCaixa] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);
  const [pagamentoAberto, setPagamentoAberto] = useState(null); // id comanda
  const [formPgto, setFormPgto] = useState({ forma_pagamento: 'pix', valor: '' });
  const [formLancamento, setFormLancamento] = useState({ tipo: 'entrada', descricao: '', valor: '', vencimento: '' });

  const [formComanda, setFormComanda] = useState({
    cliente_id: '',
    cliente_nome: '',
    profissional_id: '',
    auxiliar_nome: '',
    desconto: '',
    sinal_pago: '',
  });
  const [itens, setItens] = useState([itemVazio()]);

  useEffect(() => { carregarDados(); }, [tipoSalao]);

  const carregarDados = async () => {
    try {
      const [resComandas, resClientes, resProfissionais, resCaixa, resServicos] = await Promise.all([
        axios.get(`/api/comandas?tipo_salao=${tipoSalao}`),
        axios.get(`/api/clientes?tipo_salao=${tipoSalao}`),
        axios.get(`/api/profissionais?tipo_salao=${tipoSalao}`),
        axios.get(`/api/caixa/resumo?tipo_salao=${tipoSalao}`),
        axios.get(`/api/servicos?tipo_salao=${tipoSalao}`),
      ]);
      const { data: dadosLancamentos } = await axios.get(`/api/caixa/lancamentos?tipo_salao=${tipoSalao}`);
      setComandas(resComandas.data);
      setClientes(resClientes.data);
      setProfissionais(resProfissionais.data);
      setCaixa(resCaixa.data);
      setServicos(resServicos.data);
      setLancamentos(dadosLancamentos);
    } catch (err) {
      console.error('Erro ao carregar operação:', err);
    }
  };

  // Subtotal dinâmico antes de enviar
  const subtotalItens = itens.reduce((acc, it) => {
    return acc + (Number(it.quantidade || 1) * Number(it.valor_unitario || 0));
  }, 0);
  const totalComanda = Math.max(subtotalItens - Number(formComanda.desconto || 0), 0);
  const restanteComanda = Math.max(totalComanda - Number(formComanda.sinal_pago || 0), 0);

  const atualizarItem = (idx, campo, valor) => {
    setItens((prev) => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it));
  };

  const adicionarItem = () => setItens((prev) => [...prev, itemVazio()]);
  const removerItem = (idx) => setItens((prev) => prev.filter((_, i) => i !== idx));

  const selecionarServico = (idx, servicoId) => {
    const s = servicos.find((sv) => sv.id === Number(servicoId));
    if (s) {
      atualizarItem(idx, 'descricao', s.nome);
      atualizarItem(idx, 'valor_unitario', s.preco);
    }
  };

  const criarComanda = async (e) => {
    e.preventDefault();
    if (itens.some((it) => !it.descricao || !it.valor_unitario)) {
      alert('Preencha a descrição e o valor de todos os itens.');
      return;
    }
    try {
      await axios.post('/api/comandas', {
        tipo_salao: tipoSalao,
        cliente_id: formComanda.cliente_id || null,
        cliente_nome: formComanda.cliente_nome,
        profissional_id: formComanda.profissional_id || null,
        auxiliar_nome: formComanda.auxiliar_nome || null,
        desconto: Number(formComanda.desconto || 0),
        sinal_pago: Number(formComanda.sinal_pago || 0),
        itens: itens.map((it) => ({
          tipo_item: it.tipo_item,
          descricao: it.descricao,
          quantidade: Number(it.quantidade || 1),
          valor_unitario: Number(it.valor_unitario || 0),
        })),
      });
      setFormComanda({ cliente_id: '', cliente_nome: '', profissional_id: '', auxiliar_nome: '', desconto: '', sinal_pago: '' });
      setItens([itemVazio()]);
      carregarDados();
    } catch (err) {
      alert(`Erro ao criar comanda: ${err.message}`);
    }
  };

  const registrarPagamento = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/comandas/${pagamentoAberto}/pagamentos`, {
        forma_pagamento: formPgto.forma_pagamento,
        valor: Number(formPgto.valor || 0),
      });
      setPagamentoAberto(null);
      setFormPgto({ forma_pagamento: 'pix', valor: '' });
      carregarDados();
    } catch (err) {
      alert(`Erro ao registrar pagamento: ${err.message}`);
    }
  };

  const salvarLancamento = async (e) => {
    e.preventDefault();
    await axios.post('/api/caixa/lancamentos', {
      ...formLancamento,
      valor: Number(formLancamento.valor || 0),
      tipo_salao: tipoSalao,
    });
    setFormLancamento({ tipo: 'entrada', descricao: '', valor: '', vencimento: '' });
    carregarDados();
  };

  const excluirComanda = async (comanda) => {
    if (!window.confirm(`Excluir comanda #${comanda.id} de ${comanda.cliente_nome}? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`/api/comandas/${comanda.id}`);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir comanda: ' + err.message);
    }
  };

  const excluirLancamento = async (item) => {
    if (!window.confirm(`Excluir lançamento "${item.descricao}"?`)) return;
    try {
      await axios.delete(`/api/caixa/lancamentos/${item.id}`);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <h2 className="ui-title text-xl md:text-2xl">Comandas, Pagamentos e Caixa</h2>
        <p className="ui-muted mt-1 text-sm">Atendimentos · múltiplos itens · formas de pagamento</p>
      </div>

      {/* Resumo caixa */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="ui-surface-gold rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Faturamento dia</p>
          <p className="mt-1 text-xl font-extrabold text-amber-100">{fmt(caixa?.faturamento_dia)}</p>
        </div>
        <div className="ui-surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Faturamento mês</p>
          <p className="mt-1 text-xl font-extrabold text-cyan-200">{fmt(caixa?.faturamento_mes)}</p>
        </div>
        <div className="ui-surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Recebido hoje</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-200">{fmt(caixa?.recebido_dia)}</p>
        </div>
        <div className="ui-surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-violet-100/80">Pendente</p>
          <p className="mt-1 text-xl font-extrabold text-violet-200">{fmt(caixa?.pendente)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="ui-surface rounded-xl p-3"><p className="text-xs text-slate-400">Entradas</p><p className="font-bold text-emerald-300">{fmt(caixa?.entradas)}</p></div>
        <div className="ui-surface rounded-xl p-3"><p className="text-xs text-slate-400">Saídas</p><p className="font-bold text-red-300">{fmt(caixa?.saidas)}</p></div>
        <div className="ui-surface rounded-xl p-3"><p className="text-xs text-slate-400">Despesas</p><p className="font-bold text-amber-300">{fmt(caixa?.despesas)}</p></div>
        <div className="ui-surface rounded-xl p-3"><p className="text-xs text-slate-400">Lucro estimado</p><p className="font-bold text-cyan-300">{fmt(caixa?.lucro_estimado)}</p></div>
      </div>

      {/* Nova comanda */}
      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-5 text-lg">Nova Comanda</h3>
        <form onSubmit={criarComanda} className="space-y-4">

          {/* Dados do atendimento */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select className="ui-select" value={formComanda.cliente_id}
              onChange={(e) => {
                const c = clientes.find((cl) => cl.id === Number(e.target.value));
                setFormComanda({ ...formComanda, cliente_id: e.target.value, cliente_nome: c ? c.nome : formComanda.cliente_nome });
              }}>
              <option value="">Selecionar cliente cadastrado</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input className="ui-input" placeholder="Nome do cliente *" required value={formComanda.cliente_nome}
              onChange={(e) => setFormComanda({ ...formComanda, cliente_nome: e.target.value })} />
            <select className="ui-select" value={formComanda.profissional_id}
              onChange={(e) => setFormComanda({ ...formComanda, profissional_id: e.target.value })}>
              <option value="">Profissional responsável</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input className="ui-input" placeholder="Auxiliar (opcional)" value={formComanda.auxiliar_nome}
              onChange={(e) => setFormComanda({ ...formComanda, auxiliar_nome: e.target.value })} />
          </div>

          {/* Itens da comanda */}
          <div className="rounded-xl border border-slate-300/15 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Serviços / Produtos</p>
              <button type="button" onClick={adicionarItem}
                className="ui-button ui-button-ghost py-1 text-xs">
                + Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {itens.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                    <div className="space-y-1">
                      <select className="ui-select w-full text-xs" defaultValue=""
                        onChange={(e) => selecionarServico(idx, e.target.value)}>
                        <option value="">Serviço cadastrado…</option>
                        {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                      <input className="ui-input w-full" placeholder="Descrição *" required value={item.descricao}
                        onChange={(e) => atualizarItem(idx, 'descricao', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <select className="ui-select w-full text-xs" value={item.tipo_item}
                        onChange={(e) => atualizarItem(idx, 'tipo_item', e.target.value)}>
                        <option value="servico">Serviço</option>
                        <option value="produto">Produto</option>
                        <option value="cronograma">Cronograma</option>
                      </select>
                      <input type="number" min="1" step="1" className="ui-input w-full" placeholder="Qtd" value={item.quantidade}
                        onChange={(e) => atualizarItem(idx, 'quantidade', e.target.value)} />
                    </div>
                    <input type="number" step="0.01" className="ui-input" placeholder="Valor unit. *" required value={item.valor_unitario}
                      onChange={(e) => atualizarItem(idx, 'valor_unitario', e.target.value)} />
                  </div>
                  <div className="text-right text-sm font-semibold text-amber-200 min-w-[80px]">
                    {fmt(Number(item.quantidade || 1) * Number(item.valor_unitario || 0))}
                  </div>
                  {itens.length > 1 && (
                    <button type="button" onClick={() => removerItem(idx)}
                      className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/40">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totais e pagamento */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input type="number" step="0.01" className="ui-input" placeholder="Desconto (R$)" value={formComanda.desconto}
              onChange={(e) => setFormComanda({ ...formComanda, desconto: e.target.value })} />
            <input type="number" step="0.01" className="ui-input" placeholder="Sinal / entrada paga" value={formComanda.sinal_pago}
              onChange={(e) => setFormComanda({ ...formComanda, sinal_pago: e.target.value })} />
            <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm">
              <p className="text-amber-100/70">Subtotal: <span className="font-semibold text-amber-100">{fmt(subtotalItens)}</span></p>
              <p className="text-amber-100/70">Total: <span className="font-bold text-amber-200">{fmt(totalComanda)}</span></p>
              <p className="text-amber-100/70">Restante: <span className="font-bold text-amber-300">{fmt(restanteComanda)}</span></p>
            </div>
          </div>

          <button className="ui-button ui-button-primary w-full py-3 text-base" type="submit">
            Abrir Comanda
          </button>
        </form>
      </div>

      {/* Comandas recentes */}
      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Comandas Recentes</h3>
        <div className="max-h-[480px] space-y-3 overflow-y-auto">
          {comandas.length === 0 && (
            <p className="py-8 text-center text-slate-400">Nenhuma comanda cadastrada</p>
          )}
          {comandas.map((comanda) => {
            const pagando = pagamentoAberto === comanda.id;
            return (
              <div key={comanda.id} className="rounded-xl border border-slate-300/15 bg-slate-900/50">
                <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-semibold text-slate-100">
                      #{comanda.id} · {comanda.cliente_nome}
                    </p>
                    <p className="text-xs text-slate-400">
                      {comanda.profissional_nome || '—'} ·{' '}
                      {new Date(comanda.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-right">
                    <div>
                      <p className="text-xs text-slate-400">Total</p>
                      <p className="font-bold text-amber-200">{fmt(comanda.valor_total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Restante</p>
                      <p className={`font-bold ${Number(comanda.valor_restante) > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                        {fmt(comanda.valor_restante)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      comanda.status === 'paga' ? 'bg-emerald-500/20 text-emerald-300' :
                      comanda.status === 'aberta' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-300'}`}>
                      {comanda.status}
                    </span>
                    {Number(comanda.valor_restante) > 0 && (
                      <button onClick={() => { setPagamentoAberto(pagando ? null : comanda.id); setFormPgto({ forma_pagamento: 'pix', valor: String(comanda.valor_restante) }); }}
                        className="ui-button ui-button-ghost py-1.5 text-sm">
                        {pagando ? 'Fechar' : 'Registrar pagamento'}
                      </button>
                    )}
                    <button onClick={() => excluirComanda(comanda)}
                      className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40">
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Form de pagamento inline */}
                {pagando && (
                  <form onSubmit={registrarPagamento}
                    className="border-t border-slate-300/10 bg-slate-950/40 px-4 pb-4 pt-3">
                    <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">Registrar pagamento</p>
                    <div className="flex flex-wrap gap-2">
                      <select className="ui-select flex-1" value={formPgto.forma_pagamento}
                        onChange={(e) => setFormPgto({ ...formPgto, forma_pagamento: e.target.value })}>
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="debito">Débito</option>
                        <option value="credito">Crédito</option>
                        <option value="dividido">Dividido</option>
                      </select>
                      <input type="number" step="0.01" className="ui-input flex-1" placeholder="Valor" required
                        value={formPgto.valor} onChange={(e) => setFormPgto({ ...formPgto, valor: e.target.value })} />
                      <button type="submit" className="ui-button ui-button-primary">Confirmar</button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lançamentos de caixa */}
      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Lançamentos de Caixa</h3>
        <form onSubmit={salvarLancamento} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <select className="ui-select" value={formLancamento.tipo}
            onChange={(e) => setFormLancamento({ ...formLancamento, tipo: e.target.value })}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="despesa">Despesa</option>
            <option value="conta_pagar">Conta a pagar</option>
          </select>
          <input className="ui-input" placeholder="Descrição *" required value={formLancamento.descricao}
            onChange={(e) => setFormLancamento({ ...formLancamento, descricao: e.target.value })} />
          <input type="number" step="0.01" className="ui-input" placeholder="Valor *" required value={formLancamento.valor}
            onChange={(e) => setFormLancamento({ ...formLancamento, valor: e.target.value })} />
          <input type="date" className="ui-input" value={formLancamento.vencimento}
            onChange={(e) => setFormLancamento({ ...formLancamento, vencimento: e.target.value })} />
          <button className="ui-button ui-button-primary sm:col-span-2 md:col-span-4" type="submit">
            Salvar lançamento
          </button>
        </form>
        <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
          {lancamentos.map((item) => (
            <div key={item.id}
              className={`flex items-center justify-between rounded-lg border border-slate-300/10 bg-slate-900/45 px-3 py-2 text-xs ${
                item.tipo === 'entrada' ? 'text-emerald-300' :
                item.tipo === 'saida' ? 'text-red-300' :
                item.tipo === 'despesa' ? 'text-amber-300' : 'text-violet-300'}`}>
              <span>{item.tipo} · {item.descricao}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{fmt(item.valor)}</span>
                <button onClick={() => excluirLancamento(item)}
                  className="rounded px-1.5 py-0.5 text-[11px] bg-red-500/20 text-red-400 hover:bg-red-500/40">
                  ✕
                </button>
              </div>
            </div>
          ))}
          {lancamentos.length === 0 && <p className="py-4 text-center text-xs text-slate-500">Sem lançamentos</p>}
        </div>
      </div>
    </div>
  );
}
