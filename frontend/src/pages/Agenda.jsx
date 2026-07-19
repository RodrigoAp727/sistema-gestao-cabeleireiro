import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { NOME_SALAO_FIXO_MINUSCULO, TIPO_SALAO_FIXO } from '../config/salao';

const TERMOS_BLOQUEADOS_LEGADO = ['barba', 'corte clássico', 'corte premium', 'pintura de cabelo'];

const getDataLocalISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const formatarDataBr = (dataIso) => {
  const partes = String(dataIso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) return dataIso;
  return `${partes[3]}/${partes[2]}/${partes[1]}`;
};

const parseDateBrToIso = (value) => {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  const date = new Date(year, month - 1, day);
  const isValid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isValid) return null;

  return `${yyyy}-${mm}-${dd}`;
};

const parseTime24 = (value) => {
  const match = String(value || '').trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
};

const parseDateTimeBrToIso = (value) => {
  const match = String(value || '').trim().match(/^(\d{2}\/\d{2}\/\d{4})\s+([0-2]\d:[0-5]\d)$/);
  if (!match) return null;

  const dataIso = parseDateBrToIso(match[1]);
  const hora24 = parseTime24(match[2]);
  if (!dataIso || !hora24) return null;

  return `${dataIso}T${hora24}`;
};

const maskDateBr = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const maskTime24 = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export default function Agenda() {
  const storageKey = `agenda:filtros:${TIPO_SALAO_FIXO}`;

  const carregarFiltrosIniciais = () => {
    const padrao = {
      visao: 'todos',
      referencia: getDataLocalISO(),
      profissionalFiltro: '',
    };

    try {
      const salvo = localStorage.getItem(storageKey);
      if (!salvo) return padrao;
      const parseado = JSON.parse(salvo);
      return {
        visao: 'todos',
        referencia: getDataLocalISO(),
        profissionalFiltro: String(parseado?.profissionalFiltro || ''),
      };
    } catch {
      return padrao;
    }
  };

  const filtrosIniciais = carregarFiltrosIniciais();
  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [bloqueios, setBloqueios] = useState([]);
  const [listaEspera, setListaEspera] = useState([]);
  const [modoFallbackTodos, setModoFallbackTodos] = useState(false);
  const [mensagemListaEspera, setMensagemListaEspera] = useState('');
  const [loading, setLoading] = useState(true);
  const [visao, setVisao] = useState(filtrosIniciais.visao);
  const [referencia, setReferencia] = useState(filtrosIniciais.referencia);
  const [referenciaTexto, setReferenciaTexto] = useState(formatarDataBr(filtrosIniciais.referencia));
  const [profissionalFiltro, setProfissionalFiltro] = useState(filtrosIniciais.profissionalFiltro);
  const [profissionalParaAdicionar, setProfissionalParaAdicionar] = useState('');

  const [form, setForm] = useState({
    cliente_nome: '',
    itens_agendamento: [],
    data: '',
    hora: '',
  });

  const [bloqueioForm, setBloqueioForm] = useState({
    profissional_id: '',
    inicio_data: '',
    inicio_hora: '',
    fim_data: '',
    fim_hora: '',
    motivo: '',
  });

  const [esperaForm, setEsperaForm] = useState({
    cliente_nome: '',
    telefone: '',
    profissional_id: '',
    servico_id: '',
    observacao: '',
  });
  const [remarcarModal, setRemarcarModal] = useState({
    aberto: false,
    id: null,
    data: '',
    hora: '',
  });

  useEffect(() => {
    setReferenciaTexto(formatarDataBr(referencia));
  }, [referencia]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ visao, referencia, profissionalFiltro })
      );
    } catch {
      // Sem impacto funcional se o navegador bloquear storage
    }
  }, [storageKey, visao, referencia, profissionalFiltro]);

  const carregarDados = useCallback(async () => {
    try {
      const ts = Date.now();
      const [agenda, prof, serv] = await Promise.all([
        axios.get(`/api/agenda?tipo_salao=${TIPO_SALAO_FIXO}&visao=${visao}&referencia=${referencia}&profissional_id=${profissionalFiltro}&_ts=${ts}`),
        axios.get(`/api/profissionais?tipo_salao=${TIPO_SALAO_FIXO}&_ts=${ts}`),
        axios.get(`/api/servicos?tipo_salao=${TIPO_SALAO_FIXO}&_ts=${ts}`),
      ]);

      const [resBloqueios, resEspera] = await Promise.all([
        axios.get(`/api/agenda/bloqueios?tipo_salao=${TIPO_SALAO_FIXO}`),
        axios.get(`/api/agenda/lista-espera?tipo_salao=${TIPO_SALAO_FIXO}`),
      ]);

      let agendaFinal = agenda.data || [];
      let fallbackTodosAtivo = false;

      if (visao !== 'todos' && agendaFinal.length === 0) {
        const agendaTodos = await axios.get(`/api/agenda?tipo_salao=${TIPO_SALAO_FIXO}&visao=todos&profissional_id=${profissionalFiltro}&_ts=${ts}`);
        agendaFinal = agendaTodos.data || [];
        fallbackTodosAtivo = agendaFinal.length > 0;
      }

      setAgendamentos(agendaFinal);
      setModoFallbackTodos(fallbackTodosAtivo);
      setProfissionais(prof.data);
      const listaServicos = (serv.data || []).filter((s) => {
        const nome = String(s?.nome || '').toLowerCase();
        return !TERMOS_BLOQUEADOS_LEGADO.some((termo) => nome.includes(termo));
      });
      setServicos(listaServicos);
      setBloqueios(resBloqueios.data);
      setListaEspera(resEspera.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setModoFallbackTodos(false);
      setLoading(false);
    }
  }, [profissionalFiltro, referencia, visao]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const focarListaNaDataDoFormulario = (dataIso) => {
    if (!dataIso) return;
    setVisao('todos');
    setReferencia(dataIso);
  };

  const selecionarTodos = () => {
    setVisao('todos');
  };

  const selecionarHoje = () => {
    setReferencia(getDataLocalISO());
    setVisao('dia');
  };

  const selecionarSemana = () => {
    setVisao('semana');
  };

  const selecionarMes = () => {
    setVisao('mes');
  };

  const atualizarReferenciaTexto = (valor) => {
    const valorFormatado = maskDateBr(valor);
    setReferenciaTexto(valorFormatado);
    const iso = parseDateBrToIso(valorFormatado);
    if (iso) setReferencia(iso);
  };

  const corrigirReferenciaNoBlur = () => {
    const iso = parseDateBrToIso(referenciaTexto);
    if (!iso) {
      setReferenciaTexto(formatarDataBr(referencia));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataIso = parseDateBrToIso(form.data);
    const hora24 = parseTime24(form.hora);

    if (!dataIso || !hora24) {
      alert('Use Data no formato DD/MM/AAAA e Hora no formato 24h (HH:mm).');
      return;
    }

    const itensValidos = (form.itens_agendamento || []).filter((it) => it.profissional_id && it.servico_id);
    if (itensValidos.length === 0 || itensValidos.length !== (form.itens_agendamento || []).length) {
      alert('Selecione profissional e serviço em todos os itens.');
      return;
    }

    const itensComHorario = [];
    for (let idx = 0; idx < itensValidos.length; idx += 1) {
      const it = itensValidos[idx];
      const horaFinal = parseTime24(it.hora_item || form.hora);
      if (!horaFinal) {
        alert(`Hora inválida no item ${idx + 1}. Use HH:mm.`);
        return;
      }
      itensComHorario.push({
        profissional_id: Number(it.profissional_id),
        servico_id: Number(it.servico_id),
        data_hora: `${dataIso}T${horaFinal}`,
      });
    }

    try {
      await axios.post('/api/agenda', {
        cliente_nome: form.cliente_nome.trim(),
        itens_agendamento: itensComHorario,
        profissional_id: Number(itensValidos[0].profissional_id),
        servico_id: Number(itensValidos[0].servico_id),
        data_hora: `${dataIso}T${hora24}`,
        tipo_salao: TIPO_SALAO_FIXO,
      });
      await carregarDados();
      focarListaNaDataDoFormulario(dataIso);
      setForm({ cliente_nome: '', itens_agendamento: [], data: '', hora: '' });
    } catch (err) {
      const mensagemErro = err?.response?.data?.error || err?.message || `Erro ao agendar: ${err.message}`;
      if (String(mensagemErro).toLowerCase().includes('horário indisponível')) {
        focarListaNaDataDoFormulario(dataIso);
      }
      alert(mensagemErro);
    }
  };

  const handleCriarComanda = async (item) => {
    try {
      const servicosDoAgendamento = obterServicosDoAgendamento(item);
      const { data } = await axios.post('/api/comandas', {
        tipo_salao: TIPO_SALAO_FIXO,
        cliente_id: item.cliente_id || null,
        cliente_nome: item.cliente_nome,
        profissional_id: item.profissional_id,
        desconto: 0,
        sinal_pago: 0,
        itens: servicosDoAgendamento.map((servico) => ({
          servico_id: servico.id ? Number(servico.id) : null,
          tipo_item: 'servico',
          descricao: servico.nome || 'Serviço',
          quantidade: 1,
          valor_unitario: Number(servico.preco || 0),
        })),
      });

      if (Array.isArray(data?.consumo_avisos) && data.consumo_avisos.length > 0) {
        alert(`Comanda criada com avisos de estoque:\n- ${data.consumo_avisos.join('\n- ')}`);
        return;
      }

      alert(`Comanda criada para ${item.cliente_nome}! Acesse Operação para registrar o pagamento.`);
    } catch (err) {
      alert('Erro ao criar comanda: ' + err.message);
    }
  };

  const handleConfirmar = async (id) => {
    try {
      await axios.patch(`/api/agenda/${id}/confirmar`);
      carregarDados();
    } catch {
      alert('Erro ao confirmar');
    }
  };

  const handleCancelar = async (id) => {
    try {
      await axios.patch(`/api/agenda/${id}/cancelar`);
      carregarDados();
    } catch {
      alert('Erro ao cancelar');
    }
  };

  const handleConcluir = async (id) => {
    try {
      await axios.patch(`/api/agenda/${id}/concluir`);
      carregarDados();
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao concluir atendimento');
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este agendamento permanentemente?')) return;
    try {
      await axios.delete(`/api/agenda/${id}`);
      carregarDados();
    } catch {
      alert('Erro ao excluir');
    }
  };

  const abrirModalRemarcar = (item) => {
    const dataAtual = new Date(item.data_hora);
    const dataPadrao = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;
    const horaPadrao = `${String(dataAtual.getHours()).padStart(2, '0')}:${String(dataAtual.getMinutes()).padStart(2, '0')}`;

    setRemarcarModal({
      aberto: true,
      id: item.id,
      data: dataPadrao,
      hora: horaPadrao,
    });
  };

  const fecharModalRemarcar = () => {
    setRemarcarModal({ aberto: false, id: null, data: '', hora: '' });
  };

  const confirmarRemarcacao = async (e) => {
    e.preventDefault();
    const dataHoraIso = parseDateTimeBrToIso(`${remarcarModal.data} ${remarcarModal.hora}`);
    if (!dataHoraIso) {
      alert('Formato inválido. Use DD/MM/AAAA e HH:mm (24h).');
      return;
    }

    try {
      await axios.patch(`/api/agenda/${remarcarModal.id}/remarcar`, { data_hora: dataHoraIso });
      fecharModalRemarcar();
      carregarDados();
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao remarcar');
    }
  };

  const salvarBloqueio = async (e) => {
    e.preventDefault();
    const inicioDataIso = parseDateBrToIso(bloqueioForm.inicio_data);
    const inicioHora24 = parseTime24(bloqueioForm.inicio_hora);
    const fimDataIso = parseDateBrToIso(bloqueioForm.fim_data);
    const fimHora24 = parseTime24(bloqueioForm.fim_hora);

    if (!inicioDataIso || !inicioHora24 || !fimDataIso || !fimHora24) {
      alert('Use Data no formato DD/MM/AAAA e Hora no formato 24h (HH:mm).');
      return;
    }

    try {
      await axios.post('/api/agenda/bloqueios', {
        profissional_id: bloqueioForm.profissional_id,
        inicio: `${inicioDataIso}T${inicioHora24}`,
        fim: `${fimDataIso}T${fimHora24}`,
        motivo: bloqueioForm.motivo,
        tipo_salao: TIPO_SALAO_FIXO,
      });
      setBloqueioForm({ profissional_id: '', inicio_data: '', inicio_hora: '', fim_data: '', fim_hora: '', motivo: '' });
      carregarDados();
    } catch {
      alert('Erro ao salvar indisponibilidade');
    }
  };

  const salvarListaEspera = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/agenda/lista-espera', {
        ...esperaForm,
        cliente_nome: String(esperaForm.cliente_nome || '').trim(),
        telefone: String(esperaForm.telefone || '').trim(),
        observacao: String(esperaForm.observacao || '').trim(),
        tipo_salao: TIPO_SALAO_FIXO,
      });
      setEsperaForm({ cliente_nome: '', telefone: '', profissional_id: '', servico_id: '', observacao: '' });
      setMensagemListaEspera('Cliente adicionado na lista de espera.');
      await carregarDados();
    } catch (err) {
      setMensagemListaEspera('');
      alert(err?.response?.data?.error || 'Erro ao adicionar lista de espera');
    }
  };

  const handleExcluirBloqueio = async (id) => {
    if (!window.confirm('Excluir esta indisponibilidade?')) return;
    try {
      await axios.delete(`/api/agenda/bloqueios/${id}`);
      carregarDados();
    } catch {
      alert('Erro ao excluir bloqueio');
    }
  };

  const handleExcluirEspera = async (id) => {
    if (!window.confirm('Remover da lista de espera?')) return;
    try {
      await axios.delete(`/api/agenda/lista-espera/${id}`);
      setMensagemListaEspera('');
      carregarDados();
    } catch {
      alert('Erro ao remover da lista');
    }
  };

  const adicionarServicoRapido = (servicoId) => {
    if (!profissionalParaAdicionar) {
      alert('Selecione o profissional para adicionar este serviço.');
      return;
    }

    const jaExiste = (form.itens_agendamento || []).some(
      (it) => Number(it.profissional_id) === Number(profissionalParaAdicionar) && Number(it.servico_id) === Number(servicoId)
    );
    if (jaExiste) return;

    setForm((anterior) => ({
      ...anterior,
      itens_agendamento: [
        ...(anterior.itens_agendamento || []),
        { profissional_id: String(profissionalParaAdicionar), servico_id: String(servicoId), hora_item: '' },
      ],
    }));
  };

  const removerItemAgendamento = (idx) => {
    setForm((anterior) => {
      const lista = (anterior.itens_agendamento || []).filter((_, i) => i !== idx);
      return {
        ...anterior,
        itens_agendamento: lista,
      };
    });
  };

  const totalSelecionadoFormulario = (form.itens_agendamento || []).reduce((acc, it) => {
    const servico = servicos.find((s) => Number(s.id) === Number(it.servico_id));
    return acc + Number(servico?.preco || 0);
  }, 0);

  const obterServicosDoAgendamento = (item) => {
    try {
      if (item.servicos_json) {
        const parseado = JSON.parse(item.servicos_json);
        if (Array.isArray(parseado) && parseado.length > 0) {
          return parseado;
        }
      }
    } catch {
      // ignora JSON inválido e usa fallback abaixo
    }
    return [{ id: item.servico_id, nome: item.servico_nome, preco: Number(item.preco || 0) }];
  };

  const corProfissional = (nome = '') => {
    const paleta = ['#06b6d4', '#34d399', '#f59e0b', '#f472b6', '#818cf8', '#fb7185'];
    let hash = 0;
    for (let i = 0; i < nome.length; i += 1) hash += nome.charCodeAt(i);
    return paleta[hash % paleta.length];
  };

  const tituloAgenda = visao === 'dia' ? `Hoje, ${formatarDataBr(referencia)}` :
    visao === 'semana' ? 'Agenda da semana' :
    visao === 'mes' ? 'Agenda do mês' : 'Todos os agendamentos';

  if (loading) {
    return <div className="text-center py-12 text-amber-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl md:text-2xl">Agenda</h2>
            <p className="ui-muted mt-1 text-xs uppercase tracking-[0.18em] text-amber-200/80">{tituloAgenda}</p>
            <p className="ui-muted mt-1 text-sm">Planejamento e controle do {NOME_SALAO_FIXO_MINUSCULO}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={`ui-button ${visao === 'todos' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={selecionarTodos}>Todos</button>
            <button className={`ui-button ${visao === 'dia' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={selecionarHoje}>Hoje</button>
            <button className={`ui-button ${visao === 'semana' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={selecionarSemana}>Semana</button>
            <button className={`ui-button ${visao === 'mes' ? 'ui-button-primary' : 'ui-button-ghost'}`} onClick={selecionarMes}>Mês</button>
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              className="ui-input max-w-[180px]"
              value={referenciaTexto}
              onChange={(e) => atualizarReferenciaTexto(e.target.value)}
              onBlur={corrigirReferenciaNoBlur}
            />
            <select className="ui-select max-w-[220px]" value={profissionalFiltro} onChange={(e) => setProfissionalFiltro(e.target.value)}>
              <option value="">Todos os profissionais</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
        {modoFallbackTodos && (
          <p className="ui-muted mt-2 text-xs">
            Sem agendamentos no período selecionado. Exibindo todos os agendamentos para não perder registros.
          </p>
        )}
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

          <div className="md:col-span-2 rounded-xl border border-slate-300/15 bg-slate-900/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Itens do atendimento (serviço + profissional)</p>
              <button
                type="button"
                className="ui-button ui-button-ghost"
                onClick={() => setForm((anterior) => ({ ...anterior, itens_agendamento: [] }))}
              >
                Limpar itens
              </button>
            </div>

            <div className="mb-3">
              <select
                value={profissionalParaAdicionar}
                onChange={(e) => setProfissionalParaAdicionar(e.target.value)}
                className="ui-select"
              >
                <option value="">Escolha o profissional para adicionar serviços</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {p.especialidade}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {servicos.map((s) => (
                <button
                  key={`quick-${s.id}`}
                  type="button"
                  onClick={() => adicionarServicoRapido(s.id)}
                  className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-3 text-left transition hover:bg-amber-300/20"
                >
                  <p className="truncate text-sm font-semibold text-amber-100">{s.nome}</p>
                  <p className="mt-1 text-xs text-amber-200/90">R$ {Number(s.preco || 0).toFixed(2)}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {(form.itens_agendamento || []).length === 0 && (
                <div className="rounded-lg border border-slate-300/15 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
                  Nenhum item adicionado. Selecione o profissional acima e clique nos quadrados de serviço.
                </div>
              )}
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                Dica: use o horário geral abaixo e, se precisar, ajuste o horário específico de cada item.
              </div>
              {(form.itens_agendamento || []).map((itemAt, idx) => {
                const profissionalSelecionado = profissionais.find((p) => Number(p.id) === Number(itemAt.profissional_id));
                const servicoSelecionado = servicos.find((s) => Number(s.id) === Number(itemAt.servico_id));
                return (
                  <div key={`item-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-300/15 bg-slate-900/45 px-3 py-2">
                    <div className="text-sm text-slate-200">
                      <span className="font-semibold text-amber-200">{servicoSelecionado?.nome || 'Serviço'}</span>
                      {' · '}
                      <span>{profissionalSelecionado?.nome || 'Profissional'}</span>
                      {' · '}
                      <span className="text-emerald-300">R$ {Number(servicoSelecionado?.preco || 0).toFixed(2)}</span>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={itemAt.hora_item || ''}
                        onChange={(e) => {
                          const horaFormatada = maskTime24(e.target.value);
                          setForm((anterior) => {
                            const lista = [...(anterior.itens_agendamento || [])];
                            lista[idx] = { ...lista[idx], hora_item: horaFormatada };
                            return { ...anterior, itens_agendamento: lista };
                          });
                        }}
                        inputMode="numeric"
                        placeholder="Hora item"
                        className="ui-input w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removerItemAgendamento(idx)}
                        className="ui-button bg-red-500/20 py-1.5 text-xs text-red-300 hover:bg-red-500/40"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-2 text-sm text-emerald-300">
              Total automático: <span className="font-bold">R$ {totalSelecionadoFormulario.toFixed(2)}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: maskDateBr(e.target.value) })}
              required
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              className="ui-input"
            />
            <input
              type="text"
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: maskTime24(e.target.value) })}
              required
              inputMode="numeric"
              placeholder="HH:mm"
              className="ui-input"
            />
          </div>

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
            agendamentos.map((item) => {
              const servicosDoAgendamento = obterServicosDoAgendamento(item);
              return (
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
                    <p className="font-semibold text-amber-400">
                      {servicosDoAgendamento.length > 1
                        ? `${servicosDoAgendamento.length} itens selecionados`
                        : servicosDoAgendamento[0]?.nome}
                    </p>
                    {servicosDoAgendamento.length > 1 && (
                      <p className="mt-1 text-xs text-slate-300">
                        {servicosDoAgendamento.map((s) => s.nome).join(' + ')}
                      </p>
                    )}
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
                          onClick={() => abrirModalRemarcar(item)}
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
                          onClick={() => handleConcluir(item.id)}
                          className="ui-button rounded-lg bg-emerald-400/90 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                        >
                          Concluir serviço
                        </button>
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
                    {item.status === 'concluido' && (
                      <div className="flex gap-2 items-center">
                        <span className="rounded-lg bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-950">
                          Concluído
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
            );
            })
          ) : (
            <p className="text-slate-400 text-center py-8">Nenhum agendamento encontrado</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <h2 className="ui-title mb-4 text-xl">Indisponibilidade da Profissional</h2>
          <form className="grid grid-cols-1 gap-3" onSubmit={salvarBloqueio}>
            <select className="ui-select" required value={bloqueioForm.profissional_id} onChange={(e) => setBloqueioForm({ ...bloqueioForm, profissional_id: e.target.value })}>
              <option value="">Profissional</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="ui-input" type="text" inputMode="numeric" placeholder="DD/MM/AAAA" required value={bloqueioForm.inicio_data} onChange={(e) => setBloqueioForm({ ...bloqueioForm, inicio_data: maskDateBr(e.target.value) })} />
              <input className="ui-input" type="text" inputMode="numeric" placeholder="HH:mm" required value={bloqueioForm.inicio_hora} onChange={(e) => setBloqueioForm({ ...bloqueioForm, inicio_hora: maskTime24(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="ui-input" type="text" inputMode="numeric" placeholder="DD/MM/AAAA" required value={bloqueioForm.fim_data} onChange={(e) => setBloqueioForm({ ...bloqueioForm, fim_data: maskDateBr(e.target.value) })} />
              <input className="ui-input" type="text" inputMode="numeric" placeholder="HH:mm" required value={bloqueioForm.fim_hora} onChange={(e) => setBloqueioForm({ ...bloqueioForm, fim_hora: maskTime24(e.target.value) })} />
            </div>
            <input className="ui-input" placeholder="Motivo" value={bloqueioForm.motivo} onChange={(e) => setBloqueioForm({ ...bloqueioForm, motivo: e.target.value })} />
            <button className="ui-button ui-button-primary" type="submit">Salvar indisponibilidade</button>
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
          {mensagemListaEspera && (
            <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {mensagemListaEspera}
            </div>
          )}
          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
            {listaEspera.length === 0 && (
              <div className="rounded-lg border border-slate-300/15 bg-slate-900/40 px-3 py-3 text-sm text-slate-400">
                Nenhuma cliente na lista de espera no momento.
              </div>
            )}
            {listaEspera.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-300/15 bg-slate-900/45 p-3 text-xs text-slate-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">{item.cliente_nome}</p>
                    <p>{item.servico_nome || 'Sem serviço definido'}</p>
                    <p>{item.profissional_nome || 'Sem profissional definido'}</p>
                    {item.telefone && <p>Telefone: {item.telefone}</p>}
                    {item.observacao && <p>Obs.: {item.observacao}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExcluirEspera(item.id)}
                    className="rounded px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[11px]"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {remarcarModal.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ui-surface w-full max-w-md rounded-xl p-5">
            <h3 className="ui-title mb-2 text-lg">Remarcar Agendamento</h3>
            <p className="ui-muted mb-4 text-sm">Informe a nova data e hora</p>

            <form className="space-y-3" onSubmit={confirmarRemarcacao}>
              <input
                className="ui-input"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                value={remarcarModal.data}
                onChange={(e) => setRemarcarModal({ ...remarcarModal, data: maskDateBr(e.target.value) })}
                required
              />
              <input
                className="ui-input"
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                value={remarcarModal.hora}
                onChange={(e) => setRemarcarModal({ ...remarcarModal, hora: maskTime24(e.target.value) })}
                required
              />

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="ui-button ui-button-ghost" onClick={fecharModalRemarcar}>
                  Cancelar
                </button>
                <button type="submit" className="ui-button ui-button-primary">
                  Salvar remarcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
