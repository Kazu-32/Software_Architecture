const authService = require('./auth.service');

/**
 * Controller de Autenticação:
 * Ponto de entrada das requisições HTTP para registro, login e perfil.
 */
class AuthController {
  /**
   * POST /auth/register
   * Cadastra novo usuário
   */
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   * Autentica usuário e devolve token JWT
   */
  async login(req, res, next) {
    try {
      const data = await authService.login(req.body);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   * Retorna os dados do usuário autenticado (protegido por token)
   */
  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
