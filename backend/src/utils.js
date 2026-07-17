/**
 * UTILS - Funções compartilhadas de validação e normalização
 * Reduz duplicação de código em todos os routers
 */

const normalizeCommission = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return !isNaN(num) ? num : null;
};

const validateCommission = (value) => {
  if (value === null || value === undefined || value === '') return true;
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 100;
};

const validateRequired = (field, fieldName) => {
  if (!field || (typeof field === 'string' && field.trim() === '')) {
    throw new Error(`${fieldName} é obrigatório`);
  }
};

const validateMinLength = (field, min, fieldName) => {
  if (!field || (typeof field === 'string' && field.trim().length < min)) {
    throw new Error(`${fieldName} deve ter pelo menos ${min} caracteres`);
  }
};

const validatePositive = (field, fieldName) => {
  const num = Number(field);
  if (isNaN(num) || num <= 0) {
    throw new Error(`${fieldName} deve ser maior que 0`);
  }
};

const normalizeBool = (value) => value ? 1 : 0;

const formatMoeda = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const getFieldsFromTable = (table) => {
  const fieldsMap = {
    profissionais: [
      'nome', 'especialidade', 'tipo_salao', 'profissional_fornece_produtos',
      'comissao_percentual', 'cargo', 'horario_trabalho', 'salario',
      'vale_transporte', 'bonificacao', 'dias_trabalho', 'nivel_acesso',
    ],
    servicos: [
      'nome', 'preco', 'duracao_minutos', 'tipo_salao',
      'comissao_tipo', 'comissao_valor', 'precisa_auxiliar',
      'orientacoes_cliente', 'variacao_preco_json',
    ],
    clientes: [
      'nome', 'telefone', 'whatsapp', 'data_nascimento',
      'observacoes_cabelo', 'alergias', 'historico_quimico',
      'formulas_coloracao', 'tipo_salao',
    ],
  };
  return fieldsMap[table] || [];
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  normalizeCommission,
  validateCommission,
  validateRequired,
  validateMinLength,
  validatePositive,
  normalizeBool,
  formatMoeda,
  getFieldsFromTable,
  asyncHandler,
};
