import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NOME_SALAO_FIXO_MINUSCULO, TIPO_SALAO_FIXO } from '../config/salao';

const formVazio = {
  nome: '',
  preco: '',
  duracao_minutos: 30,
  comissao_tipo: 'percentual',
  comissao_valor: '',
  precisa_auxiliar: false,
  orientacoes_cliente: '',
};

export default function Precos() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ ...formVazio });
  useEffect(() => { carregarServicos(); }, []);

  const carregarServicos = async () => {
    try {
      setErroCarregamento('');
      const { data } = await axios.get(`/api/servicos?tipo_salao=${TIPO_SALAO_FIXO}`);
      setServicos(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      setErroCarregamento('Não foi possível carregar os serviços no momento.');
      setLoading(false);
    }
  };

  const iniciarEdicao = (s) => {
    setEditandoId(s.id);
    setShowForm(true);
    setForm({
      nome: s.nome || '',
      preco: s.preco || '',
      duracao_minutos: s.duracao_minutos || 30,
      comissao_tipo: s.comissao_tipo || 'percentual',
      comissao_valor: s.comissao_valor ?? '',
      precisa_auxiliar: Boolean(s.precisa_auxiliar),
      orientacoes_cliente: s.orientacoes_cliente || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const excluir = async (s) => {
    if (!window.confirm(`Excluir "${s.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`/api/servicos/${s.id}`);
      carregarServicos();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const cancelar = () => {
    setEditandoId(null);
    setShowForm(false);
    setForm({ ...formVazio });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      preco: parseFloat(form.preco),
      duracao_minutos: parseInt(form.duracao_minutos),
      comissao_valor: form.comissao_valor !== '' ? parseFloat(form.comissao_valor) : null,
      precisa_auxiliar: form.precisa_auxiliar ? 1 : 0,
      tipo_salao: TIPO_SALAO_FIXO,
    };
    try {
      if (editandoId) {
        await axios.put(`/api/servicos/${editandoId}`, payload);
      } else {
        await axios.post('/api/servicos', payload);
      }
      cancelar();
      carregarServicos();
    } catch (err) {
      alert('Erro ao salvar serviço: ' + err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-amber-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl md:text-2xl">Catálogo de Serviços</h2>
            <p className="ui-muted mt-1 text-sm">Serviços do {NOME_SALAO_FIXO_MINUSCULO}</p>
          </div>
          <button
            onClick={() => { if (showForm && !editandoId) { cancelar(); } else { cancelar(); setShowForm(true); } }}
            className={`ui-button ${showForm && !editandoId ? 'ui-button-ghost' : 'ui-button-primary'}`}
          >
            {showForm && !editandoId ? 'Cancelar' : '+ Novo serviço'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="ui-title text-lg">
              {editandoId ? `Editando: ${form.nome}` : 'Novo Serviço'}
            </h3>
            <button className="ui-button ui-button-ghost py-1 text-xs" onClick={cancelar}>Cancelar</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="ui-input md:col-span-2" placeholder="Nome do serviço *" required
              value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
              <input type="number" step="0.01" min="0" className="ui-input pl-9" placeholder="Preço *" required
                value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
            </div>
            <input type="number" min="5" className="ui-input" placeholder="Duração (minutos)"
              value={form.duracao_minutos} onChange={(e) => setForm({ ...form, duracao_minutos: e.target.value })} />

            <select className="ui-select" value={form.comissao_tipo}
              onChange={(e) => setForm({ ...form, comissao_tipo: e.target.value })}>
              <option value="percentual">Comissão em % do valor</option>
              <option value="fixo">Comissão valor fixo (R$)</option>
            </select>
            <input type="number" step="0.01" min="0" className="ui-input"
              placeholder={form.comissao_tipo === 'percentual' ? 'Comissão (ex: 35 para 35%)' : 'Comissão R$ fixo'}
              value={form.comissao_valor}
              onChange={(e) => setForm({ ...form, comissao_valor: e.target.value })} />

            <div className="flex items-center gap-3 rounded-xl border border-slate-300/15 bg-slate-900/40 px-4 py-3">
              <input type="checkbox" id="auxiliar" className="h-4 w-4 accent-amber-400"
                checked={form.precisa_auxiliar}
                onChange={(e) => setForm({ ...form, precisa_auxiliar: e.target.checked })} />
              <label htmlFor="auxiliar" className="cursor-pointer text-sm text-slate-300">
                Necessita de auxiliar
              </label>
            </div>

            <textarea className="ui-input md:col-span-2" rows={2}
              placeholder="Orientações para a cliente (opcional)"
              value={form.orientacoes_cliente}
              onChange={(e) => setForm({ ...form, orientacoes_cliente: e.target.value })} />

            <button className="ui-button ui-button-primary md:col-span-2 py-3" type="submit">
              {editandoId ? 'Salvar alterações' : 'Cadastrar serviço'}
            </button>
          </form>
        </div>
      )}

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="ui-title text-lg">Tabela de Preços ({servicos.length})</h3>
          {servicos.length > 0 && (
            <p className="text-sm text-slate-400">
              Preço médio:{' '}
              <span className="font-bold text-emerald-300">
                R$ {(servicos.reduce((a, b) => a + b.preco, 0) / servicos.length).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          {erroCarregamento && (
            <p className="py-6 text-center text-slate-400">{erroCarregamento}</p>
          )}
          {servicos.length === 0 && (
            <p className="py-8 text-center text-slate-400">Nenhum serviço cadastrado ainda.</p>
          )}
          {!erroCarregamento && servicos.map((s, idx) => {
            const comissaoLabel = s.comissao_valor != null
              ? (s.comissao_tipo === 'fixo'
                  ? `R$ ${Number(s.comissao_valor).toFixed(2)} fixo`
                  : `${s.comissao_valor}%`)
              : '—';
            return (
              <div key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300/10 bg-slate-900/45 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-100">{s.nome}</p>
                    <p className="text-xs text-slate-400">
                      {s.duracao_minutos} min
                      {s.comissao_valor != null ? ` · comissão ${comissaoLabel}` : ''}
                      {s.precisa_auxiliar ? ' · precisa auxiliar' : ''}
                    </p>
                    {s.orientacoes_cliente && (
                      <p className="mt-0.5 text-xs italic text-slate-500">{s.orientacoes_cliente}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-emerald-500/90 px-3 py-1.5 font-bold text-slate-950">
                    R$ {Number(s.preco).toFixed(2)}
                  </span>
                  <button onClick={() => iniciarEdicao(s)}
                    className="ui-button ui-button-ghost py-1.5 text-xs">
                    Editar
                  </button>
                  <button onClick={() => excluir(s)}
                    className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40">
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
