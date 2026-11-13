const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'easyfood-super-secret-key-2026';

/**
 * Middleware de Autenticação JWT:
 * Intercepta requisições para rotas protegidas.
 * Exige cabeçalho: Authorization: Bearer <token>
 * Se ausente ou inválido -> retorna 401 Unauthorized.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido',
      statusCode: 401,
    });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Formato de token inválido. Esperado: Bearer <token>',
      statusCode: 401,
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Token inválido ou expirado',
      statusCode: 401,
    });
  }
}

module.exports = authMiddleware;
