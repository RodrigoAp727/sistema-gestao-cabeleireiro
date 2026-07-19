const express = require('express');
const db = require('../database');
const { requireRoles } = require('../middleware');

const router = express.Router();

router.use(requireRoles(['administrador']));

// GET /api/config?tipo_salao=...
// Retorna as configuraÃ§Ãµes do salÃ£o
router.get('/', async (req, res) => {
  try {
    const { tipo_salao = 'feminino' } = req.query;
    
    if (!tipo_salao || typeof tipo_salao !== 'string') {
      return res.status(400).json({ error: 'tipo_salao Ã© obrigatÃ³rio' });
    }
    
    const configs = await db.all(
      'SELECT chave, valor, descricao FROM configuracoes WHERE tipo_salao = ? ORDER BY chave',
      [tipo_salao]
    );
    
    // Transforma em objeto chave: valor
    const resultado = {};
    for (const c of configs) {
      resultado[c.chave] = { valor: c.valor, descricao: c.descricao };
    }
    
    res.json({ ok: true, tipo_salao, configuracoes: resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/config
// { tipo_salao, chave, valor }
router.put('/', async (req, res) => {
  try {
    const { tipo_salao, chave, valor } = req.body;

    if (!tipo_salao || !chave || valor === undefined) {
      return res.status(400).json({ error: 'tipo_salao, chave e valor sÃ£o obrigatÃ³rios' });
    }

    // Valida valores numÃ©ricos para comissÃ£o
    if (chave.startsWith('comissao_')) {
      const num = Number(valor);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ error: 'Percentual de comissÃ£o deve ser entre 0 e 100' });
      }
    }

    await db.run(
      `INSERT INTO configuracoes (tipo_salao, chave, valor)
       VALUES (?, ?, ?)
       ON CONFLICT(tipo_salao, chave) DO UPDATE SET valor = excluded.valor`,
      [tipo_salao, chave, String(valor)]
    );

    res.json({ ok: true, tipo_salao, chave, valor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

