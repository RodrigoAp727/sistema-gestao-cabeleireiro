import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NOME_SALAO_FIXO, TIPO_SALAO_FIXO } from '../config/salao';
import Pagination from '../components/Pagination';

const EQUIPE_POR_PAGINA = 20;

const formVazio = {
  nome: '',
  especialidade: '',
  cargo: '',
  horario_trabalho: '',
  salario: '',
  comissao_percentual: '',
  vale_transporte: '',
  bonificacao: '',
  dias_trabalho: '',
  nivel_acesso: 'profissional',
};

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Equipe() {
  const [itens, setItens] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...formVazio });
  const [paginaItens, setPaginaItens] = useState(1);
  const [totalItens, setTotalItens] = useState(0);

  // Configurações do salão
  const [config, setConfig] = useState({ comissao_salao_fornece: '35', comissao_profissional_fornece: '55' });
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [erroTela, setErroTela] = useState('');

  useEffect(() => { carregar(1); carregarConfig(); }, []);

  const carregar = async (pagina = paginaItens) => {
    try {
      setErroTela('');
      const { data } = await axios.get(`/api/profissionais?tipo_salao=${TIPO_SALAO_FIXO}&page=${pagina}&limit=${EQUIPE_POR_PAGINA}`);
      const itensNormalizados = Array.isArray(data) ? data : (data?.items || []);
      setItens(itensNormalizados);
      setTotalItens(Array.isArray(data) ? itensNormalizados.length : Number(data?.total || itensNormalizados.length));
      setPaginaItens(Array.isArray(data) ? pagina : Number(data?.page || pagina));
    } catch {
      setErroTela('Não foi possível carregar a equipe no momento.');
    }
  };

  const carregarConfig = async () => {
    try {
      const { data } = await axios.get(`/api/config?tipo_salao=${TIPO_SALAO_FIXO}`);
      setConfig({
        comissao_salao_fornece:        data.configuracoes?.comissao_salao_fornece?.valor        ?? '35',
        comissao_profissional_fornece: data.configuracoes?.comissao_profissional_fornece?.valor ?? '55',
      });
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  };

  const salvarConfig = async (e) => {
    e.preventDefault();
    setSalvandoConfig(true);
    try {
      await Promise.all([
        axios.put('/api/config', { tipo_salao: TIPO_SALAO_FIXO, chave: 'comissao_salao_fornece',        valor: config.comissao_salao_fornece }),
        axios.put('/api/config', { tipo_salao: TIPO_SALAO_FIXO, chave: 'comissao_profissional_fornece', valor: config.comissao_profissional_fornece }),
      ]);
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  const excluir = async (item) => {
    if (!window.confirm(`Excluir "${item.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`/api/profissionais/${item.id}`);
      carregar(paginaItens);
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setShowForm(true);
    setForm({
      nome: item.nome || '',
      especialidade: item.especialidade || '',
      cargo: item.cargo || '',
      horario_trabalho: item.horario_trabalho || '',
      salario: item.salario || '',
      comissao_percentual: item.comissao_percentual ?? '',
      vale_transporte: item.vale_transporte || '',
      bonificacao: item.bonificacao || '',
      dias_trabalho: item.dias_trabalho || '',
      nivel_acesso: item.nivel_acesso || 'profissional',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setShowForm(false);
    setForm({ ...formVazio });
  };

  const salvar = async (e) => {
    e.preventDefault();
    const payload = { ...form, tipo_salao: TIPO_SALAO_FIXO };
    if (editandoId) {
      await axios.put(`/api/profissionais/${editandoId}`, payload);
    } else {
      await axios.post('/api/profissionais', payload);
    }
    cancelarEdicao();
    carregar(paginaItens);
  };

  const exibirPct = (item) => {
    if (item.comissao_percentual !== null && item.comissao_percentual !== undefined) {
      return { valor: `${item.comissao_percentual}%`, individual: true };
    }
    const padrao = item.profissional_fornece_produtos
      ? config.comissao_profissional_fornece
      : config.comissao_salao_fornece;
    return { valor: `${padrao}% (padrão)`, individual: false };
  };

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ui-title text-xl md:text-2xl">Equipe</h2>
            <p className="ui-muted mt-1 text-sm">Funcionários, cargos, comissões e níveis de acesso</p>
          </div>
          <button
            className={`ui-button ${showForm && !editandoId ? 'ui-button-ghost' : 'ui-button-primary'}`}
            onClick={() => { if (showForm && !editandoId) { cancelarEdicao(); } else { setEditandoId(null); setForm({ ...formVazio }); setShowForm(true); } }}
          >
            {showForm && !editandoId ? 'Cancelar' : '+ Novo funcionário'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="ui-surface rounded-xl p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="ui-title text-lg">
              {editandoId ? `Editando: ${form.nome}` : 'Novo funcionário'}
          {erroTela && <p className="mb-3 text-sm text-slate-400">{erroTela}</p>}
            </h3>
            <button className="ui-button ui-button-ghost py-1 text-xs" onClick={cancelarEdicao}>Cancelar</button>
          </div>

          <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={salvar}>
            <input className="ui-input" placeholder="Nome *" required value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input className="ui-input" placeholder="Especialidade" value={form.especialidade}
              onChange={(e) => setForm({ ...form, especialidade: e.target.value })} />
            <input className="ui-input" placeholder="Cargo (ex: cabeleireira, manicure)" value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            <input className="ui-input" placeholder="Horário (ex: Seg-Sex 09h-18h)" value={form.horario_trabalho}
              onChange={(e) => setForm({ ...form, horario_trabalho: e.target.value })} />
            <input className="ui-input" placeholder="Dias de trabalho" value={form.dias_trabalho}
              onChange={(e) => setForm({ ...form, dias_trabalho: e.target.value })} />
            <div className="relative">
              <input type="number" step="0.1" min="0" max="100" className="ui-input pr-8"
                placeholder="Comissão (%)" value={form.comissao_percentual}
                onChange={(e) => setForm({ ...form, comissao_percentual: e.target.value })} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
            <input type="number" step="0.01" className="ui-input" placeholder="Salário (R$)" value={form.salario}
              onChange={(e) => setForm({ ...form, salario: e.target.value })} />
            <input type="number" step="0.01" className="ui-input" placeholder="Vale-transporte (R$)" value={form.vale_transporte}
              onChange={(e) => setForm({ ...form, vale_transporte: e.target.value })} />
            <input type="number" step="0.01" className="ui-input" placeholder="Bonificação (R$)" value={form.bonificacao}
              onChange={(e) => setForm({ ...form, bonificacao: e.target.value })} />
            <select className="ui-select" value={form.nivel_acesso}
              onChange={(e) => setForm({ ...form, nivel_acesso: e.target.value })}>
              <option value="administrador">Administrador</option>
              <option value="recepcao">Recepção</option>
              <option value="profissional">Profissional</option>
            </select>
            <button className="ui-button ui-button-primary md:col-span-2 py-3" type="submit">
              {editandoId ? 'Salvar alterações' : 'Cadastrar funcionário'}
            </button>
          </form>
        </div>
      )}

      {/* Configurações do Salão */}
      <div className="ui-surface rounded-xl p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">⚙</div>
          <div>
            <h3 className="ui-title text-lg">Configurações do {NOME_SALAO_FIXO}</h3>
            <p className="text-xs text-slate-400">Percentual de comissão padrão aplicado quando o profissional não tem % individual definido</p>
          </div>
        </div>

        <form onSubmit={salvarConfig} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
              % quando o salão fornece produtos
            </label>
            <div className="relative">
              <input
                type="number" step="0.1" min="0" max="100"
                className="ui-input pr-8"
                value={config.comissao_salao_fornece}
                onChange={(e) => setConfig({ ...config, comissao_salao_fornece: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Profissional recebe <strong className="text-emerald-300">{config.comissao_salao_fornece}%</strong> · Salão retém <strong className="text-amber-300">{(100 - Number(config.comissao_salao_fornece || 0)).toFixed(1)}%</strong>
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
              % quando o profissional fornece produtos
            </label>
            <div className="relative">
              <input
                type="number" step="0.1" min="0" max="100"
                className="ui-input pr-8"
                value={config.comissao_profissional_fornece}
                onChange={(e) => setConfig({ ...config, comissao_profissional_fornece: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Profissional recebe <strong className="text-emerald-300">{config.comissao_profissional_fornece}%</strong> · Salão retém <strong className="text-amber-300">{(100 - Number(config.comissao_profissional_fornece || 0)).toFixed(1)}%</strong>
            </p>
          </div>

          <button
            type="submit"
            disabled={salvandoConfig}
            className="ui-button ui-button-primary sm:col-span-2 py-3"
          >
            {salvandoConfig ? 'Salvando…' : 'Salvar configurações do salão'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/8 p-3 text-xs text-amber-200/80">
          💡 <strong>Lembrete:</strong> Profissionais com % individual definida (na seção abaixo) sempre usam o próprio percentual. A configuração acima é o padrão para quem não tem % definida.
        </div>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <h3 className="ui-title mb-4 text-lg">Funcionários ({totalItens})</h3>
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.id}
              className="rounded-xl border border-slate-300/15 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-sm font-bold text-amber-300">
                    {item.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{item.nome}</p>
                    <p className="text-xs text-slate-400">
                      {item.especialidade || '—'} · {item.cargo || 'Profissional'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.horario_trabalho || ''}{item.dias_trabalho ? ` · ${item.dias_trabalho}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-right">
                  <div>
                    <p className="text-xs text-slate-500">Comissão</p>
                    {(() => {
                      const { valor, individual } = exibirPct(item);
                      return (
                        <p className={`font-extrabold ${individual ? 'text-lg text-emerald-300' : 'text-base text-amber-300'}`}>
                          {valor}
                        </p>
                      );
                    })()}
                  </div>
                  {item.salario > 0 && (
                    <div>
                      <p className="text-xs text-slate-500">Salário</p>
                      <p className="font-semibold text-slate-200">{fmt(item.salario)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Acesso</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.nivel_acesso === 'administrador' ? 'bg-amber-400/20 text-amber-300' :
                      item.nivel_acesso === 'recepcao' ? 'bg-cyan-400/20 text-cyan-300' :
                      'bg-slate-400/20 text-slate-300'}`}>
                      {item.nivel_acesso || 'profissional'}
                    </span>
                  </div>
                  <button
                    onClick={() => iniciarEdicao(item)}
                    className="ui-button ui-button-ghost py-1.5 text-xs">
                    Editar
                  </button>
                  <button
                    onClick={() => excluir(item)}
                    className="ui-button py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
          {itens.length === 0 && (
            <p className="py-8 text-center text-slate-400">Nenhum funcionário cadastrado</p>
          )}
        </div>

        {itens.length > 0 && (
          <Pagination
            page={paginaItens}
            totalPages={Math.max(1, Math.ceil(totalItens / EQUIPE_POR_PAGINA))}
            totalItems={totalItens}
            pageSize={EQUIPE_POR_PAGINA}
            itemLabel="funcionários"
            onPageChange={(proximaPagina) => {
              const paginaNormalizada = Math.max(proximaPagina, 1);
              setPaginaItens(paginaNormalizada);
              carregar(paginaNormalizada);
            }}
          />
        )}
      </div>
    </div>
  );
}
