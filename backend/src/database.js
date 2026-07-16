const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/cabeleireiro.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('Erro ao conectar:', err);
});

const initialize = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const runAsync = (sql, params = []) => new Promise((res, rej) => {
        db.run(sql, params, function(err) {
          if (err && !err.message.includes('duplicate column')) rej(err);
          else res();
        });
      });

      const allAsync = (sql, params = []) => new Promise((res, rej) => {
        db.all(sql, params, (err, rows) => {
          if (err) rej(err);
          else res(rows);
        });
      });

      // Tabela de Profissionais
      db.run(`
        CREATE TABLE IF NOT EXISTS profissionais (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          especialidade TEXT,
          tipo_salao TEXT DEFAULT 'masculino',
          profissional_fornece_produtos BOOLEAN DEFAULT 0,
          comissao_percentual REAL DEFAULT NULL,
          cargo TEXT DEFAULT NULL,
          horario_trabalho TEXT DEFAULT NULL,
          salario REAL DEFAULT NULL,
          vale_transporte REAL DEFAULT NULL,
          bonificacao REAL DEFAULT NULL,
          dias_trabalho TEXT DEFAULT NULL,
          nivel_acesso TEXT DEFAULT 'profissional',
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(nome, tipo_salao)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela profissionais:', err);
      });

      // Migração leve para bases já existentes
      (async () => {
        try {
          const columns = await allAsync(`PRAGMA table_info(profissionais)`);
          const nomesColunas = (columns || []).map((c) => c.name);

          const alterSQL = [
            { col: 'profissional_fornece_produtos', sql: 'ALTER TABLE profissionais ADD COLUMN profissional_fornece_produtos BOOLEAN DEFAULT 0' },
            { col: 'comissao_percentual', sql: 'ALTER TABLE profissionais ADD COLUMN comissao_percentual REAL DEFAULT NULL' },
            { col: 'cargo', sql: 'ALTER TABLE profissionais ADD COLUMN cargo TEXT DEFAULT NULL' },
            { col: 'horario_trabalho', sql: 'ALTER TABLE profissionais ADD COLUMN horario_trabalho TEXT DEFAULT NULL' },
            { col: 'salario', sql: 'ALTER TABLE profissionais ADD COLUMN salario REAL DEFAULT NULL' },
            { col: 'vale_transporte', sql: 'ALTER TABLE profissionais ADD COLUMN vale_transporte REAL DEFAULT NULL' },
            { col: 'bonificacao', sql: 'ALTER TABLE profissionais ADD COLUMN bonificacao REAL DEFAULT NULL' },
            { col: 'dias_trabalho', sql: 'ALTER TABLE profissionais ADD COLUMN dias_trabalho TEXT DEFAULT NULL' },
            { col: 'nivel_acesso', sql: 'ALTER TABLE profissionais ADD COLUMN nivel_acesso TEXT DEFAULT \'profissional\'' },
          ];

          for (const { col, sql } of alterSQL) {
            if (!nomesColunas.includes(col)) {
              try {
                await runAsync(sql);
              } catch (e) {
                if (!e.message.includes('duplicate column')) console.error(`Erro ao add ${col}:`, e);
              }
            }
          }
        } catch (e) {
          console.error('Erro na migração de profissionais:', e);
        }
      })();

      // Tabela de Serviços
      db.run(`
        CREATE TABLE IF NOT EXISTS servicos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          descricao TEXT,
          preco REAL NOT NULL,
          duracao_minutos INTEGER DEFAULT 30,
          tipo_salao TEXT DEFAULT 'masculino',
          comissao_tipo TEXT DEFAULT 'percentual',
          comissao_valor REAL DEFAULT NULL,
          precisa_auxiliar BOOLEAN DEFAULT 0,
          orientacoes_cliente TEXT DEFAULT NULL,
          variacao_preco_json TEXT DEFAULT NULL,
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(nome, tipo_salao)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela servicos:', err);
      });

      (async () => {
        try {
          const columns = await allAsync(`PRAGMA table_info(servicos)`);
          const nomesColunas = (columns || []).map((c) => c.name);
          const alterSQL = [
            { col: 'comissao_tipo', sql: 'ALTER TABLE servicos ADD COLUMN comissao_tipo TEXT DEFAULT \'percentual\'' },
            { col: 'comissao_valor', sql: 'ALTER TABLE servicos ADD COLUMN comissao_valor REAL DEFAULT NULL' },
            { col: 'precisa_auxiliar', sql: 'ALTER TABLE servicos ADD COLUMN precisa_auxiliar BOOLEAN DEFAULT 0' },
            { col: 'orientacoes_cliente', sql: 'ALTER TABLE servicos ADD COLUMN orientacoes_cliente TEXT DEFAULT NULL' },
            { col: 'variacao_preco_json', sql: 'ALTER TABLE servicos ADD COLUMN variacao_preco_json TEXT DEFAULT NULL' },
          ];
          for (const { col, sql } of alterSQL) {
            if (!nomesColunas.includes(col)) {
              try { await runAsync(sql); } catch (e) {
                if (!e.message.includes('duplicate column')) console.error(`Erro ${col}:`, e);
              }
            }
          }
        } catch (e) {
          console.error('Erro na migração de servicos:', e);
        }
      })();

      // Tabela de Agendamentos
      db.run(`
        CREATE TABLE IF NOT EXISTS agendamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cliente_nome TEXT NOT NULL,
          cliente_id INTEGER DEFAULT NULL,
          tipo_salao TEXT DEFAULT 'masculino',
          profissional_id INTEGER NOT NULL,
          servico_id INTEGER NOT NULL,
          data_hora DATETIME NOT NULL,
          status TEXT DEFAULT 'agendado',
          preco REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profissional_id) REFERENCES profissionais(id),
          FOREIGN KEY (servico_id) REFERENCES servicos(id),
          FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela agendamentos:', err);
      });

      (async () => {
        try {
          const columns = await allAsync(`PRAGMA table_info(agendamentos)`);
          const nomesColunas = (columns || []).map((c) => c.name);
          if (!nomesColunas.includes('cliente_id')) {
            await runAsync(`ALTER TABLE agendamentos ADD COLUMN cliente_id INTEGER DEFAULT NULL`);
          }
        } catch (e) {
          console.error('Erro na migração de agendamentos:', e);
        }
      })();

      // Tabela de Clientes
      db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          telefone TEXT,
          whatsapp TEXT,
          data_nascimento TEXT,
          observacoes_cabelo TEXT,
          alergias TEXT,
          historico_quimico TEXT,
          formulas_coloracao TEXT,
          faltas INTEGER DEFAULT 0,
          cancelamentos INTEGER DEFAULT 0,
          tipo_salao TEXT DEFAULT 'masculino',
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Erro na tabela clientes:', err);
      });

      // Tabela de Lista de Espera
      db.run(`
        CREATE TABLE IF NOT EXISTS lista_espera (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cliente_nome TEXT NOT NULL,
          telefone TEXT,
          profissional_id INTEGER,
          servico_id INTEGER,
          observacao TEXT,
          tipo_salao TEXT DEFAULT 'masculino',
          status TEXT DEFAULT 'pendente',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profissional_id) REFERENCES profissionais(id),
          FOREIGN KEY (servico_id) REFERENCES servicos(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela lista_espera:', err);
      });

      // Tabela de Bloqueios de Agenda
      db.run(`
        CREATE TABLE IF NOT EXISTS agenda_bloqueios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profissional_id INTEGER NOT NULL,
          inicio DATETIME NOT NULL,
          fim DATETIME NOT NULL,
          motivo TEXT,
          tipo_salao TEXT DEFAULT 'masculino',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela agenda_bloqueios:', err);
      });

      // Tabela de Comandas
      db.run(`
        CREATE TABLE IF NOT EXISTS comandas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cliente_id INTEGER,
          cliente_nome TEXT NOT NULL,
          profissional_id INTEGER,
          auxiliar_nome TEXT,
          tipo_salao TEXT DEFAULT 'masculino',
          subtotal REAL DEFAULT 0,
          desconto REAL DEFAULT 0,
          sinal_pago REAL DEFAULT 0,
          valor_total REAL DEFAULT 0,
          valor_restante REAL DEFAULT 0,
          status TEXT DEFAULT 'aberta',
          observacoes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id),
          FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela comandas:', err);
      });

      // Tabela de Itens da Comanda
      db.run(`
        CREATE TABLE IF NOT EXISTS comanda_itens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comanda_id INTEGER NOT NULL,
          tipo_item TEXT DEFAULT 'servico',
          descricao TEXT NOT NULL,
          quantidade REAL DEFAULT 1,
          valor_unitario REAL DEFAULT 0,
          total REAL DEFAULT 0,
          FOREIGN KEY (comanda_id) REFERENCES comandas(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela comanda_itens:', err);
      });

      // Tabela de Pagamentos da Comanda
      db.run(`
        CREATE TABLE IF NOT EXISTS comanda_pagamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comanda_id INTEGER NOT NULL,
          forma_pagamento TEXT NOT NULL,
          valor REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comanda_id) REFERENCES comandas(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela comanda_pagamentos:', err);
      });

      // Tabela de Estoque
      db.run(`
        CREATE TABLE IF NOT EXISTS estoque_itens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          categoria TEXT DEFAULT 'uso_interno',
          quantidade REAL DEFAULT 0,
          estoque_minimo REAL DEFAULT 0,
          validade TEXT,
          custo_unitario REAL DEFAULT 0,
          tipo_salao TEXT DEFAULT 'masculino',
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Erro na tabela estoque_itens:', err);
      });

      // Lançamentos de caixa (entradas/saídas/despesas/contas)
      db.run(`
        CREATE TABLE IF NOT EXISTS caixa_lancamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT NOT NULL,
          descricao TEXT NOT NULL,
          valor REAL NOT NULL,
          vencimento TEXT,
          status TEXT DEFAULT 'aberto',
          tipo_salao TEXT DEFAULT 'masculino',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Erro na tabela caixa_lancamentos:', err);
      });

      // Configurações por salão (comissão padrão, etc.)
      db.run(`
        CREATE TABLE IF NOT EXISTS configuracoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo_salao TEXT NOT NULL,
          chave TEXT NOT NULL,
          valor TEXT NOT NULL,
          descricao TEXT,
          UNIQUE(tipo_salao, chave)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela configuracoes:', err);
      });

      // Fotos antes/depois do cliente
      db.run(`
        CREATE TABLE IF NOT EXISTS cliente_fotos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cliente_id INTEGER NOT NULL,
          tipo TEXT DEFAULT 'antes',
          url TEXT NOT NULL,
          descricao TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela cliente_fotos:', err);
      });

      // Popular configurações padrão (idempotente)
      const configsPadrao = [
        { tipo_salao: 'masculino', chave: 'comissao_salao_fornece',         valor: '35', descricao: 'Comissão % quando o salão fornece produtos' },
        { tipo_salao: 'masculino', chave: 'comissao_profissional_fornece',  valor: '55', descricao: 'Comissão % quando o profissional fornece produtos' },
        { tipo_salao: 'feminino',  chave: 'comissao_salao_fornece',         valor: '35', descricao: 'Comissão % quando o salão fornece produtos' },
        { tipo_salao: 'feminino',  chave: 'comissao_profissional_fornece',  valor: '55', descricao: 'Comissão % quando o profissional fornece produtos' },
      ];
      configsPadrao.forEach((c) => {
        db.run(
          `INSERT OR IGNORE INTO configuracoes (tipo_salao, chave, valor, descricao) VALUES (?, ?, ?, ?)`,
          [c.tipo_salao, c.chave, c.valor, c.descricao]
        );
      });

      // Verificar se precisa popular dados iniciais
      db.get('SELECT COUNT(*) as count FROM profissionais', (err, row) => {
        if (row.count === 0) {
          // PROFISSIONAIS MASCULINO
          const profissionaisMasculino = [
            { nome: 'Carlos Silva', especialidade: 'Corte Premium', tipo_salao: 'masculino' },
            { nome: 'João Santos', especialidade: 'Barba & Estilo', tipo_salao: 'masculino' },
            { nome: 'Pedro Oliveira', especialidade: 'Coloração', tipo_salao: 'masculino' }
          ];

          // PROFISSIONAIS FEMININO
          const profissionaisFeminino = [
            { nome: 'Ana Silva', especialidade: 'Corte Feminino', tipo_salao: 'feminino' },
            { nome: 'Carla Santos', especialidade: 'Hidratação & Escova', tipo_salao: 'feminino' },
            { nome: 'Beatriz Costa', especialidade: 'Coloração Avançada', tipo_salao: 'feminino' },
            { nome: 'Mariana Lima', especialidade: 'Manicure & Pedicure', tipo_salao: 'feminino' }
          ];

          const todosProfissionais = [...profissionaisMasculino, ...profissionaisFeminino];
          todosProfissionais.forEach(p => {
            db.run(
              'INSERT INTO profissionais (nome, especialidade, tipo_salao) VALUES (?, ?, ?)',
              [p.nome, p.especialidade, p.tipo_salao]
            );
          });

          // SERVIÇOS MASCULINO
          const servicosMasculino = [
            { nome: 'Corte Clássico', preco: 40, duracao_minutos: 30, tipo_salao: 'masculino' },
            { nome: 'Corte Premium', preco: 60, duracao_minutos: 45, tipo_salao: 'masculino' },
            { nome: 'Barba Completa', preco: 35, duracao_minutos: 30, tipo_salao: 'masculino' },
            { nome: 'Barba + Corte', preco: 70, duracao_minutos: 60, tipo_salao: 'masculino' },
            { nome: 'Pintura de Cabelo', preco: 80, duracao_minutos: 60, tipo_salao: 'masculino' },
            { nome: 'Barba Desenhada', preco: 25, duracao_minutos: 20, tipo_salao: 'masculino' }
          ];

          // SERVIÇOS FEMININO
          const servicosFeminino = [
            { nome: 'Corte Feminino', preco: 50, duracao_minutos: 45, tipo_salao: 'feminino' },
            { nome: 'Escova Progressiva', preco: 120, duracao_minutos: 90, tipo_salao: 'feminino' },
            { nome: 'Hidratação', preco: 80, duracao_minutos: 60, tipo_salao: 'feminino' },
            { nome: 'Coloração Completa', preco: 150, duracao_minutos: 120, tipo_salao: 'feminino' },
            { nome: 'Mechas', preco: 180, duracao_minutos: 120, tipo_salao: 'feminino' },
            { nome: 'Alisamento', preco: 140, duracao_minutos: 100, tipo_salao: 'feminino' },
            { nome: 'Manicure Básica', preco: 40, duracao_minutos: 30, tipo_salao: 'feminino' },
            { nome: 'Manicure Gel', preco: 70, duracao_minutos: 45, tipo_salao: 'feminino' },
            { nome: 'Manicure Decorada', preco: 60, duracao_minutos: 45, tipo_salao: 'feminino' },
            { nome: 'Pedicure Básica', preco: 45, duracao_minutos: 40, tipo_salao: 'feminino' },
            { nome: 'Pedicure Gel', preco: 75, duracao_minutos: 50, tipo_salao: 'feminino' },
            { nome: 'Pedicure Decorada', preco: 65, duracao_minutos: 50, tipo_salao: 'feminino' }
          ];

          const todosServicos = [...servicosMasculino, ...servicosFeminino];
          todosServicos.forEach(s => {
            db.run(
              'INSERT INTO servicos (nome, preco, duracao_minutos, tipo_salao) VALUES (?, ?, ?, ?)',
              [s.nome, s.preco, s.duracao_minutos, s.tipo_salao]
            );
          });
        }

        resolve();
      });
    });
  });
};

module.exports = {
  db,
  initialize,
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};
