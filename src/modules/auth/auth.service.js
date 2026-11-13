const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../database/prisma');
const imageService = require('../shared/image.service');

const JWT_SECRET = process.env.JWT_SECRET || 'easyfood-super-secret-key-2026';

/**
 * Camada Service de Autenticação:
 * - Cadastro com hashing de senha via bcrypt
 * - Login com validação de credenciais via bcrypt.compare e geração de JWT
 * - Perfil do usuário autenticado (/auth/me)
 * - Upload e otimização de imagem de perfil (/auth/me/image)
 */
class AuthService {
  /**
   * Realiza o cadastro de um novo usuário com senha hasheada.
   */
  async register({ name, email, password }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const error = new Error('O campo "name" é obrigatório');
      error.statusCode = 400;
      throw error;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const error = new Error('O campo "email" deve ser um e-mail válido');
      error.statusCode = 400;
      throw error;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      const error = new Error('A senha deve possuir no mínimo 6 caracteres');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const error = new Error('Já existe um usuário cadastrado com este e-mail');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Autentica o usuário, compara hash com bcrypt.compare e devolve token JWT.
   */
  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('E-mail e senha são obrigatórios');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl || null,
      },
    };
  }

  /**
   * Busca as informações do perfil do usuário autenticado.
   */
  async getProfile(userId) {
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Identificador de usuário inválido');
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: numericId },
    });

    if (!user) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Otimiza e vincula uma foto ao perfil do usuário autenticado.
   */
  async uploadProfileImage(userId, buffer) {
    const numericId = parseInt(userId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Identificador de usuário inválido');
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: numericId },
    });

    if (!user) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      throw error;
    }

    const previousImageUrl = user.imageUrl;
    const imageUrl = await imageService.optimizeImage(buffer, 'users');

    const updatedUser = await prisma.user.update({
      where: { id: numericId },
      data: { imageUrl },
    });

    if (previousImageUrl && previousImageUrl !== imageUrl) {
      await imageService.deleteImage(previousImageUrl);
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      imageUrl: updatedUser.imageUrl || null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}

module.exports = new AuthService();
