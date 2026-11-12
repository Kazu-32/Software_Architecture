const { prisma } = require('../../database/prisma');
const emailService = require('../shared/email.service');

/**
 * Camada Service de Restaurantes:
 * Contém regras de negócio e validações de domínio.
 */
class RestaurantService {
  /**
   * Lista restaurantes com suporte a filtros e ordenação.
   */
  async getAll({ category, search, sortBy } = {}) {
    const where = {};

    if (category && category.trim()) {
      where.category = category.trim();
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { category: { contains: term } },
      ];
    }

    const orderBy = {};
    if (sortBy === 'rating-desc') {
      orderBy.rating = 'desc';
    } else if (sortBy === 'name-asc') {
      orderBy.name = 'asc';
    } else {
      orderBy.id = 'asc';
    }

    return await prisma.restaurant.findMany({
      where,
      orderBy,
    });
  }

  /**
   * Busca restaurante por ID.
   */
  async getById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Identificador de restaurante inválido');
      error.statusCode = 400;
      throw error;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: numericId },
    });

    if (!restaurant) {
      const error = new Error(`Restaurante com ID ${numericId} não encontrado`);
      error.statusCode = 404;
      throw error;
    }

    return restaurant;
  }

  /**
   * Cria novo restaurante com validação de dados e dispara e-mails de forma independente.
   */
  async create({ name, category, rating, Rating }) {
    const rawRating = rating !== undefined ? rating : Rating;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const error = new Error('O campo "name" é obrigatório e não pode ser vazio');
      error.statusCode = 400;
      throw error;
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      const error = new Error('O campo "category" é obrigatório e não pode ser vazio');
      error.statusCode = 400;
      throw error;
    }

    const parsedRating = parseFloat(rawRating);
    if (isNaN(parsedRating) || parsedRating < 0.0 || parsedRating > 5.0) {
      const error = new Error('A avaliação ("rating") deve ser um número entre 0.0 e 5.0');
      error.statusCode = 400;
      throw error;
    }

    const cleanData = {
      name: name.trim(),
      category: category.trim(),
      rating: parseFloat(parsedRating.toFixed(1)),
    };

    // 1. Operação principal: persistência no banco
    const restaurant = await prisma.restaurant.create({
      data: cleanData,
    });

    const testEmail = process.env.EMAIL_TEST_TO || 'seu_email_de_teste@exemplo.com';

    // 2. Ação secundária 1: Envio de e-mail de boas-vindas
    try {
      await emailService.sendEmail({
        to: testEmail,
        toName: restaurant.name,
        subject: `Bem-vindo à EasyFood, ${restaurant.name}!`,
        header: `Olá, ${restaurant.name}!`,
        body: `
Seu restaurante foi cadastrado com sucesso na EasyFood.<br/>
Categoria: ${restaurant.category}.
`,
        footer: 'Equipe EasyFood',
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error.message);
    }

    // 2. Ação secundária 2: Notificação ao comercial (mesma função sendEmail)
    try {
      await emailService.sendEmail({
        to: testEmail,
        toName: 'Comercial EasyFood',
        subject: `Novo restaurante cadastrado: ${restaurant.name}`,
        header: 'Novo restaurante na plataforma',
        body: `
Nome: ${restaurant.name}<br/>
Categoria: ${restaurant.category}<br/>
Avaliação: ${restaurant.rating}
`,
        footer: 'Notificação automática - EasyFood',
      });
    } catch (error) {
      console.error('Erro ao notificar o comercial:', error.message);
    }

    // 3. Retorno da operação principal (garante independência de falhas de e-mail)
    return restaurant;
  }

  /**
   * Atualiza restaurante existente.
   */
  async update(id, { name, category, rating, Rating }) {
    await this.getById(id);

    const rawRating = rating !== undefined ? rating : Rating;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const error = new Error('O campo "name" é obrigatório');
      error.statusCode = 400;
      throw error;
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      const error = new Error('O campo "category" é obrigatório');
      error.statusCode = 400;
      throw error;
    }

    const parsedRating = parseFloat(rawRating);
    if (isNaN(parsedRating) || parsedRating < 0.0 || parsedRating > 5.0) {
      const error = new Error('A avaliação deve estar entre 0.0 e 5.0');
      error.statusCode = 400;
      throw error;
    }

    const cleanData = {
      name: name.trim(),
      category: category.trim(),
      rating: parseFloat(parsedRating.toFixed(1)),
    };

    return await prisma.restaurant.update({
      where: { id: parseInt(id, 10) },
      data: cleanData,
    });
  }

  /**
   * Remove restaurante.
   */
  async delete(id) {
    await this.getById(id);
    return await prisma.restaurant.delete({
      where: { id: parseInt(id, 10) },
    });
  }
}

module.exports = new RestaurantService();
