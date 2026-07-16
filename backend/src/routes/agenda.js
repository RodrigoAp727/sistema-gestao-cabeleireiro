const express = require('express');
const db = require('../database');
const router = express.Router();

// Listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'masculino', visao = 'dia', referencia = null, profissional_id = null } = req.query;
    const dataBase = referencia ? new Date(referencia) : new Date();
    const inicio = new Date(dataBase);
    const fim = new Date(dataBase);

    if (visao === 'semana') {
      const diaSemana = inicio.getDay();
      const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
      inicio.setDate(inicio.getDate() + deslocamento);
      fim.setDate(inicio.getDate() + 6);
    } else if (visao === 'mes') {
      inicio.setDate(1);
      fim.setMonth(fim.getMonth() + 1, 0);
    }

    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);

    const inicioISO = inicio.toISOString();
    const fimISO = fim.toISOString();

    const filtros = [tipo_salao, inicioISO, fimISO];
    let filtroProfissional = '';
    if (profissional_id) {
      filtroProfissional = 'AND a.profissional_id = ?';
      filtros.push(profissional_id);
    }

    const agendamentos = await db.all(`
      SELECT a.*, p.nome as profissional_nome, s.nome as servico_nome, s.preco
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      JOIN servicos s ON a.servico_id = s.id
      WHERE a.tipo_salao = ?
        AND a.data_hora BETWEEN ? AND ?
        ${filtroProfissional}
      ORDER BY a.data_hora DESC
    `, filtros);
    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agendar novo
router.post('/', async (req, res) => {
  try {
    const { cliente_nome, cliente_id = null, profissional_id, servico_id, data_hora, tipo_salao = 'masculino' } = req.body;
    
    if (!cliente_nome || cliente_nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    
    if (!profissional_id) {
      return res.status(400).json({ error: 'Profissional é obrigatório' });
    }
    
    if (!servico_id) {
      return res.status(400).json({ error: 'Serviço é obrigatório' });
    }
    
    if (!data_hora) {
      return res.status(400).json({ error: 'Data/hora é obrigatória' });
    }
    
    // Verificar conflito
    const conflito = await db.get(
      `SELECT id FROM agendamentos 
       WHERE profissional_id = ? AND data_hora = ? AND tipo_salao = ? AND status != 'cancelado'`,
      [profissional_id, data_hora, tipo_salao]
    );

    const bloqueio = await db.get(
      `SELECT id FROM agenda_bloqueios
       WHERE profissional_id = ? AND tipo_salao = ? AND ? BETWEEN inicio AND fim`,
      [profissional_id, tipo_salao, data_hora]
    );

    if (conflito || bloqueio) {
      return res.status(400).json({ error: 'Horário indisponível' });
    }

    // Obter preço do serviço
    const servico = await db.get('SELECT preco FROM servicos WHERE id = ?', [servico_id]);
    
    const result = await db.run(
      `INSERT INTO agendamentos (cliente_nome, cliente_id, profissional_id, servico_id, data_hora, tipo_salao, preco)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cliente_nome, cliente_id, profissional_id, servico_id, data_hora, tipo_salao, servico.preco]
    );

    res.status(201).json({ id: result.id, message: 'Agendamento criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirmar agendamento
router.patch('/:id/confirmar', async (req, res) => {
  try {
    await db.run(
      'UPDATE agendamentos SET status = ? WHERE id = ?',
      ['confirmado', req.params.id]
    );
    res.json({ message: 'Agendamento confirmado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar agendamento
router.patch('/:id/cancelar', async (req, res) => {
  try {
    await db.run(
      'UPDATE agendamentos SET status = ? WHERE id = ?',
      ['cancelado', req.params.id]
    );
    res.json({ message: 'Agendamento cancelado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remarcar agendamento
router.patch('/:id/remarcar', async (req, res) => {
  try {
    const { data_hora } = req.body;
    const agendamento = await db.get('SELECT profissional_id, tipo_salao FROM agendamentos WHERE id = ?', [req.params.id]);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const conflito = await db.get(
      `SELECT id FROM agendamentos
       WHERE profissional_id = ? AND data_hora = ? AND tipo_salao = ? AND status != 'cancelado' AND id != ?`,
      [agendamento.profissional_id, data_hora, agendamento.tipo_salao, req.params.id]
    );

    if (conflito) {
      return res.status(400).json({ error: 'Conflito de agenda ao remarcar' });
    }

    await db.run('UPDATE agendamentos SET data_hora = ? WHERE id = ?', [data_hora, req.params.id]);
    res.json({ message: 'Agendamento remarcado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bloquear horário
router.post('/bloqueios', async (req, res) => {
  try {
    const { profissional_id, inicio, fim, motivo, tipo_salao = 'masculino' } = req.body;
    const result = await db.run(
      `INSERT INTO agenda_bloqueios (profissional_id, inicio, fim, motivo, tipo_salao)
       VALUES (?, ?, ?, ?, ?)`,
      [profissional_id, inicio, fim, motivo || null, tipo_salao]
    );

    res.status(201).json({ id: result.id, message: 'Horário bloqueado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bloqueios', async (req, res) => {
  try {
    const { tipo_salao = 'masculino' } = req.query;
    const dados = await db.all(
      `SELECT b.*, p.nome as profissional_nome
       FROM agenda_bloqueios b
       JOIN profissionais p ON p.id = b.profissional_id
       WHERE b.tipo_salao = ?
       ORDER BY b.inicio DESC`,
      [tipo_salao]
    );

    res.json(dados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de espera
router.get('/lista-espera', async (req, res) => {
  try {
    const { tipo_salao = 'masculino' } = req.query;
    const itens = await db.all(
      `SELECT l.*, p.nome as profissional_nome, s.nome as servico_nome
       FROM lista_espera l
       LEFT JOIN profissionais p ON p.id = l.profissional_id
       LEFT JOIN servicos s ON s.id = l.servico_id
       WHERE l.tipo_salao = ? AND l.status = 'pendente'
       ORDER BY l.created_at DESC`,
      [tipo_salao]
    );

    res.json(itens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lista-espera', async (req, res) => {
  try {
    const { cliente_nome, telefone, profissional_id, servico_id, observacao, tipo_salao = 'masculino' } = req.body;
    const result = await db.run(
      `INSERT INTO lista_espera (cliente_nome, telefone, profissional_id, servico_id, observacao, tipo_salao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cliente_nome, telefone || null, profissional_id || null, servico_id || null, observacao || null, tipo_salao]
    );
    res.status(201).json({ id: result.id, message: 'Cliente adicionado à lista de espera' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir bloqueio
router.delete('/bloqueios/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    
    const bloqueio = await db.get('SELECT id FROM agenda_bloqueios WHERE id = ?', [id]);
    if (!bloqueio) return res.status(404).json({ error: 'Bloqueio não encontrado' });
    
    await db.run('DELETE FROM agenda_bloqueios WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Bloqueio excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir da lista de espera
router.delete('/lista-espera/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    
    const item = await db.get('SELECT id FROM lista_espera WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });
    
    await db.run('DELETE FROM lista_espera WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Item removido da lista de espera' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir agendamento permanentemente
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    
    const agendamento = await db.get('SELECT id FROM agendamentos WHERE id = ?', [id]);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' });
    
    await db.run('DELETE FROM agendamentos WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Agendamento excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
