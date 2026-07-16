import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Agenda({ tipoSalao }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [bloqueios, setBloqueios] = useState([]);
  const [listaEspera, setListaEspera] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visao, setVisao] = useState('dia');
  const [referencia, setReferencia] = useState(new Date().toISOString().slice(0, 10));
  const [profissionalFiltro, setProfissionalFiltro] = useState('');

  const [form, setForm] = useState({
    cliente_nome: '',
    profissional_id: '',
    servico_id: '',
    data_hora: '',
  });

  const [bloqueioForm, setBloqueioForm] = useState({
    profissional_id: '',
    inicio: '',
    fim: '',
    motivo: '',
  });

  const [esperaForm, setEsperaForm] = useState({
    cliente_nome: '',
    telefone: '',
    profissional_id: '',
    servico_id: '',
    observacao: '',
  });

  useEffect(() => {
    carregarDados();
  }, [tipoSalao, visao, referencia, profissionalFiltro]);

  const carregarDados = async () => {
    try {
      const [agenda, prof, serv] = await Promise.all([
        axios.get(`/api/agenda?tipo_salao=${tipoSalao}&visao=${visao}&referencia=${referencia}&profissional_id=${profissionalFiltro}`),
        axios.get(`/api/profissionais?tipo_salao=${tipoSalao}`),
        axios.get(`/api/servicos?tipo_salao=${tipoSalao}`),
      ]);

      const [resBloqueios, resEspera] = await Promise.all([
        axios.get(`/api/agenda/bloqueios?tipo_salao=${tipoSalao}`),
        axios.get(`/api/agenda/lista-espera?tipo_salao=${tipoSalao}`),
      ]);

      setAgendamentos(agenda.data);
      setProfissionais(prof.data);
      setServicos(serv.data);
      setBloqueios(resBloqueios.data);
      setListaEspera(resEspera.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/agenda', { ...form, tipo_salao: tipoSalao });
      setForm({ cliente_nome: '', profissional_id: '', servico_id: '', data_hora: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao agendar: ' + err.message);
    }
  };

  const handleCriarComanda = async (item) => {
    try {
      await axios.post('/api/comandas', {
        tipo_salao: tipoSalao,
        cliente_id: item.cliente_id || null,
        cliente_nome: item.cliente_nome,
        profissional_id: item.profissional_id,
        desconto: 0,
        sinal_pago: 0,
        itens: [{
          tipo_item: 'servico',
          descricao: item.servico_nome || 'Serviço',
          quantidade: 1,
          valor_unitario: Number(item.preco || 0),
        }],
      });
      alert(`Comanda criada para ${item.cliente_nome}! Acesse Operação para registrar o pagamento.`);
    } catch (err) {
      alert('Erro ao criar comanda: ' + err.message);
    }
  };

  const handleConfirmar = async (id) => {
    try {
      await axios.patch(`/api/agenda/${id}/confirmar`);
      carregarDados();
    } catch (err) {
      alert('Erro ao confirmar');
    }
  };

  const handleCancelar = async (id) => {
    try {
      await axios.patch(`/api/agenda/${id}/cancelar`);
      carregarDados();
    } catch (err) {
      alert('Erro ao cancelar');
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este agendamento permanentemente?')) return;
    try {
      await axios.delete(`/api/agenda/${id}`);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  const handleRemarcar = async (id) => {
    const novaData = window.prompt('Informe nova data/hora (YYYY-MM-DDTHH:mm)');
    if (!novaData) return;
    try {
      await axios.patch(`/api/agenda/${id}/remarcar`, { data_hora: novaData });
      carregarDados();
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao remarcar');
    }
  };

  const salvarBloqueio = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/agenda/bloqueios', { ...bloqueioForm, tipo_salao: tipoSalao });
      setBloqueioForm({ profissional_id: '', inicio: '', fim: '', motivo: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao bloquear horário');
    }
  };

  const salvarListaEspera = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/agenda/lista-espera', { ...esperaForm, tipo_salao: tipoSalao });
      setEsperaForm({ cliente_nome: '', telefone: '', profissional_id: '', servico_id: '', observacao: '' });
      carregarDados();
    } catch (err) {
      alert('Erro ao adicionar lista de espera');
    }
  };

  const handleExcluirBloqueio = async (id) => {
    if (!window.confirm('Excluir este bloqueio?')) return;
    try {
      await axios.delete(`/api/agenda/bloqueios/${id}`);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir bloqueio');
    }
  };

  const handleExcluirEspera = async (id) => {
    if (!window.confirm('Remover da lista de espera?')) return;
    try {
      await axios.delete(`/api/agenda/lista-espera/${id}`);
      carregarDados();
    } catch (err) {
      alert('Erro ao remover da lista');
    }
  };

  const corProfissional = (nome = '') => {
    const paleta = ['#06b6d4', '#34d399', '#f59e0b', '#f472b6', '#818cf8', '#fb7185'];
    let hash = 0;
    for (let i = 0; i < nome.length; i += 1) hash += nome.charCodeAt(i);
    return paleta[hash % paleta.length];
  };

  if (loading) {
    return <div className="text-center py-12 text-amber-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl md:text-2xl">Agenda</h2>
            <p className="ui-muted mt-1 text-sm">
              {tipoSalao === 'feminino'
                ? 'Planejamento e controle do salão feminino'
                : 'Planejamento e controle do salão masculino'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={`ui-button ${visao === 'dia' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={() => setVisao('dia')}>Dia</button>
            <button className={`ui-button ${visao === 'semana' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={() => setVisao('semana')}>Semana</button>
            <button className={`ui-button ${visao === 'mes' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={() => setVisao('mes')}>Mês</button>
            <input type="date" className="ui-input max-w-[180px]" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            <select className="ui-select max-w-[220px]" value={profissionalFiltro} onChange={(e) => setProfissionalFiltro(e.target.value)}>
              <option value="">Todos os profissionais</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h2 className="ui-title mb-6 text-xl md:text-2xl">Novo Agendamento</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do Cliente"
            value={form.cliente_nome}
            onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
            required
            className="ui-input"
          />

          <select
            value={form.profissional_id}
            onChange={(e) => setForm({ ...form, profissional_id: e.target.value })}
            required
            className="ui-select"
          >
            <option value="">Selecione o Profissional</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} - {p.especialidade}
              </option>
            ))}
          </select>

          <select
            value={form.servico_id}
            onChange={(e) => setForm({ ...form, servico_id: e.target.value })}
            required
            className="ui-select"
          >
            <option value="">Selecione o Serviço</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} - R$ {s.preco.toFixed(2)}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={form.data_hora}
            onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
            required
            className="ui-input"
          />

          <button
            type="submit"
            className="ui-button ui-button-primary md:col-span-2 py-3"
          >
            Agendar
          </button>
        </form>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h2 className="ui-title mb-6 text-xl md:text-2xl">Agendamentos</h2>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {agendamentos && agendamentos.length > 0 ? (
            agendamentos.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl p-4 ${
                  item.status === 'cancelado'
                    ? 'border border-red-400/40 bg-red-900/20'
                    : 'border border-slate-300/15 bg-slate-900/50'
                } transition hover:bg-slate-900/80`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm text-slate-400">Cliente</p>
                    <p className="font-semibold text-slate-100">{item.cliente_nome}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400">Profissional</p>
                    <p className="font-semibold text-slate-100">{item.profissional_nome}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">Serviço</p>
                    <p className="font-semibold text-amber-400">{item.servico_nome}</p>
                  </div>

                  <div className="flex gap-2">
                    {item.status === 'agendado' && (
                      <>
                        <button
                          onClick={() => handleConfirmar(item.id)}
                          className="ui-button flex-1 bg-emerald-500 py-1.5 text-sm text-slate-950"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleCancelar(item.id)}
                          className="ui-button flex-1 bg-red-500 py-1.5 text-sm text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleRemarcar(item.id)}
                          className="ui-button flex-1 bg-cyan-500 py-1.5 text-sm text-slate-950"
                        >
                          Remarcar
                        </button>
                        <button
                          onClick={() => handleExcluir(item.id)}
                          className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40">
                          Excluir
                        </button>
                      </>
                    )}
                    {item.status === 'confirmado' && (
                      <div className="flex gap-2">
                        <span className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950">
                          Confirmado
                        </span>
                        <button
                          onClick={() => handleCriarComanda(item)}
                          className="ui-button rounded-lg bg-amber-400/90 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-amber-300"
                        >
                          Criar comanda
                        </button>
                        <button
                          onClick={() => handleExcluir(item.id)}
                          className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40">
                          Excluir
                        </button>
                      </div>
                    )}
                    {item.status === 'cancelado' && (
                      <div className="flex gap-2 items-center">
                        <span className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                          Cancelado
                        </span>
                        <button
                          onClick={() => handleExcluir(item.id)}
                          className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40">
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-300/10 pt-3 text-sm">
                  <span className="text-slate-400">
                    {new Date(item.data_hora).toLocaleString('pt-BR')}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: corProfissional(item.profissional_nome) }}>
                    {item.profissional_nome}
                  </span>
                  <span className="text-green-400 font-semibold">
                    R$ {item.preco.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2">
                  <a
                    className="text-xs text-emerald-300 underline"
                    href={`https://wa.me/?text=${encodeURIComponent(`Olá ${item.cliente_nome}, lembrete do seu atendimento em ${new Date(item.data_hora).toLocaleString('pt-BR')}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar lembrete no WhatsApp
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">Nenhum agendamento encontrado</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h2 className="ui-title mb-4 text-xl">Bloqueio de Horários</h2>
          <form className="grid grid-cols-1 gap-3" onSubmit={salvarBloqueio}>
            <select className="ui-select" required value={bloqueioForm.profissional_id} onChange={(e) => setBloqueioForm({ ...bloqueioForm, profissional_id: e.target.value })}>
              <option value="">Profissional</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input className="ui-input" type="datetime-local" required value={bloqueioForm.inicio} onChange={(e) => setBloqueioForm({ ...bloqueioForm, inicio: e.target.value })} />
            <input className="ui-input" type="datetime-local" required value={bloqueioForm.fim} onChange={(e) => setBloqueioForm({ ...bloqueioForm, fim: e.target.value })} />
            <input className="ui-input" placeholder="Motivo" value={bloqueioForm.motivo} onChange={(e) => setBloqueioForm({ ...bloqueioForm, motivo: e.target.value })} />
            <button className="ui-button ui-button-primary" type="submit">Bloquear horário</button>
          </form>
          <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
            {bloqueios.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-300/15 bg-slate-900/45 p-2 text-xs text-slate-300">
                <span>{item.profissional_nome} - {new Date(item.inicio).toLocaleString('pt-BR')} até {new Date(item.fim).toLocaleString('pt-BR')}</span>
                <button onClick={() => handleExcluirBloqueio(item.id)}
                  className="ml-2 rounded px-1.5 py-0.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[11px]">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h2 className="ui-title mb-4 text-xl">Lista de Espera</h2>
          <form className="grid grid-cols-1 gap-3" onSubmit={salvarListaEspera}>
            <input className="ui-input" placeholder="Nome da cliente" required value={esperaForm.cliente_nome} onChange={(e) => setEsperaForm({ ...esperaForm, cliente_nome: e.target.value })} />
            <input className="ui-input" placeholder="Telefone" value={esperaForm.telefone} onChange={(e) => setEsperaForm({ ...esperaForm, telefone: e.target.value })} />
            <select className="ui-select" value={esperaForm.profissional_id} onChange={(e) => setEsperaForm({ ...esperaForm, profissional_id: e.target.value })}>
              <option value="">Profissional (opcional)</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select className="ui-select" value={esperaForm.servico_id} onChange={(e) => setEsperaForm({ ...esperaForm, servico_id: e.target.value })}>
              <option value="">Serviço (opcional)</option>
              {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <input className="ui-input" placeholder="Observação" value={esperaForm.observacao} onChange={(e) => setEsperaForm({ ...esperaForm, observacao: e.target.value })} />
            <button className="ui-button ui-button-primary" type="submit">Adicionar na fila</button>
          </form>
          <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
            {listaEspera.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-300/15 bg-slate-900/45 p-2 text-xs text-slate-300">
                <span>{item.cliente_nome} - {item.servico_nome || 'Sem serviço'}</span>
                <button onClick={() => handleExcluirEspera(item.id)}
                  className="ml-2 rounded px-1.5 py-0.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[11px]">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
