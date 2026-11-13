const { prisma } = require('../../database/prisma');
const imageService = require('../shared/image.service');

/**
 * Camada Service de Pratos (Cardápio):
 * - createDish: Valida dados e restaurante, cadastra prato no banco
 * - listDishes: Lista os pratos do cardápio de um restaurante
 * - uploadDishImage: Otimiza imagem via imageService e atualiza imageUrl no banco
 */
async function createDish(restaurantId, data = {}) {
  const numericRestaurantId = Number(restaurantId);
  if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
    const error = new Error('Identificador de restaurante inválido');
    error.statusCode = 400;
    throw error;
  }

  const { name, description, price } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    const error = new Error('O campo "name" do prato é obrigatório');
    error.statusCode = 400;
    throw error;
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    const error = new Error('O campo "description" do prato é obrigatório');
    error.statusCode = 400;
    throw error;
  }

  const parsedPrice = Number(price);
  if (price === undefined || price === null || price === '' || isNaN(parsedPrice) || parsedPrice < 0) {
    const error = new Error('O campo "price" deve ser um valor numérico válido maior ou igual a zero');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: numericRestaurantId,
    },
  });

  if (!restaurant) {
    const error = new Error('Restaurante não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const dish = await prisma.dish.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      price: Number(parsedPrice.toFixed(2)),
      restaurantId: numericRestaurantId,
    },
  });

  return dish;
}

async function listDishes(restaurantId) {
  const numericRestaurantId = Number(restaurantId);
  if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
    const error = new Error('Identificador de restaurante inválido');
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: numericRestaurantId,
    },
  });

  if (!restaurant) {
    const error = new Error('Restaurante não encontrado');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.dish.findMany({
    where: {
      restaurantId: numericRestaurantId,
    },
  });
}

async function uploadDishImage(dishId, buffer) {
  const numericDishId = Number(dishId);
  if (!Number.isInteger(numericDishId) || numericDishId <= 0) {
    const error = new Error('Identificador de prato inválido');
    error.statusCode = 400;
    throw error;
  }

  const dish = await prisma.dish.findUnique({
    where: {
      id: numericDishId,
    },
  });

  if (!dish) {
    const error = new Error('Prato não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const previousImageUrl = dish.imageUrl;
  const imageUrl = await imageService.optimizeImage(buffer, 'dishes');

  const updatedDish = await prisma.dish.update({
    where: {
      id: numericDishId,
    },
    data: {
      imageUrl,
    },
  });

  if (previousImageUrl && previousImageUrl !== imageUrl) {
    await imageService.deleteImage(previousImageUrl);
  }

  return updatedDish;
}

module.exports = {
  createDish,
  listDishes,
  uploadDishImage,
};
