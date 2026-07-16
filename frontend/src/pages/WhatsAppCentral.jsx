import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function WhatsAppCentral() {
  const [templates, setTemplates] = useState({});
  const [telefone, setTelefone] = useState('');
  const [tipo, setTipo] = useState('confirmacao');
  const [textoExtra, setTextoExtra] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    const { data } = await axios.get('/api/whatsapp/templates');
    setTemplates(data);
  };

  const gerar = async () => {
    const { data } = await axios.post('/api/whatsapp/gerar-link', {
      telefone,
      tipo,
      variaveis: {
        nome: 'Cliente',
        data: new Date().toLocaleDateString('pt-BR'),
        hora: '15:00',
        texto: textoExtra || 'Sem observações',
        valor: 'R$ 0,00',
      },
    });
    setLink(data.link);
  };

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <h2 className="ui-title text-xl md:text-2xl">Central de WhatsApp</h2>
        <p className="ui-muted mt-1 text-sm">Confirmação, lembretes, orientações, recibos, promoções e aniversário</p>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Gerar mensagem</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
