const express = require('express');
const router = express.Router();
const dishController = require('./dish.controller');
const authMiddleware = require('../auth/auth.middleware');
const upload = require('../shared/upload.middleware');

/**
 * Rotas de Pratos (Cardápio):
 * - GET /restaurants/:restaurantId/dishes: Consulta pública do cardápio
 * - POST /restaurants/:restaurantId/dishes: Cadastro de prato (protegido por JWT)
 * - POST /dishes/:dishId/image: Upload de imagem do prato (protegido por JWT, processado com Multer/Sharp)
 */
router.get(
  '/restaurants/:restaurantId/dishes',
  dishController.list
);

router.post(
  '/restaurants/:restaurantId/dishes',
  authMiddleware,
  dishController.create
);

router.post(
  '/dishes/:dishId/image',
  authMiddleware,
  upload.single('image'),
  dishController.uploadImage
);

module.exports = router;
