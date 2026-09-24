const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Configuração do Pool de Conexões com o MySQL.
 * Lê as variáveis de ambiente fornecidas no .env.
 */
let poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'easy_food_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Se uma URI DATABASE_URL (ex: mysql://user:pass@host:3306/dbname) for fornecida, utilize-a
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')) {
  poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(poolConfig);

/**
 * Função utilitária para testar a conectividade com o banco MySQL
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] Conexão estabelecida com sucesso com o banco: ${poolConfig.database || 'MySQL'}`);
    connection.release();
    return true;
  } catch (error) {
    console.warn(`[MySQL] Aviso de Conexão: Não foi possível conectar ao MySQL (${error.message}).`);
    console.warn(`[MySQL] Certifique-se de preencher o arquivo .env com DB_HOST, DB_USER, DB_PASSWORD e DB_NAME.`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
};
