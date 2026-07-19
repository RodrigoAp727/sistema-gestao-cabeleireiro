import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const PERFIS = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'recepcao', label: 'Recepção' },
  { value: 'profissional', label: 'Profissional' },
];

const SENHA_MINIMA = 6;

const estadoInicialForm = {
  nome: '',
  login: '',
  perfil: 'recepcao',
  senha: '',
  profissional_id: '',
  ativo: true,
};

export default function Usuarios({ usuarioLogado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicialForm);
  const [salvando, setSalvando] = useState(false);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter((u) => {
      return (
        String(u.nome || '').toLowerCase().includes(termo) ||
        String(u.login || '').toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro('');
      const [resUsuarios, resProfissionais] = await Promise.all([
        axios.get('/api/usuarios'),
        axios.get('/api/profissionais?tipo_salao=feminino'),
      ]);
      setUsuarios(resUsuarios.data || []);
      setProfissionais(resProfissionais.data || []);
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const limparForm = () => {
    setForm(estadoInicialForm);
    setEditandoId(null);
  };

  const iniciarEdicao = (usuario) => {
    setEditandoId(usuario.id);
    setForm({
      nome: usuario.nome || '',
      login: usuario.login || '',
      perfil: usuario.perfil || 'recepcao',
      senha: '',
      profissional_id: usuario.profissional_id ? String(usuario.profissional_id) : '',
      ativo: Number(usuario.ativo) === 1,
    });
  };

  const validarFormulario = () => {
    if (!form.nome.trim()) return 'Nome é obrigatório.';
    if (!form.login.trim()) return 'Login é obrigatório.';

    if (!editandoId && form.senha.trim().length < SENHA_MINIMA) {
      return `Senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
    }

    if (editandoId && form.senha.trim() && form.senha.trim().length < SENHA_MINIMA) {
      return `Nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
    }

    if (form.perfil === 'profissional' && !form.profissional_id) {
      return 'Selecione o profissional vinculado para este usuário.';
    }

    return null;
  };

  const salvarUsuario = async (event) => {
    event.preventDefault();

    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      const payload = {
        nome: form.nome.trim(),
        login: form.login.trim().toLowerCase(),
        perfil: form.perfil,
        profissional_id: form.perfil === 'profissional' ? Number(form.profissional_id) : null,
        ativo: !!form.ativo,
      };

      if (form.senha.trim()) {
        payload.senha = form.senha.trim();
      }

      if (editandoId) {
        await axios.put(`/api/usuarios/${editandoId}`, payload);
      } else {
        await axios.post('/api/usuarios', payload);
      }

      limparForm();
      await carregarDados();
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível salvar o usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const desativarUsuario = async (usuario) => {
    if (!window.confirm(`Desativar o usuário ${usuario.nome}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/usuarios/${usuario.id}`);
      await carregarDados();
    } catch (err) {
      setErro(err?.response?.data?.error || 'Não foi possível desativar o usuário.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="ui-surface rounded-xl p-4">
        <h2 className="ui-title text-xl md:text-2xl">Gestão de Usuários</h2>
        <p className="ui-muted mt-1 text-sm">
          Controle de acesso por perfil. Apenas o Administrador Mestre pode criar, editar e desativar usuários.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Sessão atual: {usuarioLogado?.nome || usuarioLogado?.login || 'Administrador'}
        </p>
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="ui-title text-lg">{editandoId ? 'Editar usuário' : 'Novo usuário'}</h3>
          {editandoId && (
            <button type="button" className="ui-button ui-button-ghost" onClick={limparForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={salvarUsuario}>
          <input
            className="ui-input"
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          />
          <input
            className="ui-input"
            placeholder="Login ou e-mail"
            value={form.login}
            onChange={(e) => setForm((prev) => ({ ...prev, login: e.target.value }))}
          />

          <select
            className="ui-select"
            value={form.perfil}
            onChange={(e) => setForm((prev) => ({ ...prev, perfil: e.target.value }))}
          >
            {PERFIS.map((perfil) => (
              <option key={perfil.value} value={perfil.value}>{perfil.label}</option>
            ))}
          </select>

          <input
            className="ui-input"
            type="password"
            placeholder={editandoId ? `Nova senha (opcional, mínimo ${SENHA_MINIMA})` : `Senha (mínimo ${SENHA_MINIMA})`}
            value={form.senha}
            onChange={(e) => setForm((prev) => ({ ...prev, senha: e.target.value }))}
          />

          {form.perfil === 'profissional' && (
            <select
              className="ui-select md:col-span-2"
              value={form.profissional_id}
              onChange={(e) => setForm((prev) => ({ ...prev, profissional_id: e.target.value }))}
            >
              <option value="">Vincular profissional...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}

          {editandoId && (
            <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((prev) => ({ ...prev, ativo: e.target.checked }))}
              />
              Usuário ativo
            </label>
          )}

          <button type="submit" className="ui-button ui-button-primary md:col-span-2" disabled={salvando}>
            {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar usuário'}
          </button>
        </form>

        {erro && (
          <p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            {erro}
          </p>
        )}
      </div>

      <div className="ui-surface rounded-xl p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="ui-title text-lg">Usuários cadastrados</h3>
          <input
            className="ui-input max-w-xs"
            placeholder="Buscar por nome/login"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Carregando usuários...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300/15 text-left text-slate-400">
                  <th className="pb-2 pr-4">Nome</th>
                  <th className="pb-2 pr-4">Login</th>
                  <th className="pb-2 pr-4">Perfil</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const ativo = Number(u.ativo) === 1;
                  return (
                    <tr key={u.id} className="border-b border-slate-300/10 text-slate-200">
                      <td className="py-2 pr-4">{u.nome}</td>
                      <td className="py-2 pr-4">{u.login}</td>
                      <td className="py-2 pr-4 capitalize">{u.perfil}</td>
                      <td className="py-2 pr-4">
                        <span className={ativo ? 'text-emerald-300' : 'text-rose-300'}>
                          {ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="ui-button ui-button-ghost px-3 py-1"
                            onClick={() => iniciarEdicao(u)}
                          >
                            Editar
                          </button>
                          {ativo && u.id !== usuarioLogado?.id && (
                            <button
                              type="button"
                              className="ui-button ui-button-ghost px-3 py-1"
                              onClick={() => desativarUsuario(u)}
                            >
                              Desativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
