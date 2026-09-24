const express = require('express');
const cors = require('cors');

// Importação das rotas dos módulos (Monolito Modular)
const restaurantRoutes = require('./modules/restaurants/restaurant.routes');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Verificação de saúde da aplicação
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Registro dos Módulos do Sistema
app.use('/restaurants', restaurantRoutes);

// Middleware centralizado de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[App Error]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno no servidor';

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
