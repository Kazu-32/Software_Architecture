const restaurantService = require('./restaurant.service');

/**
 * Camada Controller: Responsável pelo protocolo HTTP.
 * Recebe a requisição (req), extrai dados, aciona o Service correspondente
 * e formata a resposta (res) com os devidos códigos de status HTTP.
 */
class RestaurantController {
  /**
   * GET /restaurants
   * Lista restaurantes com suporte a filtros via query string.
   */
  async getAll(req, res, next) {
    try {
      const { category, search, sortBy } = req.query;
      const restaurants = await restaurantService.listRestaurants({ category, search, sortBy });
      return res.status(200).json(restaurants);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /restaurants/:id
   * Retorna os detalhes de um restaurante específico.
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await restaurantService.getRestaurantById(id);
      return res.status(200).json(restaurant);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /restaurants
   * Cria um novo restaurante no sistema.
   */
  async create(req, res, next) {
    try {
      const newRestaurant = await restaurantService.createRestaurant(req.body);
      return res.status(201).json(newRestaurant);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /restaurants/:id
   * Atualiza dados cadastrais de um restaurante.
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedRestaurant = await restaurantService.updateRestaurant(id, req.body);
      return res.status(200).json(updatedRestaurant);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /restaurants/:id
   * Remove um restaurante do sistema.
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await restaurantService.deleteRestaurant(id);
      return res.status(200).json({ message: `Restaurante #${id} removido com sucesso.` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RestaurantController();
