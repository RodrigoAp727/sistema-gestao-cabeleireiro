const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');
const { getPaginationParams, clampPagination, formatPaginatedResponse } = require('../pagination');
const router = express.Router();

const formatDateTimeLocalSql = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
};

const parseReferenciaLocal = (referencia) => {
  if (!referencia) return new Date();

  const somenteData = String(referencia).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (somenteData) {
    const [, ano, mes, dia] = somenteData;
    // Meio-dia local evita deslocamentos por fuso quando a referÃªncia vem sem horÃ¡rio
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0, 0);
  }

  const dataParseada = new Date(referencia);
  return Number.isNaN(dataParseada.getTime()) ? new Date() : dataParseada;
};

const obterProfissionalIdAutenticado = (req) => {
  if (req.auth?.perfil !== 'profissional') return null;
  const profissionalId = Number(req.auth?.profissional_id || 0);
  return profissionalId > 0 ? profissionalId : null;
};

// Listar agendamentos
router.get('/', requireRoles(['administrador', 'recepcao', 'profissional']), async (req, res) => {
  try {
    const { tipo_salao = 'feminino', visao = 'dia', referencia = null, profissional_id = null } = req.query;
    const profissionalDoUsuario = obterProfissionalIdAutenticado(req);

    if (req.auth?.perfil === 'profissional' && !profissionalDoUsuario) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar esta área' });
    }

    const filtros = [tipo_salao];
    let filtroPeriodo = '';

    if (visao !== 'todos') {
      const dataBase = parseReferenciaLocal(referencia);
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

      const inicioSql = formatDateTimeLocalSql(inicio);
      const fimSql = formatDateTimeLocalSql(fim);
      filtroPeriodo = 'AND datetime(a.data_hora) BETWEEN datetime(?) AND datetime(?)';
      filtros.push(inicioSql, fimSql);
    }

    let filtroProfissional = '';
    const profissionalForcado = profissionalDoUsuario || profissional_id;
    if (profissionalForcado) {
      filtroProfissional = 'AND a.profissional_id = ?';
      filtros.push(profissionalForcado);
    }

    const agendamentos = await db.all(`
      SELECT a.*, p.nome as profissional_nome, s.nome as servico_nome, s.preco
      FROM agendamentos a
      JOIN profissionais p ON a.profissional_id = p.id
      JOIN servicos s ON a.servico_id = s.id
      WHERE a.tipo_salao = ?
        ${filtroPeriodo}
        ${filtroProfissional}
      ORDER BY datetime(a.data_hora) DESC
    `, filtros);
    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agendar novo
router.post('/', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const {
      cliente_nome,
      cliente_id = null,
      profissional_id,
      servico_id,
      servicos_ids = [],
      itens_agendamento = [],
      data_hora,
      tipo_salao = 'feminino',
    } = req.body;
    
    if (!cliente_nome || cliente_nome.trim() === '') {
      return res.status(400).json({ error: 'Nome do cliente Ã© obrigatÃ³rio' });
    }
    
    const itensNormalizados = [];

    if (Array.isArray(itens_agendamento) && itens_agendamento.length > 0) {
      itens_agendamento.forEach((it) => {
        const pid = Number(it?.profissional_id);
        const sid = Number(it?.servico_id);
        const dataHoraItem = typeof it?.data_hora === 'string' ? it.data_hora.trim() : '';
        if (pid > 0 && sid > 0) {
          itensNormalizados.push({
            profissional_id: pid,
            servico_id: sid,
            data_hora: dataHoraItem || data_hora,
          });
        }
      });
    } else {
      const pid = Number(profissional_id);
      const idsServicos = Array.from(
        new Set(
          [
            ...((Array.isArray(servicos_ids) ? servicos_ids : []).map((id) => Number(id)).filter((id) => id > 0)),
            ...(servico_id ? [Number(servico_id)] : []),
          ].filter((id) => id > 0)
        )
      );

      idsServicos.forEach((sid) => {
        if (pid > 0) itensNormalizados.push({ profissional_id: pid, servico_id: sid, data_hora });
      });
    }

    if (itensNormalizados.length === 0) {
      return res.status(400).json({ error: 'Selecione profissional e serviço' });
    }
    
    const semDataHora = itensNormalizados.some((it) => !it.data_hora || String(it.data_hora).trim() === '');
    if (semDataHora) {
      return res.status(400).json({ error: 'Data/hora é obrigatória para todos os itens' });
    }
    
    const servicosIdsUnicos = Array.from(new Set(itensNormalizados.map((it) => Number(it.servico_id))));
    const profissionaisIdsUnicos = Array.from(new Set(itensNormalizados.map((it) => Number(it.profissional_id))));

    const placeholders = servicosIdsUnicos.map(() => '?').join(',');
    const servicosSelecionados = await db.all(
      `SELECT id, nome, preco
       FROM servicos
       WHERE tipo_salao = ? AND ativo = 1 AND id IN (${placeholders})`,
      [tipo_salao, ...servicosIdsUnicos]
    );

    if (!servicosSelecionados || servicosSelecionados.length === 0) {
      return res.status(400).json({ error: 'Nenhum serviÃ§o vÃ¡lido selecionado' });
    }

    const profPlaceholders = profissionaisIdsUnicos.map(() => '?').join(',');
    const profissionaisSelecionados = await db.all(
      `SELECT id, nome
       FROM profissionais
       WHERE tipo_salao = ? AND ativo = 1 AND id IN (${profPlaceholders})`,
      [tipo_salao, ...profissionaisIdsUnicos]
    );

    if (!profissionaisSelecionados || profissionaisSelecionados.length !== profissionaisIdsUnicos.length) {
      return res.status(400).json({ error: 'Profissional invÃ¡lido para este salÃ£o' });
    }

    const mapaProfissionais = new Map(profissionaisSelecionados.map((p) => [Number(p.id), p.nome]));

    for (const item of itensNormalizados) {
      const pid = Number(item.profissional_id);
      const dataHoraItem = String(item.data_hora);
      const conflito = await db.get(
        `SELECT id FROM agendamentos
         WHERE profissional_id = ? AND data_hora = ? AND tipo_salao = ? AND status != 'cancelado'`,
        [pid, dataHoraItem, tipo_salao]
      );

      const bloqueio = await db.get(
        `SELECT id FROM agenda_bloqueios
         WHERE profissional_id = ? AND tipo_salao = ? AND ? BETWEEN inicio AND fim`,
        [pid, tipo_salao, dataHoraItem]
      );

      if (conflito || bloqueio) {
        const nomeProfissional = mapaProfissionais.get(Number(pid)) || `ID ${pid}`;
        return res.status(400).json({ error: `Horário indisponível para ${nomeProfissional} neste horário` });
      }
    }

    const mapaServicos = new Map(servicosSelecionados.map((s) => [Number(s.id), s]));
    const gruposPorProfissionalHorario = new Map();

    itensNormalizados.forEach((it) => {
      const pid = Number(it.profissional_id);
      const sid = Number(it.servico_id);
      const dataHoraItem = String(it.data_hora);
      const chave = `${pid}|${dataHoraItem}`;
      const grupoAtual = gruposPorProfissionalHorario.get(chave) || { profissional_id: pid, data_hora: dataHoraItem, servicos: [] };
      const servico = mapaServicos.get(sid);
      if (servico) grupoAtual.servicos.push(servico);
      gruposPorProfissionalHorario.set(chave, grupoAtual);
    });

    const idsCriados = [];
    for (const grupo of gruposPorProfissionalHorario.values()) {
      const pid = Number(grupo.profissional_id);
      const dataHoraGrupo = String(grupo.data_hora);
      const listaServicos = grupo.servicos;
      if (!listaServicos || listaServicos.length === 0) continue;

      const precoTotal = listaServicos.reduce((acc, s) => acc + Number(s.preco || 0), 0);
      const servicoPrincipalId = Number(listaServicos[0].id);
      const servicosJson = JSON.stringify(
        listaServicos.map((s) => ({
          id: Number(s.id),
          nome: s.nome,
          preco: Number(s.preco || 0),
        }))
      );

      const result = await db.run(
        `INSERT INTO agendamentos (cliente_nome, cliente_id, profissional_id, servico_id, data_hora, tipo_salao, preco, servicos_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cliente_nome, cliente_id, pid, servicoPrincipalId, dataHoraGrupo, tipo_salao, precoTotal, servicosJson]
      );
      idsCriados.push(result.id);
    }

    if (idsCriados.length === 0) {
      return res.status(400).json({ error: 'Nenhum agendamento foi criado' });
    }

    res.status(201).json({ id: idsCriados[0], ids: idsCriados, message: 'Agendamento criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirmar agendamento
router.patch('/:id/confirmar', requireRoles(['administrador', 'recepcao']), async (req, res) => {
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

// Concluir atendimento
router.patch('/:id/concluir', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID invÃ¡lido' });

    const agendamento = await db.get('SELECT id, status FROM agendamentos WHERE id = ?', [id]);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento nÃ£o encontrado' });
    if (agendamento.status === 'cancelado') {
      return res.status(400).json({ error: 'NÃ£o Ã© possÃ­vel concluir um agendamento cancelado' });
    }

    await db.run('UPDATE agendamentos SET status = ? WHERE id = ?', ['concluido', id]);
    res.json({ ok: true, message: 'Atendimento concluÃ­do' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar agendamento
router.patch('/:id/cancelar', requireRoles(['administrador', 'recepcao']), async (req, res) => {
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
router.patch('/:id/remarcar', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const { data_hora } = req.body;
    const agendamento = await db.get('SELECT profissional_id, tipo_salao FROM agendamentos WHERE id = ?', [req.params.id]);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento nÃ£o encontrado' });

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

// Bloquear horÃ¡rio
router.post('/bloqueios', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const { profissional_id, inicio, fim, motivo, tipo_salao = 'feminino' } = req.body;
    const result = await db.run(
      `INSERT INTO agenda_bloqueios (profissional_id, inicio, fim, motivo, tipo_salao)
       VALUES (?, ?, ?, ?, ?)`,
      [profissional_id, inicio, fim, motivo || null, tipo_salao]
    );

    res.status(201).json({ id: result.id, message: 'HorÃ¡rio bloqueado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bloqueios', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
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
router.get('/lista-espera', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    const pagination = getPaginationParams(req.query);
    const total = await db.get(
      `SELECT COUNT(*) AS total
       FROM lista_espera l
       WHERE l.tipo_salao = ? AND l.status = 'pendente'`,
      [tipo_salao]
    );

    if (!pagination.paginated) {
      const itens = await db.all(
        `SELECT l.*, p.nome as profissional_nome, s.nome as servico_nome
         FROM lista_espera l
         LEFT JOIN profissionais p ON p.id = l.profissional_id
         LEFT JOIN servicos s ON s.id = l.servico_id
         WHERE l.tipo_salao = ? AND l.status = 'pendente'
         ORDER BY l.created_at DESC`,
        [tipo_salao]
      );

      return res.json(itens);
    }

    const normalized = clampPagination({
      page: pagination.page,
      limit: pagination.limit,
      total: Number(total?.total || 0),
    });

    const itens = await db.all(
      `SELECT l.*, p.nome as profissional_nome, s.nome as servico_nome
       FROM lista_espera l
       LEFT JOIN profissionais p ON p.id = l.profissional_id
       LEFT JOIN servicos s ON s.id = l.servico_id
       WHERE l.tipo_salao = ? AND l.status = 'pendente'
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [tipo_salao, normalized.limit, normalized.offset]
    );

    return res.json(formatPaginatedResponse({ items: itens, pagination: normalized }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lista-espera', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const { cliente_nome, telefone, profissional_id, servico_id, observacao, tipo_salao = 'feminino' } = req.body;
    const result = await db.run(
      `INSERT INTO lista_espera (cliente_nome, telefone, profissional_id, servico_id, observacao, tipo_salao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cliente_nome, telefone || null, profissional_id || null, servico_id || null, observacao || null, tipo_salao]
    );
    res.status(201).json({ id: result.id, message: 'Cliente adicionado Ã  lista de espera' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir bloqueio
router.delete('/bloqueios/:id', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID invÃ¡lido' });
    
    const bloqueio = await db.get('SELECT id FROM agenda_bloqueios WHERE id = ?', [id]);
    if (!bloqueio) return res.status(404).json({ error: 'Bloqueio nÃ£o encontrado' });
    
    await db.run('DELETE FROM agenda_bloqueios WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Bloqueio excluÃ­do' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir da lista de espera
router.delete('/lista-espera/:id', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID invÃ¡lido' });
    
    const item = await db.get('SELECT id FROM lista_espera WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item nÃ£o encontrado' });
    
    await db.run('DELETE FROM lista_espera WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Item removido da lista de espera' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir agendamento permanentemente
router.delete('/:id', requireRoles(['administrador', 'recepcao']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return res.status(400).json({ error: 'ID invÃ¡lido' });
    
    const agendamento = await db.get('SELECT id FROM agendamentos WHERE id = ?', [id]);
    if (!agendamento) return res.status(404).json({ error: 'Agendamento nÃ£o encontrado' });
    
    await db.run('DELETE FROM agendamentos WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Agendamento excluÃ­do' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

