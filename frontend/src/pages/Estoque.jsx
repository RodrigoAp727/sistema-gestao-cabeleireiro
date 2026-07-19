import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { TIPO_SALAO_FIXO } from '../config/salao';
import Pagination from '../components/Pagination';

const ESTOQUE_POR_PAGINA = 20;

export default function Estoque() {
  const [itens, setItens] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [servicoVinculoId, setServicoVinculoId] = useState('');
  const [vinculoForm, setVinculoForm] = useState({ estoque_item_id: '', quantidade_consumo: '' });
  const [form, setForm] = useState({ nome: '', categoria: 'uso_interno', quantidade: '', estoque_minimo: '', validade: '' });
  const [mensagemVinculos, setMensagemVinculos] = useState('');
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [paginaItens, setPaginaItens] = useState(1);
  const [totalItens, setTotalItens] = useState(0);

  useEffect(() => {
    if (!mensagemVinculos) return undefined;

    const timer = setTimeout(() => setMensagemVinculos(''), 3000);
    return () => clearTimeout(timer);
  }, [mensagemVinculos]);

  useEffect(() => {
    carregar(1);
  }, []);

  const carregar = async (pagina = paginaItens) => {
    try {
      setErroCarregamento('');
      const [resItens, resServicos, resVinculos] = await Promise.all([
        axios.get(`/api/estoque?tipo_salao=${TIPO_SALAO_FIXO}&page=${pagina}&limit=${ESTOQUE_POR_PAGINA}`),
        axios.get(`/api/servicos?tipo_salao=${TIPO_SALAO_FIXO}`),
        axios.get(`/api/estoque/insumos?tipo_salao=${TIPO_SALAO_FIXO}`),
      ]);
      const payloadItens = resItens.data;
      const itensNormalizados = Array.isArray(payloadItens) ? payloadItens : (payloadItens?.items || []);
      setItens(itensNormalizados);
      setTotalItens(Array.isArray(payloadItens) ? itensNormalizados.length : Number(payloadItens?.total || itensNormalizados.length));
      setPaginaItens(Array.isArray(payloadItens) ? pagina : Number(payloadItens?.page || pagina));
      setServicos(resServicos.data || []);
      setVinculos(resVinculos.data || []);
    } catch (err) {
      setErroCarregamento(err?.response?.data?.error || 'Não foi possível carregar o estoque no momento.');
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/estoque', { ...form, tipo_salao: TIPO_SALAO_FIXO });
      setForm({ nome: '', categoria: 'uso_interno', quantidade: '', estoque_minimo: '', validade: '' });
      carregar(paginaItens);
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao salvar item');
    }
  };

  const mover = async (id, tipo) => {
    try {
      await axios.patch(`/api/estoque/${id}/movimento`, { tipo, quantidade: 1 });
      carregar(paginaItens);
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao registrar movimento');
    }
  };

  const excluir = async (item) => {
    if (!window.confirm(`Excluir "${item.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`/api/estoque/${item.id}`);
      carregar(paginaItens);
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao excluir item');
    }
  };

  const vinculosDoServico = useMemo(() => (
    servicoVinculoId
      ? vinculos.filter((v) => Number(v.servico_id) === Number(servicoVinculoId))
      : []
  ), [vinculos, servicoVinculoId]);

  const adicionarVinculo = () => {
    const estoqueId = Number(vinculoForm.estoque_item_id || 0);
    const quantidade = Number(vinculoForm.quantidade_consumo || 0);
    if (!estoqueId || quantidade <= 0) {
      alert('Selecione item de estoque e quantidade de consumo maior que zero.');
      return;
    }

    const jaExiste = vinculosDoServico.some((v) => Number(v.estoque_item_id) === estoqueId);
    if (jaExiste) {
      alert('Esse item de estoque ja esta vinculado ao servico.');
      return;
    }

    const item = itens.find((it) => Number(it.id) === estoqueId);
    setVinculos((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        servico_id: Number(servicoVinculoId),
        servico_nome: servicos.find((s) => Number(s.id) === Number(servicoVinculoId))?.nome || '',
        estoque_item_id: estoqueId,
        estoque_nome: item?.nome || '',
        quantidade_consumo: quantidade,
        estoque_atual: Number(item?.quantidade || 0),
      },
    ]);

    setVinculoForm({ estoque_item_id: '', quantidade_consumo: '' });
  };

  const removerVinculo = (estoqueItemId) => {
    setVinculos((prev) => prev.filter(
      (v) => !(Number(v.servico_id) === Number(servicoVinculoId) && Number(v.estoque_item_id) === Number(estoqueItemId))
    ));
  };

  const salvarVinculos = async () => {
    if (!servicoVinculoId) {
      alert('Selecione um servico para salvar os vinculos.');
      return;
    }

    try {
      const payload = vinculos
        .filter((v) => Number(v.servico_id) === Number(servicoVinculoId))
        .map((v) => ({
          estoque_item_id: Number(v.estoque_item_id),
          quantidade_consumo: Number(v.quantidade_consumo),
        }));

      await axios.put(`/api/estoque/insumos/servico/${servicoVinculoId}`, {
        tipo_salao: TIPO_SALAO_FIXO,
        insumos: payload,
      });

      setMensagemVinculos('Vínculos salvos com sucesso para o serviço selecionado.');
      carregar();
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao salvar vinculos');
    }
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
          {erroCarregamento ? (
            <p className="py-8 text-center text-slate-400">{erroCarregamento}</p>
          ) : itens.map((item) => (
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
          {!erroCarregamento && itens.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum item de estoque cadastrado ainda.</p>}
        </div>

        {!erroCarregamento && itens.length > 0 && (
          <Pagination
            page={paginaItens}
            totalPages={Math.max(1, Math.ceil(totalItens / ESTOQUE_POR_PAGINA))}
            totalItems={totalItens}
            pageSize={ESTOQUE_POR_PAGINA}
            itemLabel="itens"
            onPageChange={(proximaPagina) => {
              const paginaNormalizada = Math.max(proximaPagina, 1);
              setPaginaItens(paginaNormalizada);
              carregar(paginaNormalizada);
            }}
          />
        )}
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Consumo por serviço</h3>
        <p className="ui-muted mb-4 text-sm">Defina quais insumos serão baixados automaticamente ao criar uma comanda.</p>

        {mensagemVinculos && (
          <div className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
            {mensagemVinculos}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            className="ui-select"
            value={servicoVinculoId}
            onChange={(e) => setServicoVinculoId(e.target.value)}
          >
            <option value="">Selecione um serviço</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>{servico.nome}</option>
            ))}
          </select>

          <select
            className="ui-select"
            value={vinculoForm.estoque_item_id}
            onChange={(e) => setVinculoForm((prev) => ({ ...prev, estoque_item_id: e.target.value }))}
          >
            <option value="">Item de estoque</option>
            {itens.map((item) => (
              <option key={item.id} value={item.id}>{item.nome} (atual: {item.quantidade})</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              className="ui-input"
              placeholder="Qtd consumida"
              value={vinculoForm.quantidade_consumo}
              onChange={(e) => setVinculoForm((prev) => ({ ...prev, quantidade_consumo: e.target.value }))}
            />
            <button type="button" className="ui-button ui-button-ghost" onClick={adicionarVinculo}>Adicionar</button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {vinculosDoServico.map((v) => (
            <div key={`${v.servico_id}-${v.estoque_item_id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-300/15 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-200">
                {v.estoque_nome} • Consumo: {Number(v.quantidade_consumo)} • Estoque atual: {Number(v.estoque_atual || 0)}
              </p>
              <button type="button" className="ui-button py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40" onClick={() => removerVinculo(v.estoque_item_id)}>
                Remover
              </button>
            </div>
          ))}
          {servicoVinculoId && vinculosDoServico.length === 0 && (
            <p className="text-sm text-slate-400">Nenhum insumo vinculado para este serviço.</p>
          )}
        </div>

        <div className="mt-4">
          <button type="button" className="ui-button ui-button-primary" onClick={salvarVinculos}>Salvar vínculos do serviço</button>
        </div>
      </div>
    </div>
  );
}
