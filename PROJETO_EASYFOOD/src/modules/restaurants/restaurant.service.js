const restaurantRepository = require('./restaurant.repository');

/**
 * Camada Service: Contém todas as regras de negócio e validações de domínio.
 * É completamente agnóstica ao protocolo HTTP (não recebe req nem res).
 */
class RestaurantService {
  /**
   * Lista restaurantes aplicando filtros e regras de ordenação de domínio.
   */
  async listRestaurants(filters = {}) {
    return await restaurantRepository.findAll(filters);
  }

  /**
   * Busca um restaurante por ID garantindo validação do identificador.
   */
  async getRestaurantById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error('Identificador de restaurante inválido');
      error.statusCode = 400;
      throw error;
    }

    const restaurant = await restaurantRepository.findById(numericId);
    if (!restaurant) {
      const error = new Error(`Restaurante com ID ${numericId} não encontrado`);
      error.statusCode = 404;
      throw error;
    }

    return restaurant;
  }

  /**
   * Cria um novo restaurante validando integridade dos dados fornecidos.
   */
  async createRestaurant({ name, category, rating, Rating }) {
    // Tratamento de compatibilidade de nomes de atributos
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

    return await restaurantRepository.create(cleanData);
  }

  /**
   * Atualiza os dados de um restaurante existente.
   */
  async updateRestaurant(id, { name, category, rating, Rating }) {
    // Garante que o restaurante existe antes de atualizar
    await this.getRestaurantById(id);

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

    return await restaurantRepository.update(id, cleanData);
  }

  /**
   * Remove um restaurante.
   */
  async deleteRestaurant(id) {
    await this.getRestaurantById(id);
    return await restaurantRepository.delete(id);
  }
}

module.exports = new RestaurantService();
