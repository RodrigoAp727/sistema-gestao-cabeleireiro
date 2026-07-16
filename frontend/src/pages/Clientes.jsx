import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Clientes({ tipoSalao }) {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [fotoForm, setFotoForm] = useState({ tipo: 'antes', url: '', descricao: '' });
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    data_nascimento: '',
    observacoes_cabelo: '',
    alergias: '',
    historico_quimico: '',
    formulas_coloracao: '',
  });

  useEffect(() => {
    carregarClientes();
  }, [tipoSalao]);

  const carregarClientes = async (termo = '') => {
    try {
      const { data } = await axios.get(`/api/clientes?tipo_salao=${tipoSalao}&busca=${encodeURIComponent(termo)}`);
      setClientes(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setLoading(false);
    }
  };

  const salvarCliente = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/clientes', {
        ...form,
        tipo_salao: tipoSalao,
      });
      setForm({
        nome: '',
        telefone: '',
        whatsapp: '',
        data_nascimento: '',
        observacoes_cabelo: '',
        alergias: '',
        historico_quimico: '',
        formulas_coloracao: '',
      });
      carregarClientes(busca);
    } catch (err) {
      alert(`Erro ao salvar cliente: ${err.message}`);
    }
  };

  const excluirCliente = async (cliente) => {
    if (!window.confirm(`Excluir cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`/api/clientes/${cliente.id}`);
      carregarClientes(busca);
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const abrirDetalhe = async (cliente) => {
    setClienteSelecionado(cliente);
    const { data } = await axios.get(`/api/clientes/${cliente.id}/detalhe`);
    setDetalhe(data);
  };

  const salvarFoto = async (e) => {
    e.preventDefault();
    if (!clienteSelecionado) return;
    await axios.post(`/api/clientes/${clienteSelecionado.id}/fotos`, fotoForm);
    setFotoForm({ tipo: 'antes', url: '', descricao: '' });
    abrirDetalhe(clienteSelecionado);
  };

  if (loading) {
    return <div className="py-12 text-center text-amber-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <h2 className="ui-title text-xl md:text-2xl">Cadastro de Clientes</h2>
        <p className="ui-muted mt-1 text-sm">Histórico, observações técnicas e dados de contato no mesmo padrão do sistema</p>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Novo Cliente</h3>
        <form onSubmit={salvarCliente} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="ui-input" placeholder="Nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input className="ui-input" placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <input className="ui-input" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <input className="ui-input" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
          <textarea className="ui-input md:col-span-2" rows="2" placeholder="Observações sobre o cabelo" value={form.observacoes_cabelo} onChange={(e) => setForm({ ...form, observacoes_cabelo: e.target.value })} />
          <textarea className="ui-input" rows="2" placeholder="Alergias" value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} />
          <textarea className="ui-input" rows="2" placeholder="Histórico químico" value={form.historico_quimico} onChange={(e) => setForm({ ...form, historico_quimico: e.target.value })} />
          <textarea className="ui-input md:col-span-2" rows="2" placeholder="Fórmulas de coloração" value={form.formulas_coloracao} onChange={(e) => setForm({ ...form, formulas_coloracao: e.target.value })} />
          <button type="submit" className="ui-button ui-button-primary md:col-span-2">Salvar cliente</button>
        </form>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="ui-title text-lg">Clientes cadastrados</h3>
          <input
            className="ui-input max-w-xs"
            placeholder="Buscar por nome/telefone"
            value={busca}
            onChange={(e) => {
              const valor = e.target.value;
              setBusca(valor);
              carregarClientes(valor);
            }}
          />
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto">
          {clientes.length > 0 ? (
            clientes.map((cliente) => (
              <div key={cliente.id} className="flex items-start gap-2">
                <button className="flex-1 rounded-xl border border-slate-300/15 bg-slate-900/50 p-4 text-left" onClick={() => abrirDetalhe(cliente)}>
                  <p className="font-semibold text-slate-100">{cliente.nome}</p>
                  <p className="text-sm text-slate-300">Tel: {cliente.telefone || '-'} | WhatsApp: {cliente.whatsapp || '-'}</p>
                  <p className="text-xs text-slate-400 mt-1">Alergias: {cliente.alergias || 'Não informado'}</p>
                  <p className="text-xs text-slate-400">Histórico químico: {cliente.historico_quimico || 'Não informado'}</p>
                </button>
                <button
                  onClick={() => excluirCliente(cliente)}
                  className="mt-1 rounded-lg px-2 py-2 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 whitespace-nowrap">
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-slate-400">Nenhum cliente cadastrado</p>
          )}
        </div>
      </div>

      {clienteSelecionado && detalhe && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h3 className="ui-title mb-4 text-lg">Ficha de {clienteSelecionado.nome}</h3>
          <p className="text-sm text-slate-300 mb-2">Faltas: {detalhe.cliente.faltas} | Cancelamentos: {detalhe.cliente.cancelamentos}</p>
          <p className="text-sm text-slate-300 mb-4">Fórmulas: {detalhe.cliente.formulas_coloracao || 'Não informado'}</p>

          <form onSubmit={salvarFoto} className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
            <select className="ui-select" value={fotoForm.tipo} onChange={(e) => setFotoForm({ ...fotoForm, tipo: e.target.value })}>
              <option value="antes">Antes</option>
              <option value="depois">Depois</option>
            </select>
            <input className="ui-input" placeholder="URL da foto" value={fotoForm.url} onChange={(e) => setFotoForm({ ...fotoForm, url: e.target.value })} required />
            <input className="ui-input" placeholder="Descrição" value={fotoForm.descricao} onChange={(e) => setFotoForm({ ...fotoForm, descricao: e.target.value })} />
            <button className="ui-button ui-button-primary md:col-span-3" type="submit">Salvar foto</button>
          </form>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold text-slate-100">Histórico de atendimentos</h4>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {(detalhe.historico || []).map((h) => (
                  <div key={h.id} className="rounded-lg border border-slate-300/15 bg-slate-900/45 p-2 text-xs text-slate-300">
                    {new Date(h.data_hora).toLocaleString('pt-BR')} - {h.status} - R$ {Number(h.preco || 0).toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-slate-100">Serviços realizados</h4>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {(detalhe.servicos || []).map((s, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-300/15 bg-slate-900/45 p-2 text-xs text-slate-300">
                    {s.descricao} - {s.quantidade}x
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="mb-2 font-semibold text-slate-100">Antes e depois</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(detalhe.fotos || []).map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-300/15 bg-slate-900/45 p-2">
                  <img src={f.url} alt={f.tipo} className="h-24 w-full rounded object-cover" />
                  <p className="mt-1 text-[11px] text-slate-300">{f.tipo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
