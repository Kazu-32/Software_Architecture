require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Inicializa o servidor HTTP
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`===============================================`);
  console.log(`🚀 Easy Food API (Monolito Modular CSR)`);
  console.log(`📡 Servidor rodando na porta: ${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   - GET    /health`);
  console.log(`   - GET    /restaurants`);
  console.log(`   - GET    /restaurants/:id`);
  console.log(`   - POST   /restaurants`);
  console.log(`   - PUT    /restaurants/:id`);
  console.log(`   - DELETE /restaurants/:id`);
  console.log(`===============================================`);

  // Testa conectividade com o MySQL de forma não-bloqueante
  await testConnection();
});

module.exports = server;
