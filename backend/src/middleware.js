/**
 * MIDDLEWARE DE ERRO GLOBAL
 * Consolida tratamento de erros em um único lugar
 */

const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  
  // Validação de entrada
  if (err.message && err.message.includes('é obrigatório')) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message && (
    err.message.includes('deve estar entre') ||
    err.message.includes('deve ser maior que') ||
    err.message.includes('deve ter pelo menos')
  )) {
    return res.status(400).json({ error: err.message });
  }

  // Erro de banco de dados
  if (err.message && err.message.includes('UNIQUE')) {
    return res.status(409).json({ error: 'Registro duplicado - nome já existe' });
  }

  // Erro genérico de banco de dados
  if (err.code) {
    return res.status(500).json({ error: 'Erro ao acessar banco de dados' });
  }

  // Erro genérico
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};
