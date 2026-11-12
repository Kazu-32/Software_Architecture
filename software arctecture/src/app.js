const express = require('express');
const cors = require('cors');
const path = require('path');

// Módulos da aplicação
const authRoutes = require('./modules/auth/auth.routes');
const restaurantRoutes = require('./modules/restaurants/restaurant.routes');
const dishRoutes = require('./modules/dishes/dish.routes');

/**
 * Configuração central da aplicação Express
 */
const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Arquivos estáticos do frontend CSR (public/index.html)
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Disponibiliza as imagens otimizadas geradas pelo upload
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'))
);

// Verificação de saúde da aplicação
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Registro dos módulos do sistema
app.use('/auth', authRoutes);
app.use('/restaurants', restaurantRoutes);
app.use(dishRoutes);

// Fallback para a interface web (index.html) para rotas do navegador
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/restaurants') ||
    req.path.startsWith('/dishes') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/uploads') ||
    req.path === '/health'
  ) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Middleware centralizado de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[App Error]', err);

  // Tratamento específico para erros do Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Arquivo muito grande. O limite máximo permitido é de 5 MB.',
      statusCode: 413,
    });
  }

  if (err.message === 'Formato de imagem não permitido') {
    return res.status(400).json({
      error: err.message,
      statusCode: 400,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno no servidor';

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
