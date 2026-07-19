const db = require('../src/database');

db.initialize()
  .then(() => {
    process.stdout.write('✅ Migrations executadas com sucesso\n');
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`❌ Erro ao executar migrations: ${err.message}\n`);
    process.exit(1);
  });
