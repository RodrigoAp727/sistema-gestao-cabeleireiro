/* eslint-disable no-console */
const BASE_URL = process.env.AUTH_TEST_BASE_URL || 'http://localhost:3010';

class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookie = '';
  }

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.cookie) {
      headers.Cookie = this.cookie;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookie = setCookie.split(';')[0];
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { status: response.status, data };
  }
}

const assertStatus = (name, actual, expected) => {
  if (actual !== expected) {
    throw new Error(`${name} falhou: esperado ${expected}, obtido ${actual}`);
  }
  console.log(`✅ ${name}`);
};

const unique = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const run = async () => {
  const master = new HttpClient(BASE_URL);

  const masterLogin = await master.request('POST', '/api/auth/login', {
    login: 'Rodrigo Campos',
    senha: '100769',
  });
  assertStatus('Login mestre', masterLogin.status, 200);

  const masterSession = await master.request('GET', '/api/auth/session');
  assertStatus('Sessão mestre', masterSession.status, 200);
  const masterId = masterSession?.data?.user?.id;
  if (!masterId) {
    throw new Error('ID do mestre não retornado em /api/auth/session');
  }

  const users = {
    admin: {
      nome: unique('Admin API'),
      login: unique('admin_api'),
      senha: 'Senha@123',
      perfil: 'administrador',
    },
    recepcao: {
      nome: unique('Recepcao API'),
      login: unique('recepcao_api'),
      senha: 'Senha@123',
      perfil: 'recepcao',
    },
    profissional: {
      nome: unique('Profissional API'),
      login: unique('prof_api'),
      senha: 'Senha@123',
      perfil: 'profissional',
    },
  };

  const profissionaisResp = await master.request('GET', '/api/profissionais?tipo_salao=feminino');
  assertStatus('Listar profissionais para vínculo', profissionaisResp.status, 200);
  const profissionaisAtivos = (profissionaisResp.data || []).filter((p) => Number(p.ativo) === 1);
  if (!profissionaisAtivos.length) {
    throw new Error('Nenhum profissional ativo disponível para criar usuário profissional');
  }
  users.profissional.profissional_id = profissionaisAtivos[0].id;

  const createAdmin = await master.request('POST', '/api/usuarios', users.admin);
  assertStatus('Criar usuário administrador comum', createAdmin.status, 201);

  const createRecepcao = await master.request('POST', '/api/usuarios', users.recepcao);
  assertStatus('Criar usuário recepção', createRecepcao.status, 201);

  const createProfissional = await master.request('POST', '/api/usuarios', users.profissional);
  assertStatus('Criar usuário profissional', createProfissional.status, 201);

  const userList = await master.request('GET', '/api/usuarios');
  assertStatus('Listar usuários após criação', userList.status, 200);

  const adminRow = (userList.data || []).find((u) => u.login === users.admin.login);
  const recepcaoRow = (userList.data || []).find((u) => u.login === users.recepcao.login);
  const profissionalRow = (userList.data || []).find((u) => u.login === users.profissional.login);

  if (!adminRow || !recepcaoRow || !profissionalRow) {
    throw new Error('Nem todos os usuários de teste foram encontrados após criação');
  }

  const adminClient = new HttpClient(BASE_URL);
  const recepcaoClient = new HttpClient(BASE_URL);
  const profissionalClient = new HttpClient(BASE_URL);

  assertStatus(
    'Login administrador comum',
    (await adminClient.request('POST', '/api/auth/login', { login: users.admin.login, senha: users.admin.senha })).status,
    200
  );
  assertStatus(
    'Login recepção',
    (await recepcaoClient.request('POST', '/api/auth/login', { login: users.recepcao.login, senha: users.recepcao.senha })).status,
    200
  );
  assertStatus(
    'Login profissional',
    (await profissionalClient.request('POST', '/api/auth/login', { login: users.profissional.login, senha: users.profissional.senha })).status,
    200
  );

  assertStatus('Admin comum acessa /api/config', (await adminClient.request('GET', '/api/config')).status, 200);
  assertStatus('Admin comum bloqueado em /api/usuarios', (await adminClient.request('GET', '/api/usuarios')).status, 403);

  assertStatus('Recepção acessa /api/clientes', (await recepcaoClient.request('GET', '/api/clientes')).status, 200);
  assertStatus('Recepção bloqueada em /api/estoque', (await recepcaoClient.request('GET', '/api/estoque')).status, 403);
  assertStatus('Recepção bloqueada em /api/usuarios', (await recepcaoClient.request('GET', '/api/usuarios')).status, 403);

  assertStatus('Profissional acessa /api/comissoes', (await profissionalClient.request('GET', '/api/comissoes')).status, 200);
  assertStatus('Profissional bloqueado em /api/caixa', (await profissionalClient.request('GET', '/api/caixa')).status, 403);
  assertStatus('Profissional bloqueado em /api/usuarios', (await profissionalClient.request('GET', '/api/usuarios')).status, 403);

  assertStatus(
    'Admin comum não consegue editar mestre',
    (await adminClient.request('PUT', `/api/usuarios/${masterId}`, {
      nome: 'Rodrigo Campos',
      login: 'Rodrigo Campos',
      perfil: 'administrador',
      ativo: true,
    })).status,
    403
  );
  assertStatus(
    'Admin comum não consegue desativar mestre',
    (await adminClient.request('DELETE', `/api/usuarios/${masterId}`)).status,
    403
  );

  assertStatus('Mestre desativa usuário recepção', (await master.request('DELETE', `/api/usuarios/${recepcaoRow.id}`)).status, 200);

  assertStatus(
    'Sessão do usuário desativado é invalidada',
    (await recepcaoClient.request('GET', '/api/auth/session')).status,
    401
  );

  console.log('\n🎉 Auth regression concluído com sucesso');
};

run().catch((error) => {
  console.error(`\n❌ Falha no auth-regression-test: ${error.message}`);
  process.exit(1);
});
