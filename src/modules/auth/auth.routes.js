const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('./auth.middleware');
const upload = require('../shared/upload.middleware');

/**
 * Rotas de Autenticação (/auth)
 */
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
router.post(
  '/me/image',
  authMiddleware,
  upload.single('image'),
  (req, res, next) => authController.uploadProfileImage(req, res, next)
);

module.exports = router;
