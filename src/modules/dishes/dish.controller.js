const dishService = require('./dish.service');

/**
 * Camada Controller de Pratos:
 * Lida com as requisições HTTP para criação, listagem e upload de fotos de pratos.
 */
async function create(req, res) {
  try {
    const { restaurantId } = req.params;
    const dish = await dishService.createDish(restaurantId, req.body);
    return res.status(201).json(dish);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : 'Erro interno ao cadastrar prato',
      statusCode: error.statusCode || 500,
    });
  }
}

async function list(req, res) {
  try {
    const { restaurantId } = req.params;
    const dishes = await dishService.listDishes(restaurantId);
    return res.status(200).json(dishes);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : 'Erro ao consultar pratos',
      statusCode: error.statusCode || 500,
    });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhuma imagem enviada',
        statusCode: 400,
      });
    }

    const dish = await dishService.uploadDishImage(
      req.params.dishId,
      req.file.buffer
    );

    return res.status(200).json(dish);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : 'Erro ao processar imagem',
      statusCode: error.statusCode || 500,
    });
  }
}

module.exports = {
  create,
  list,
  uploadImage,
};
