const express = require('express');
const router = express.Router();
const restaurantController = require('./restaurant.controller');

/**
 * Rotas do Módulo de Restaurantes (Easy Food)
 * Padrão RESTful
 */
router.get('/', (req, res, next) => restaurantController.getAll(req, res, next));
router.get('/:id', (req, res, next) => restaurantController.getById(req, res, next));
router.post('/', (req, res, next) => restaurantController.create(req, res, next));
router.put('/:id', (req, res, next) => restaurantController.update(req, res, next));
router.delete('/:id', (req, res, next) => restaurantController.delete(req, res, next));

module.exports = router;
