import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Estoque({ tipoSalao }) {
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState({ nome: '', categoria: 'uso_interno', quantidade: '', estoque_minimo: '', validade: '' });

  useEffect(() => {
    carregar();
  }, [tipoSalao]);

  const carregar = async () => {
    const { data } = await axios.get(`/api/estoque?tipo_salao=${tipoSalao}`);
    setItens(data);
  };

  const salvar = async (e) => {
    e.preventDefault();
    await axios.post('/api/estoque', { ...form, tipo_salao: tipoSalao });
    setForm({ nome: '', categoria: 'uso_interno', quantidade: '', estoque_minimo: '', validade: '' });
    carregar();
  };

  const mover = async (id, tipo) => {
    await axios.patch(`/api/estoque/${id}/movimento`, { tipo, quantidade: 1 });
    carregar();
  };

  const excluir = async (item) => {
    if (!window.confirm(`Excluir "${item.nome}"? Esta ação não pode ser desfeita.`)) return;
    await axios.delete(`/api/estoque/${item.id}`);
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <h2 className="ui-title text-xl md:text-2xl">Estoque</h2>
        <p className="ui-muted mt-1 text-sm">Controle de uso interno, venda, entradas, saídas e alerta de reposição</p>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Novo item</h3>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={salvar}>
          <input className="ui-input" placeholder="Nome do item" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <select className="ui-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            <option value="uso_interno">Uso no salão</option>
            <option value="venda">Produto para venda</option>
          </select>
          <input type="number" className="ui-input" placeholder="Quantidade" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
          <input type="number" className="ui-input" placeholder="Estoque mínimo" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })} />
          <input type="date" className="ui-input" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
          <button className="ui-button ui-button-primary md:col-span-2" type="submit">Salvar item</button>
        </form>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Itens cadastrados</h3>
        <div className="max-h-[420px] space-y-3 overflow-y-auto">
          {itens.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-300/15 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-100">{item.nome}</p>
                {Number(item.precisa_repor || 0) === 1 && <span className="text-xs rounded-full bg-red-500/20 px-2 py-1 text-red-200">Repor</span>}
              </div>
              <p className="text-sm text-slate-300">Qtd: {item.quantidade} | Min: {item.estoque_minimo} | Categoria: {item.categoria}</p>
              <div className="mt-2 flex gap-2">
                <button className="ui-button ui-button-ghost" onClick={() => mover(item.id, 'entrada')}>+ Entrada</button>
                <button className="ui-button ui-button-ghost" onClick={() => mover(item.id, 'saida')}>- Saída</button>
                <button className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40" onClick={() => excluir(item)}>Excluir</button>
              </div>
            </div>
          ))}
          {itens.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum item cadastrado</p>}
        </div>
      </div>
    </div>
  );
}
