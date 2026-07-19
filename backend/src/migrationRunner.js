const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const loadMigrations = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort();

  return files.map((file) => {
    const migration = require(path.join(MIGRATIONS_DIR, file));
    if (!migration || typeof migration.id !== 'string' || typeof migration.up !== 'function') {
      throw new Error(`Migration inválida: ${file}`);
    }

    return {
      id: migration.id,
      name: migration.name || file,
      up: migration.up,
    };
  });
};

const runMigrations = async ({ run, get, all, logger = console }) => {
  await run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedRows = await all('SELECT id FROM schema_migrations');
  const applied = new Set((appliedRows || []).map((row) => row.id));

  const migrations = loadMigrations();

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    logger.log(`🔁 Aplicando migration: ${migration.id} (${migration.name})`);
    try {
      await migration.up({ run, get, all });
      await run(
        'INSERT INTO schema_migrations (id, name) VALUES (?, ?)',
        [migration.id, migration.name]
      );
      logger.log(`✅ Migration aplicada: ${migration.id}`);
    } catch (error) {
      logger.error(`❌ Falha na migration ${migration.id}:`, error.message);
      throw error;
    }
  }
};

module.exports = {
  runMigrations,
};
