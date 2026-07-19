/* eslint-disable no-console */
const BASE_URL = process.env.AUTH_TEST_BASE_URL || 'http://localhost:3016';
const LOCK_MESSAGE = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
const LOGIN = process.env.AUTH_TEST_LOGIN || 'Rodrigo Campos';
const SENHA_CORRETA = process.env.AUTH_TEST_PASSWORD || '100769';
const SENHA_ERRADA = 'senha_totalmente_errada_123';
const MAX_ATTEMPTS = Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS || 5);
const LOCK_WINDOW_SECONDS = Number(process.env.AUTH_LOGIN_LOCK_WINDOW_SECONDS || 900);

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

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertStatus = (step, actual, expected) => {
  if (actual !== expected) {
    throw new Error(`${step}: esperado ${expected}, obtido ${actual}`);
  }
  console.log(`✅ ${step}`);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const client = new HttpClient(BASE_URL);

  console.log(`\nIniciando teste de força bruta em ${BASE_URL}`);
  console.log(`Configuração ativa: max_attempts=${MAX_ATTEMPTS}, lock_window_seconds=${LOCK_WINDOW_SECONDS}`);

  for (let i = 1; i <= MAX_ATTEMPTS; i += 1) {
    const attempt = await client.request('POST', '/api/auth/login', {
      login: LOGIN,
      senha: SENHA_ERRADA,
    });
    assertStatus(`Tentativa incorreta ${i}/${MAX_ATTEMPTS}`, attempt.status, 401);
  }

  const lockedAttempt = await client.request('POST', '/api/auth/login', {
    login: LOGIN,
    senha: SENHA_ERRADA,
  });
  assertStatus('Bloqueio após exceder tentativas', lockedAttempt.status, 429);
  assert(lockedAttempt.data?.error === LOCK_MESSAGE, 'Mensagem de bloqueio incorreta após excesso de tentativas');
  console.log('✅ Mensagem de bloqueio por usuário validada');

  const blockedEvenWithCorrectPassword = await client.request('POST', '/api/auth/login', {
    login: LOGIN,
    senha: SENHA_CORRETA,
  });
  assertStatus('Senha correta durante bloqueio continua bloqueada', blockedEvenWithCorrectPassword.status, 429);
  assert(blockedEvenWithCorrectPassword.data?.error === LOCK_MESSAGE, 'Mensagem de bloqueio incorreta com senha correta durante bloqueio');
  console.log('✅ Bloqueio persiste mesmo com senha correta durante janela de lock');

  console.log(`Aguardando expiração do bloqueio (${LOCK_WINDOW_SECONDS + 1}s)...`);
  await delay((LOCK_WINDOW_SECONDS + 1) * 1000);

  const loginAfterExpiration = await client.request('POST', '/api/auth/login', {
    login: LOGIN,
    senha: SENHA_CORRETA,
  });
  assertStatus('Login liberado após expiração do bloqueio', loginAfterExpiration.status, 200);

  const wrongAfterSuccess1 = await client.request('POST', '/api/auth/login', {
    login: LOGIN,
    senha: SENHA_ERRADA,
  });
  assertStatus('Falha 1 após login bem-sucedido', wrongAfterSuccess1.status, 401);

  const wrongAfterSuccess2 = await client.request('POST', '/api/auth/login', {
    login: LOGIN,
    senha: SENHA_ERRADA,
  });
  assertStatus('Falha 2 após login bem-sucedido', wrongAfterSuccess2.status, 401);

  const loginAfterTwoMistakes = await client.request('POST', '/api/auth/login', {
    login: LOGIN,
    senha: SENHA_CORRETA,
  });
  assertStatus('Login correto após 2 erros não é bloqueado', loginAfterTwoMistakes.status, 200);

  console.log('\n🎉 Teste prático de força bruta concluído com sucesso');
};

run().catch((error) => {
  console.error(`\n❌ Falha no login-bruteforce-test: ${error.message}`);
  process.exit(1);
});
