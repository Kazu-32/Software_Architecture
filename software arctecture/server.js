require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/database/prisma');

/**
 * Camada Server: Liga o servidor HTTP e escuta requisições de rede.
 */
const PORT = (process.env.PORT && process.env.PORT !== '8080') ? Number(process.env.PORT) : 3000;

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`===============================================`);
  console.log(`🚀 Easy Food API - Arquitetura em Camadas`);
  console.log(`📡 Servidor rodando na porta: ${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   - GET    /health`);
  console.log(`   - POST   /auth/register`);
  console.log(`   - POST   /auth/login`);
  console.log(`   - GET    /auth/me (protegido)`);
  console.log(`   - GET    /restaurants (público)`);
  console.log(`   - GET    /restaurants/:id (público)`);
  console.log(`   - POST   /restaurants (protegido)`);
  console.log(`   - PUT    /restaurants/:id (protegido)`);
  console.log(`   - DELETE /restaurants/:id (protegido)`);
  console.log(`   - GET    /restaurants/:restaurantId/dishes (público)`);
  console.log(`   - POST   /restaurants/:restaurantId/dishes (protegido)`);
  console.log(`   - POST   /dishes/:dishId/image (protegido)`);
  console.log(`===============================================`);

  // Testa conexão com o banco MySQL via Prisma
  await testConnection();
});

server.on('error', (error) => {
  console.error('[HTTP Server Error]', error);
});

module.exports = server;
