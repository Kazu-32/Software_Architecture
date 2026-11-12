const { prisma } = require('../../database/prisma');
const imageService = require('../shared/image.service');

/**
 * Camada Service de Pratos (Cardápio):
 * - createDish: Cadastra um novo prato associado a um restaurante
 * - listDishes: Lista os pratos do cardápio de um restaurante
 * - uploadDishImage: Otimiza imagem via imageService e atualiza imageUrl no banco
 */
async function createDish(restaurantId, data) {
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: Number(restaurantId),
    },
  });

  if (!restaurant) {
    const error = new Error('Restaurante não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const dish = await prisma.dish.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      restaurantId: Number(restaurantId),
    },
  });

  return dish;
}

async function listDishes(restaurantId) {
  return await prisma.dish.findMany({
    where: {
      restaurantId: Number(restaurantId),
    },
  });
}

async function uploadDishImage(dishId, buffer) {
  const dish = await prisma.dish.findUnique({
    where: {
      id: Number(dishId),
    },
  });

  if (!dish) {
    const error = new Error('Prato não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const imageUrl = await imageService.optimizeImage(buffer);

  return await prisma.dish.update({
    where: {
      id: Number(dishId),
    },
    data: {
      imageUrl,
    },
  });
}

module.exports = {
  createDish,
  listDishes,
  uploadDishImage,
};
