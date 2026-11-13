const express = require('express');
const router = express.Router();
const restaurantController = require('./restaurant.controller');
const authMiddleware = require('../auth/auth.middleware');

/**
 * Rotas de Restaurantes (/restaurants)
 * - GET /restaurants: Público (qualquer usuário pode listar)
 * - GET /restaurants/:id: Público (qualquer usuário pode visualizar detalhes)
 * - POST /restaurants: Protegido (exige token JWT no cabeçalho Authorization: Bearer <token>)
 * - PUT /restaurants/:id: Protegido (exige token JWT)
 * - DELETE /restaurants/:id: Protegido (exige token JWT)
 */
router.get('/', (req, res, next) => restaurantController.getAll(req, res, next));
router.get('/:id', (req, res, next) => restaurantController.getById(req, res, next));

// Rotas protegidas por autenticação
router.post('/', authMiddleware, (req, res, next) => restaurantController.create(req, res, next));
router.put('/:id', authMiddleware, (req, res, next) => restaurantController.update(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => restaurantController.delete(req, res, next));

module.exports = router;
