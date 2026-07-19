import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TIPO_SALAO_FIXO } from '../config/salao';

export default function WhatsAppCentral() {
  const [templates, setTemplates] = useState({});
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipo, setTipo] = useState('confirmacao');
  const [textoExtra, setTextoExtra] = useState('');
  const [link, setLink] = useState('');
  const [erroTela, setErroTela] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setErroTela('');
      const [resTemplates, resAgenda] = await Promise.all([
        axios.get('/api/whatsapp/templates'),
        axios.get(`/api/agenda?tipo_salao=${TIPO_SALAO_FIXO}&visao=todos`),
      ]);
      setTemplates(resTemplates.data || {});
      setAgendamentos((resAgenda.data || []).slice(0, 20));
    } catch (err) {
      console.error('Erro ao carregar dados do WhatsApp:', err);
      setErroTela(err?.response?.data?.error || 'Não foi possível carregar os dados do WhatsApp.');
    }
  };

  const preencherPeloAgendamento = () => {
    const item = agendamentos.find((ag) => Number(ag.id) === Number(agendamentoSelecionado));
    if (!item) return;

    const dataHora = new Date(item.data_hora);
    const data = Number.isNaN(dataHora.getTime()) ? new Date().toLocaleDateString('pt-BR') : dataHora.toLocaleDateString('pt-BR');
    const hora = Number.isNaN(dataHora.getTime()) ? '09:00' : dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setTextoExtra(item.servico_nome || textoExtra);
    setTelefone(item.telefone || telefone);

    return { nome: item.cliente_nome || 'Cliente', data, hora, valor: 'R$ 0,00' };
  };

  const gerar = async () => {
    const numero = String(telefone || '').replace(/\D/g, '');
    if (numero.length < 10) {
      alert('Informe um telefone valido com DDD.');
      return;
    }

    const preenchido = preencherPeloAgendamento();

    const { data } = await axios.post('/api/whatsapp/gerar-link', {
      telefone: numero,
      tipo,
      variaveis: {
        nome: preenchido?.nome || 'Cliente',
        data: preenchido?.data || new Date().toLocaleDateString('pt-BR'),
        hora: preenchido?.hora || '15:00',
        texto: textoExtra || 'Sem observacoes',
        valor: preenchido?.valor || 'R$ 0,00',
      },
    });
    setLink(data.link);
  };

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <h2 className="ui-title text-xl md:text-2xl">Central de WhatsApp</h2>
        <p className="ui-muted mt-1 text-sm">Confirmação, lembretes, orientações, recibos, promoções e aniversário</p>
        {erroTela && <p className="mt-2 text-sm text-slate-400">{erroTela}</p>}
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Gerar mensagem</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select className="ui-select md:col-span-2" value={agendamentoSelecionado} onChange={(e) => setAgendamentoSelecionado(e.target.value)}>
            <option value="">Preencher por agendamento (opcional)</option>
            {agendamentos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.cliente_nome} - {new Date(item.data_hora).toLocaleString('pt-BR')}
              </option>
            ))}
          </select>
          <input className="ui-input" placeholder="Telefone com DDD" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <select className="ui-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.keys(templates).map((chave) => (
              <option key={chave} value={chave}>{chave}</option>
            ))}
          </select>
          <textarea className="ui-input md:col-span-2" rows="3" placeholder="Texto complementar" value={textoExtra} onChange={(e) => setTextoExtra(e.target.value)} />
          <button className="ui-button ui-button-primary md:col-span-2" onClick={gerar}>Gerar link</button>
        </div>

        {link && (
          <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4">
            <p className="text-sm text-emerald-100 break-all">{link}</p>
            <a href={link} target="_blank" rel="noreferrer" className="mt-3 inline-block ui-button ui-button-ghost">Abrir WhatsApp</a>
          </div>
        )}
      </div>
    </div>
  );
}
