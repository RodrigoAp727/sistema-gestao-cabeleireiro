const express = require('express');

const router = express.Router();

const templates = {
  confirmacao: 'Olá {{nome}}, seu horário está confirmado para {{data}} às {{hora}}. Estúdio Valdo Santos.',
  lembrete: 'Olá {{nome}}, lembrete do seu atendimento em {{data}} às {{hora}}. Esperamos você.',
  antes: 'Olá {{nome}}, seguem as orientações antes do procedimento: {{texto}}',
  depois: 'Olá {{nome}}, orientações pós-procedimento: {{texto}}',
  aniversario: 'Parabéns, {{nome}}. Que seu dia seja maravilhoso. Temos um mimo especial para você.',
  promocao: 'Olá {{nome}}, promoção especial desta semana: {{texto}}',
  recibo: 'Recibo do atendimento de {{data}}. Valor: {{valor}}. Obrigado pela preferência.',
};

router.get('/templates', async (_req, res) => {
  res.json(templates);
});

router.post('/gerar-link', async (req, res) => {
  try {
    const { telefone, tipo = 'confirmacao', variaveis = {} } = req.body;
    const numero = String(telefone || '').replace(/\D/g, '');
    if (numero.length < 10) {
      return res.status(400).json({ error: 'Telefone invalido. Informe DDD e numero.' });
    }

    const base = templates[tipo] || templates.confirmacao;

    const texto = Object.keys(variaveis).reduce((acc, chave) => {
      return acc.replaceAll(`{{${chave}}}`, String(variaveis[chave]));
    }, base);

    const link = `https://wa.me/55${numero}?text=${encodeURIComponent(texto)}`;

    res.json({ link, texto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
