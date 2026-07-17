const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'cabeleireiro.db'));

const hoje = new Date().toISOString().split('T')[0];
const hojeHora = (h) => `${hoje}T${h}:00.000Z`;

const sqls = [
  // Profissionais (colunas: nome, especialidade, tipo_salao, ativo, comissao_percentual, cargo)
  `INSERT OR IGNORE INTO profissionais (nome, especialidade, tipo_salao, ativo, comissao_percentual, cargo) VALUES ('Carlos Silva', 'Corte Masculino', 'masculino', 1, 45, 'Barbeiro Senior')`,
  `INSERT OR IGNORE INTO profissionais (nome, especialidade, tipo_salao, ativo, comissao_percentual, cargo) VALUES ('Rafael Costa', 'Barba e Corte', 'masculino', 1, 40, 'Barbeiro')`,
  `INSERT OR IGNORE INTO profissionais (nome, especialidade, tipo_salao, ativo, comissao_percentual, cargo) VALUES ('Bruno Lima', 'Pigmentacao e Corte', 'masculino', 1, 38, 'Barbeiro Especialista')`,

  // Serviços (colunas: nome, descricao, preco, duracao_minutos, tipo_salao, ativo)
  `INSERT OR IGNORE INTO servicos (nome, descricao, preco, duracao_minutos, tipo_salao, ativo) VALUES ('Corte Masculino', 'Corte moderno e acabamento', 45.00, 30, 'masculino', 1)`,
  `INSERT OR IGNORE INTO servicos (nome, descricao, preco, duracao_minutos, tipo_salao, ativo) VALUES ('Barba', 'Barba modelada com navalha', 30.00, 20, 'masculino', 1)`,
  `INSERT OR IGNORE INTO servicos (nome, descricao, preco, duracao_minutos, tipo_salao, ativo) VALUES ('Corte + Barba', 'Combo completo premium', 70.00, 50, 'masculino', 1)`,
  `INSERT OR IGNORE INTO servicos (nome, descricao, preco, duracao_minutos, tipo_salao, ativo) VALUES ('Hidratacao Capilar', 'Hidratacao profissional', 55.00, 40, 'masculino', 1)`,
  `INSERT OR IGNORE INTO servicos (nome, descricao, preco, duracao_minutos, tipo_salao, ativo) VALUES ('Pigmentacao', 'Pigmentacao masculina premium', 90.00, 60, 'masculino', 1)`,

  // Clientes (colunas: nome, telefone, whatsapp, tipo_salao, ativo)
  `INSERT OR IGNORE INTO clientes (nome, telefone, whatsapp, tipo_salao, ativo) VALUES ('Joao Mendes', '11988880001', '11988880001', 'masculino', 1)`,
  `INSERT OR IGNORE INTO clientes (nome, telefone, whatsapp, tipo_salao, ativo) VALUES ('Pedro Alves', '11988880002', '11988880002', 'masculino', 1)`,
  `INSERT OR IGNORE INTO clientes (nome, telefone, whatsapp, tipo_salao, ativo) VALUES ('Lucas Rocha', '11988880003', '11988880003', 'masculino', 1)`,
  `INSERT OR IGNORE INTO clientes (nome, telefone, whatsapp, tipo_salao, ativo) VALUES ('Marcos Souza', '11988880004', '11988880004', 'masculino', 1)`,
  `INSERT OR IGNORE INTO clientes (nome, telefone, whatsapp, tipo_salao, ativo) VALUES ('Andre Santos', '11988880005', '11988880005', 'masculino', 1)`,

  // Agendamentos (colunas: cliente_nome, tipo_salao, profissional_id, servico_id, data_hora, status, preco, cliente_id)
  `INSERT INTO agendamentos (cliente_nome, tipo_salao, profissional_id, servico_id, data_hora, status, preco, cliente_id) VALUES ('Joao Mendes', 'masculino', 1, 1, '${hoje} 09:00', 'confirmado', 45.00, 1)`,
  `INSERT INTO agendamentos (cliente_nome, tipo_salao, profissional_id, servico_id, data_hora, status, preco, cliente_id) VALUES ('Pedro Alves', 'masculino', 2, 3, '${hoje} 10:00', 'confirmado', 70.00, 2)`,
  `INSERT INTO agendamentos (cliente_nome, tipo_salao, profissional_id, servico_id, data_hora, status, preco, cliente_id) VALUES ('Lucas Rocha', 'masculino', 1, 2, '${hoje} 11:00', 'pendente', 30.00, 3)`,
  `INSERT INTO agendamentos (cliente_nome, tipo_salao, profissional_id, servico_id, data_hora, status, preco, cliente_id) VALUES ('Marcos Souza', 'masculino', 3, 5, '${hoje} 14:00', 'confirmado', 90.00, 4)`,
  `INSERT INTO agendamentos (cliente_nome, tipo_salao, profissional_id, servico_id, data_hora, status, preco, cliente_id) VALUES ('Andre Santos', 'masculino', 2, 4, '${hoje} 15:30', 'pendente', 55.00, 5)`,

  // Comandas (colunas: cliente_id, cliente_nome, profissional_id, tipo_salao, subtotal, desconto, sinal_pago, valor_total, valor_restante, status, observacoes)
  `INSERT INTO comandas (cliente_id, cliente_nome, profissional_id, tipo_salao, subtotal, desconto, sinal_pago, valor_total, valor_restante, status, observacoes) VALUES (1, 'Joao Mendes', 1, 'masculino', 45.00, 0, 0, 45.00, 0, 'fechada', '')`,
  `INSERT INTO comandas (cliente_id, cliente_nome, profissional_id, tipo_salao, subtotal, desconto, sinal_pago, valor_total, valor_restante, status, observacoes) VALUES (2, 'Pedro Alves', 2, 'masculino', 70.00, 0, 0, 70.00, 0, 'fechada', '')`,
  `INSERT INTO comandas (cliente_id, cliente_nome, profissional_id, tipo_salao, subtotal, desconto, sinal_pago, valor_total, valor_restante, status, observacoes) VALUES (4, 'Marcos Souza', 3, 'masculino', 90.00, 5, 0, 85.00, 0, 'fechada', 'Desconto fidelidade')`,
  `INSERT INTO comandas (cliente_id, cliente_nome, profissional_id, tipo_salao, subtotal, desconto, sinal_pago, valor_total, valor_restante, status, observacoes) VALUES (5, 'Andre Santos', 1, 'masculino', 55.00, 0, 0, 55.00, 0, 'fechada', '')`,

  // Lançamentos de caixa (colunas: tipo, descricao, valor, vencimento, status, tipo_salao)
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Corte Masculino - Joao Mendes', 45.00, '${hoje}', 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Corte + Barba - Pedro Alves', 70.00, '${hoje}', 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Pigmentacao - Marcos Souza', 85.00, '${hoje}', 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Hidratacao - Andre Santos', 55.00, '${hoje}', 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('despesa', 'Reposicao de produtos', 120.00, '${hoje}', 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Corte + Barba - Lucas Rocha', 70.00, date('${hoje}', '-1 day'), 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Corte Masculino', 45.00, date('${hoje}', '-2 days'), 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Barba Simples', 30.00, date('${hoje}', '-2 days'), 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('receita', 'Pigmentacao Premium', 90.00, date('${hoje}', '-3 days'), 'pago', 'masculino')`,
  `INSERT INTO caixa_lancamentos (tipo, descricao, valor, vencimento, status, tipo_salao) VALUES ('despesa', 'Aluguel do salao', 1800.00, date('now', 'start of month', '+1 month'), 'pendente', 'masculino')`,

  // Estoque (colunas: nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo)
  `INSERT OR IGNORE INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo) VALUES ('Pomada Modeladora', 'finalizacao', 15, 5, 12.00, 'masculino', 1)`,
  `INSERT OR IGNORE INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo) VALUES ('Shampoo Profissional', 'lavagem', 8, 3, 18.50, 'masculino', 1)`,
  `INSERT OR IGNORE INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo) VALUES ('Oleo para Barba', 'barba', 2, 4, 22.00, 'masculino', 1)`,
  `INSERT OR IGNORE INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo) VALUES ('Cera Capilar', 'finalizacao', 20, 8, 9.50, 'masculino', 1)`,
  `INSERT OR IGNORE INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo) VALUES ('Tintura Masculina', 'coloracao', 6, 5, 35.00, 'masculino', 1)`,
  `INSERT OR IGNORE INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, custo_unitario, tipo_salao, ativo) VALUES ('Gel Fixador', 'finalizacao', 12, 6, 8.00, 'masculino', 1)`,
];

db.serialize(() => {
  sqls.forEach(sql => {
    db.run(sql, (err) => {
      if (err) console.error('Erro:', err.message, sql.substring(0, 50));
    });
  });

  setTimeout(() => {
    console.log('✅ Dados de demo inseridos com sucesso!');
    db.close();
  }, 1000);
});
