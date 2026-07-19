/* eslint-disable no-console */
const db = require('../src/database');

const BASE_URL = process.env.AUTH_TEST_BASE_URL || 'http://localhost:3010';
const TEST_PREFIX = 'AAA [TESTE]';

class HttpClient {
  constructor(baseUrl = BASE_URL) {
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

    return { status: response.status, data, response };
  }
}

const unique = (suffix) => `${TEST_PREFIX} ${suffix} ${Date.now()} ${Math.floor(Math.random() * 1000)}`;

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertStatus = (name, actual, expected) => {
  if (actual !== expected) {
    throw new Error(`${name} falhou: esperado ${expected}, obtido ${actual}`);
  }
  console.log(`✅ ${name}`);
};

const approxEqual = (name, actual, expected, tolerance = 0.01) => {
  if (Math.abs(Number(actual) - Number(expected)) > tolerance) {
    throw new Error(`${name} falhou: esperado ${expected}, obtido ${actual}`);
  }
  console.log(`✅ ${name}`);
};

const extractItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return Array.isArray(payload?.items) ? payload.items : [];
};

const extractTotal = (payload, items = []) => {
  if (Array.isArray(payload)) {
    return items.length;
  }
  return Number(payload?.total || items.length);
};

const formatLocalSqlDateTime = (date) => {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 19).replace('T', ' ');
};

const createMasterClient = async () => {
  const client = new HttpClient(BASE_URL);
  const login = await client.request('POST', '/api/auth/login', {
    login: 'Rodrigo Campos',
    senha: '100769',
  });
  assertStatus('Login mestre', login.status, 200);
  return client;
};

const cleanupWhereLike = async (table, column, prefix) => {
  await db.run(`DELETE FROM ${table} WHERE ${column} LIKE ?`, [`${prefix}%`]);
};

const cleanupById = async (table, column, value) => {
  if (value === null || value === undefined || value === '') {
    return;
  }
  await db.run(`DELETE FROM ${table} WHERE ${column} = ?`, [value]);
};

module.exports = {
  BASE_URL,
  TEST_PREFIX,
  HttpClient,
  unique,
  assert,
  assertStatus,
  approxEqual,
  extractItems,
  extractTotal,
  formatLocalSqlDateTime,
  createMasterClient,
  cleanupWhereLike,
  cleanupById,
  db,
};
