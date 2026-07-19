/* eslint-disable no-console */
const { execFileSync } = require('child_process');
const path = require('path');

const scripts = [
  'auth-regression-test.js',
  'test-clientes.js',
  'test-agenda.js',
  'test-operacao.js',
  'test-estoque.js',
  'test-comissoes.js',
];

for (const script of scripts) {
  console.log(`\n▶ Executando ${script}`);
  execFileSync(process.execPath, [path.join(__dirname, script)], {
    stdio: 'inherit',
    env: process.env,
  });
}

console.log('\n🎉 Suite completa executada com sucesso');
