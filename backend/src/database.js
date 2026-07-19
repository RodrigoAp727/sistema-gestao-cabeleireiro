const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { runMigrations } = require('./migrationRunner');

const DB_PATH = path.join(__dirname, '../data/cabeleireiro.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('Erro ao conectar:', err);
});

const initialize = () => {
  return new Promise((resolve) => {
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

      const getAsync = (sql, params = []) => new Promise((res, rej) => {
        db.get(sql, params, (err, row) => {
          if (err) rej(err);
          else res(row);
        });
      });

      // Tabela de Usuários do Sistema
      db.run(`
        CREATE TABLE IF NOT EXISTS sistema_usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          login TEXT NOT NULL UNIQUE COLLATE NOCASE,
          perfil TEXT NOT NULL,
          senha_hash TEXT NOT NULL,
          profissional_id INTEGER DEFAULT NULL,
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME DEFAULT NULL,
          FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela sistema_usuarios:', err);
      });

      (async () => {
        try {
          const columns = await allAsync(`PRAGMA table_info(sistema_usuarios)`);
          const nomesColunas = (columns || []).map((c) => c.name);
          const alterSQL = [
            { col: 'profissional_id', sql: 'ALTER TABLE sistema_usuarios ADD COLUMN profissional_id INTEGER DEFAULT NULL' },
            { col: 'ativo', sql: 'ALTER TABLE sistema_usuarios ADD COLUMN ativo BOOLEAN DEFAULT 1' },
            { col: 'updated_at', sql: 'ALTER TABLE sistema_usuarios ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP' },
            { col: 'last_login_at', sql: 'ALTER TABLE sistema_usuarios ADD COLUMN last_login_at DATETIME DEFAULT NULL' },
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

          await runMigrations({
            run: runAsync,
            get: getAsync,
            all: allAsync,
            logger: console,
          });

          await runAsync('CREATE INDEX IF NOT EXISTS idx_sistema_usuarios_perfil_ativo ON sistema_usuarios(perfil, ativo)');
          await runAsync('CREATE INDEX IF NOT EXISTS idx_sistema_usuarios_profissional ON sistema_usuarios(profissional_id)');

          const senhaAdmin = String(process.env.AUTH_ADMIN_PASSWORD || '100769');
          const senhaHash = bcrypt.hashSync(senhaAdmin, 10);
          await runAsync(
            `INSERT INTO sistema_usuarios (nome, login, perfil, senha_hash, ativo)
             VALUES (?, ?, ?, ?, 1)
             ON CONFLICT(login) DO UPDATE SET
               nome = excluded.nome,
               perfil = excluded.perfil,
               senha_hash = excluded.senha_hash,
               ativo = 1,
               profissional_id = NULL,
               updated_at = CURRENT_TIMESTAMP`,
            ['Rodrigo Campos', 'Rodrigo Campos', 'administrador', senhaHash]
          );
        } catch (e) {
          console.error('Erro na migração de sistema_usuarios:', e);
        }
      })();

      // Tabela de Profissionais
      db.run(`
        CREATE TABLE IF NOT EXISTS profissionais (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          especialidade TEXT,
          tipo_salao TEXT DEFAULT 'feminino',
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

          // Higienização: manter contexto 100% feminino
          await runAsync(`
            UPDATE profissionais
            SET ativo = 0
            WHERE tipo_salao = 'feminino'
              AND (
                nome IN ('Carlos Silva', 'João Santos', 'Pedro Oliveira')
                OR especialidade LIKE '%Barba%'
              )
          `);
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
          tipo_salao TEXT DEFAULT 'feminino',
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

          // Migração de negócio: salão opera no feminino
          // 1) Migra serviços masculinos para feminino quando não há conflito de nome
          await runAsync(`
            UPDATE servicos
            SET tipo_salao = 'feminino'
            WHERE tipo_salao = 'masculino'
              AND NOT EXISTS (
                SELECT 1
                FROM servicos s2
                WHERE s2.nome = servicos.nome
                  AND s2.tipo_salao = 'feminino'
              )
          `);

          // 2) Se restar conflito (mesmo nome em feminino), desativa o registro masculino
          await runAsync(`
            UPDATE servicos
            SET ativo = 0
            WHERE tipo_salao = 'masculino'
              AND EXISTS (
                SELECT 1
                FROM servicos s2
                WHERE s2.nome = servicos.nome
                  AND s2.tipo_salao = 'feminino'
              )
          `);

          // 3) Higienização: remove serviços tipicamente masculinos do catálogo feminino
          // (podem ter sido migrados em lotes anteriores por troca de tipo_salao)
          await runAsync(`
            UPDATE servicos
            SET ativo = 0
            WHERE tipo_salao = 'feminino'
              AND nome IN (
                'Corte Clássico',
                'Corte Premium',
                'Barba Completa',
                'Barba + Corte',
                'Barba Desenhada',
                'Pintura de Cabelo'
              )
          `);
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
          servicos_json TEXT DEFAULT NULL,
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
          if (!nomesColunas.includes('servicos_json')) {
            await runAsync(`ALTER TABLE agendamentos ADD COLUMN servicos_json TEXT DEFAULT NULL`);
          }

          // Higienização de dados legados: corrige ano truncado em registros de demonstração
          await runAsync(`
            UPDATE agendamentos
            SET data_hora = replace(data_hora, '0226-', '2026-')
            WHERE data_hora LIKE '0226-%'
          `);
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
          ativo BOOLEAN DEFAULT 1,
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
          servico_id INTEGER,
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

      (async () => {
        try {
          const columns = await allAsync(`PRAGMA table_info(comanda_itens)`);
          const nomesColunas = (columns || []).map((c) => c.name);
          if (!nomesColunas.includes('servico_id')) {
            await runAsync(`ALTER TABLE comanda_itens ADD COLUMN servico_id INTEGER`);
          }
        } catch (e) {
          console.error('Erro na migracao de comanda_itens:', e);
        }
      })();

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

      // Vinculo de consumo de insumos por servico
      db.run(`
        CREATE TABLE IF NOT EXISTS servico_insumos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          servico_id INTEGER NOT NULL,
          estoque_item_id INTEGER NOT NULL,
          quantidade_consumo REAL NOT NULL DEFAULT 1,
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(servico_id, estoque_item_id),
          FOREIGN KEY (servico_id) REFERENCES servicos(id),
          FOREIGN KEY (estoque_item_id) REFERENCES estoque_itens(id)
        )
      `, (err) => {
        if (err) console.error('Erro na tabela servico_insumos:', err);
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

      // Indices para performance em consultas recorrentes entre modulos
      db.run(`CREATE INDEX IF NOT EXISTS idx_agendamentos_tipo_data ON agendamentos(tipo_salao, data_hora)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_agendamentos_prof_data ON agendamentos(profissional_id, data_hora)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_comandas_tipo_status_data ON comandas(tipo_salao, status, created_at)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_comandas_cliente ON comandas(cliente_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_comandas_profissional ON comandas(profissional_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda ON comanda_itens(comanda_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_comanda_pagamentos_comanda_data ON comanda_pagamentos(comanda_id, created_at)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_estoque_tipo_ativo ON estoque_itens(tipo_salao, ativo)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_clientes_tipo_ativo_nome ON clientes(tipo_salao, ativo, nome)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_servicos_tipo_ativo_nome ON servicos(tipo_salao, ativo, nome)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_profissionais_tipo_ativo_nome ON profissionais(tipo_salao, ativo, nome)`);

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

          const todosServicos = [...servicosFeminino];
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
