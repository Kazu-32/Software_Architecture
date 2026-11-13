const authService = require('./auth.service');

/**
 * Controller de Autenticação:
 * Ponto de entrada das requisições HTTP para registro, login, perfil e avatar.
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

  /**
   * POST /auth/me/image
   * Faz upload, otimiza e vincula a imagem de perfil ao usuário autenticado via JWT
   */
  async uploadProfileImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Nenhuma imagem enviada',
          statusCode: 400,
        });
      }

      const user = await authService.uploadProfileImage(
        req.user.id,
        req.file.buffer
      );

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
