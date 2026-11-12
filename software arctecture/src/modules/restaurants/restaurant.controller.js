const restaurantService = require('./restaurant.service');

/**
 * Camada Controller de Restaurantes:
 * Lida com requisições HTTP para a rota /restaurants.
 */
class RestaurantController {
  async getAll(req, res, next) {
    try {
      const { category, search, sortBy } = req.query;
      const restaurants = await restaurantService.getAll({ category, search, sortBy });
      return res.status(200).json(restaurants);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await restaurantService.getById(id);
      return res.status(200).json(restaurant);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newRestaurant = await restaurantService.create(req.body);
      return res.status(201).json(newRestaurant);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedRestaurant = await restaurantService.update(id, req.body);
      return res.status(200).json(updatedRestaurant);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await restaurantService.delete(id);
      return res.status(200).json({ message: `Restaurante #${id} removido com sucesso.` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RestaurantController();
