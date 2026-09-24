// Redirecionamento de compatibilidade para a nova estrutura modular
const { pool, testConnection } = require('./src/config/database');

module.exports = {
  db: pool,
  pool,
  testConnection,
};
