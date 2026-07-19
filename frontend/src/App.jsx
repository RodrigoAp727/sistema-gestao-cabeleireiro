import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import SalaoBanner from './components/SalaoBanner';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Precos from './pages/Precos';
import Clientes from './pages/Clientes';
import Operacao from './pages/Operacao';
import Equipe from './pages/Equipe';
import Estoque from './pages/Estoque';
import Relatorios from './pages/Relatorios';
import WhatsAppCentral from './pages/WhatsAppCentral';
import Comissoes from './pages/Comissoes';
import Usuarios from './pages/Usuarios';
import { obterPaginasPermitidas } from './config/navigation';

const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  agenda: Agenda,
  precos: Precos,
  clientes: Clientes,
  operacao: Operacao,
  equipe: Equipe,
  estoque: Estoque,
  relatorios: Relatorios,
  whatsapp: WhatsAppCentral,
  comissoes: Comissoes,
  usuarios: Usuarios,
};

function TelaLogin({ login, setLogin, senha, setSenha, erro, loading, onSubmit }) {
  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="overflow-hidden rounded-[32px] border border-amber-100/15 bg-[linear-gradient(180deg,rgba(18,18,19,0.96),rgba(10,10,11,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          <img
            src="/images/estudio-valdo-santos-hero-crop.png"
            alt="Ambiente do Estúdio Valdo Santos"
            className="block w-full object-cover object-center"
          />
        </div>

        <div className="ui-surface rounded-[28px] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Acesso seguro</p>
          <h1 className="ui-title mt-3 text-3xl sm:text-4xl">Entrar no sistema</h1>
          <p className="ui-muted mt-3 text-sm leading-6">Informe seu login e senha para acessar o sistema.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="usuario-login">
                Login
              </label>
              <input
                id="usuario-login"
                className="ui-input"
                placeholder="Ex.: Rodrigo Campos"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="senha-login">
                Senha
              </label>
              <input
                id="senha-login"
                type="password"
                className="ui-input"
                placeholder="Informe sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {erro}
              </div>
            )}

            <button type="submit" className="ui-button ui-button-primary w-full py-3" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TelaNotFound({ onVoltar }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-slate-100">
      <div className="ui-surface max-w-xl rounded-[28px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Erro 404</p>
        <h1 className="ui-title mt-3 text-3xl">Página não encontrada</h1>
        <p className="ui-muted mt-3 text-sm">
          O caminho acessado não existe no sistema. Volte para o Dashboard para continuar o atendimento.
        </p>
        <button type="button" className="ui-button ui-button-primary mt-6" onClick={onVoltar}>
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}

function App() {
  const [pagina, setPagina] = useState('dashboard');
  const [login, setLogin] = useState('Rodrigo Campos');
  const [sessao, setSessao] = useState(null);
  const [senha, setSenha] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [erroAuth, setErroAuth] = useState('');
  const [erroPermissao, setErroPermissao] = useState('');
  const [pathNotFound, setPathNotFound] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    setPathNotFound(!(path === '/' || path === '/index.html'));
  }, []);

  useEffect(() => {
    axios.defaults.withCredentials = true;

    const verificarSessao = async () => {
      try {
        const { data } = await axios.get('/api/auth/session');
        setSessao({ user: data.user, expiresAt: data.expires_at });
      } catch {
        setSessao(null);
      } finally {
        setAuthLoading(false);
      }
    };

    verificarSessao();
  }, []);

  useEffect(() => {
    const perfilAtivo = sessao?.user?.perfil || 'administrador';
    const paginasPermitidas = obterPaginasPermitidas(perfilAtivo, sessao?.user);
    if (!paginasPermitidas.includes(pagina)) {
      setErroPermissao('Você não tem permissão para acessar esta área.');
      setPagina('dashboard');
    }
  }, [sessao, pagina]);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          setSessao(null);
          setErroAuth('Sua sessão expirou. Entre novamente para continuar.');
        } else if (status === 403) {
          setErroPermissao('Você não tem permissão para acessar esta área.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErroAuth('');
    setLoginLoading(true);

    try {
      const { data } = await axios.post('/api/auth/login', { login, senha }, { timeout: 12000 });
      setSessao({ user: data.user, expiresAt: data.expires_at });
      setSenha('');
      setPagina('dashboard');
      setErroPermissao('');
    } catch (error) {
      if (error?.code === 'ECONNABORTED') {
        setErroAuth('O servidor demorou para responder. Verifique a conexão e tente novamente.');
      } else if (!error?.response) {
        setErroAuth('Não foi possível conectar ao servidor. Verifique se o backend está ativo.');
      } else {
        setErroAuth(error?.response?.data?.error || 'Não foi possível autenticar este perfil.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch {
      // A limpeza local garante saída mesmo se a requisição falhar.
    } finally {
      setSessao(null);
      setSenha('');
      setErroAuth('Sessão encerrada. Faça login para continuar.');
    }
  };

  const handleVoltarDashboard = () => {
    window.history.replaceState({}, '', '/');
    setPathNotFound(false);
    setPagina('dashboard');
  };

  const PageComponent = PAGE_COMPONENTS[pagina];

  if (pathNotFound) {
    return <TelaNotFound onVoltar={handleVoltarDashboard} />;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-100">
        <div className="ui-surface rounded-[28px] px-8 py-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Verificando sessão</p>
          <p className="mt-3 text-lg text-amber-100">Carregando acesso seguro...</p>
        </div>
      </div>
    );
  }

  if (!sessao) {
    return (
      <TelaLogin
        login={login}
        setLogin={setLogin}
          senha={senha}
          setSenha={setSenha}
        erro={erroAuth}
        loading={loginLoading}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-100">
      <Navbar
        pagina={pagina}
        setPagina={setPagina}
        perfil={sessao.user?.perfil}
        usuario={sessao.user}
        onLogout={handleLogout}
      />
      
      <main className="w-full">
        <SalaoBanner />
        <div className="container mx-auto px-4 pb-10 pt-7 md:pt-9">
          {erroPermissao && (
            <div className="mb-4 rounded-2xl border border-amber-200/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {erroPermissao}
            </div>
          )}
          {PageComponent && <PageComponent perfil={sessao.user?.perfil} usuarioLogado={sessao.user} />}
        </div>
      </main>
    </div>
  );
}

export default App;
