const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

/**
 * Camada Database: Conexão com o Prisma e persistência.
 * Fornece fallback resiliente em memória para as entidades User, Restaurant e Dish
 * caso a base de dados relacional esteja offline no ambiente de execução.
 */

// Armazenamento em memória (Mock) para Usuários
let inMemoryUsers = [];
let nextUserId = 1;

// Armazenamento em memória (Mock) para Restaurantes (docs/database-schema.sql)
let inMemoryRestaurants = [
  { id: 1, name: 'LaPetitosa', category: 'Pizza', rating: 4.5, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: 'Lanchonete do Zé', category: 'Lanches', rating: 5.0, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: 'La Pasta', category: 'Massa', rating: 3.0, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: 'Sushi Imperial', category: 'Japonesa', rating: 4.8, createdAt: new Date(), updatedAt: new Date() },
  { id: 5, name: 'Cantina da Nonna', category: 'Italiana', rating: 4.2, createdAt: new Date(), updatedAt: new Date() },
  { id: 6, name: 'Taco Loco', category: 'Mexicana', rating: 4.0, createdAt: new Date(), updatedAt: new Date() },
  { id: 7, name: 'Sabor Verde', category: 'Vegana', rating: 4.7, createdAt: new Date(), updatedAt: new Date() },
];
let nextRestaurantId = 8;

// Armazenamento em memória (Mock) para Pratos (Dishes)
let inMemoryDishes = [
  {
    id: 1,
    name: 'Pizza Margherita',
    description: 'Molho de tomate, queijo e manjericão',
    price: '49.90',
    imageUrl: null,
    restaurantId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
let nextDishId = 2;

let realPrisma = null;
let isConnected = false;

try {
  realPrisma = new PrismaClient();
} catch (error) {
  console.warn('[Prisma] Não foi possível instanciar PrismaClient nativo:', error.message);
}

// Implementação em memória para Usuários
const inMemoryUserStore = {
  findUnique: async ({ where } = {}) => {
    if (where.email) {
      const email = where.email.toLowerCase().trim();
      const user = inMemoryUsers.find((u) => u.email.toLowerCase() === email);
      return user ? { ...user } : null;
    }
    if (where.id) {
      const id = parseInt(where.id, 10);
      const user = inMemoryUsers.find((u) => u.id === id);
      return user ? { ...user } : null;
    }
    return null;
  },

  findFirst: async ({ where = {} } = {}) => {
    return inMemoryUserStore.findUnique({ where });
  },

  findMany: async () => {
    return inMemoryUsers.map((u) => ({ ...u }));
  },

  create: async ({ data } = {}) => {
    const existing = inMemoryUsers.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase().trim()
    );
    if (existing) {
      const error = new Error('Unique constraint failed on the fields: (`email`)');
      error.code = 'P2002';
      throw error;
    }

    const newUser = {
      id: nextUserId++,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      imageUrl: data.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(newUser);
    return { ...newUser };
  },

  update: async ({ where = {}, data = {} } = {}) => {
    const id = parseInt(where.id, 10);
    const user = inMemoryUsers.find((u) => u.id === id);
    if (!user) {
      const error = new Error(`Usuário não encontrado (id: ${id})`);
      error.code = 'P2025';
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email.toLowerCase().trim();
    if (data.password !== undefined) user.password = data.password;
    if (data.imageUrl !== undefined) user.imageUrl = data.imageUrl;
    user.updatedAt = new Date();
    return { ...user };
  },
};

// Implementação em memória para Restaurantes
const inMemoryRestaurantStore = {
  findMany: async ({ where = {}, orderBy = {} } = {}) => {
    let result = [...inMemoryRestaurants];

    if (where.category) {
      const cat = typeof where.category === 'string' ? where.category : where.category.equals;
      if (cat) {
        result = result.filter(
          (r) => r.category.toLowerCase() === cat.toLowerCase()
        );
      }
    }

    if (where.OR && Array.isArray(where.OR)) {
      result = result.filter((r) =>
        where.OR.some((cond) => {
          if (cond.name && cond.name.contains) {
            return r.name.toLowerCase().includes(cond.name.contains.toLowerCase());
          }
          if (cond.category && cond.category.contains) {
            return r.category.toLowerCase().includes(cond.category.contains.toLowerCase());
          }
          return false;
        })
      );
    }

    if (orderBy.rating) {
      const order = orderBy.rating.toLowerCase();
      result.sort((a, b) =>
        order === 'desc'
          ? b.rating - a.rating || a.name.localeCompare(b.name)
          : a.rating - b.rating || a.name.localeCompare(b.name)
      );
    } else if (orderBy.name) {
      const order = orderBy.name.toLowerCase();
      result.sort((a, b) =>
        order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      );
    } else {
      result.sort((a, b) => a.id - b.id);
    }

    return result.map((r) => ({ ...r }));
  },

  findUnique: async ({ where } = {}) => {
    const id = parseInt(where.id, 10);
    const found = inMemoryRestaurants.find((r) => r.id === id);
    return found ? { ...found } : null;
  },

  findFirst: async ({ where } = {}) => {
    const list = await inMemoryRestaurantStore.findMany({ where });
    return list.length > 0 ? list[0] : null;
  },

  create: async ({ data } = {}) => {
    const newRestaurant = {
      id: nextRestaurantId++,
      name: data.name,
      category: data.category,
      rating: parseFloat(data.rating),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryRestaurants.push(newRestaurant);
    return { ...newRestaurant };
  },

  update: async ({ where, data } = {}) => {
    const id = parseInt(where.id, 10);
    const item = inMemoryRestaurants.find((r) => r.id === id);
    if (!item) {
      const error = new Error(`Record to update not found (id: ${id})`);
      error.code = 'P2025';
      throw error;
    }
    if (data.name !== undefined) item.name = data.name;
    if (data.category !== undefined) item.category = data.category;
    if (data.rating !== undefined) item.rating = parseFloat(data.rating);
    item.updatedAt = new Date();
    return { ...item };
  },

  delete: async ({ where } = {}) => {
    const id = parseInt(where.id, 10);
    const index = inMemoryRestaurants.findIndex((r) => r.id === id);
    if (index === -1) {
      const error = new Error(`Record to delete not found (id: ${id})`);
      error.code = 'P2025';
      throw error;
    }
    const [deleted] = inMemoryRestaurants.splice(index, 1);
    return { ...deleted };
  },
};

// Implementação em memória para Pratos (Dishes)
const inMemoryDishStore = {
  findMany: async ({ where = {} } = {}) => {
    let result = [...inMemoryDishes];
    if (where.restaurantId !== undefined) {
      const restId = Number(where.restaurantId);
      result = result.filter((d) => d.restaurantId === restId);
    }
    return result.map((d) => ({ ...d }));
  },

  findUnique: async ({ where = {} } = {}) => {
    const id = Number(where.id);
    const dish = inMemoryDishes.find((d) => d.id === id);
    return dish ? { ...dish } : null;
  },

  create: async ({ data = {} } = {}) => {
    const newDish = {
      id: nextDishId++,
      name: data.name,
      description: data.description,
      price: data.price !== undefined ? String(Number(data.price).toFixed(2)) : '0.00',
      imageUrl: data.imageUrl || null,
      restaurantId: Number(data.restaurantId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDishes.push(newDish);
    return { ...newDish };
  },

  update: async ({ where = {}, data = {} } = {}) => {
    const id = Number(where.id);
    const dish = inMemoryDishes.find((d) => d.id === id);
    if (!dish) {
      const error = new Error(`Prato não encontrado (id: ${id})`);
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== undefined) dish.name = data.name;
    if (data.description !== undefined) dish.description = data.description;
    if (data.price !== undefined) dish.price = String(Number(data.price).toFixed(2));
    if (data.imageUrl !== undefined) dish.imageUrl = data.imageUrl;
    dish.updatedAt = new Date();
    return { ...dish };
  },

  delete: async ({ where = {} } = {}) => {
    const id = Number(where.id);
    const index = inMemoryDishes.findIndex((d) => d.id === id);
    if (index === -1) {
      const error = new Error(`Prato não encontrado (id: ${id})`);
      error.statusCode = 404;
      throw error;
    }
    const [deleted] = inMemoryDishes.splice(index, 1);
    return { ...deleted };
  },
};

// Cliente unificado com proxy inteligente
const prisma = new Proxy({}, {
  get: (target, prop) => {
    if (prop === '$connect') {
      return async () => testConnection();
    }
    if (prop === '$disconnect') {
      return async () => {
        if (realPrisma) await realPrisma.$disconnect().catch(() => {});
      };
    }

    if (prop === 'user') {
      return {
        findUnique: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.user.findUnique(args); }
            catch (err) {
              console.warn('[Prisma] Falha em user.findUnique no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryUserStore.findUnique(args);
        },
        findFirst: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.user.findFirst(args); }
            catch (err) {
              console.warn('[Prisma] Falha em user.findFirst no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryUserStore.findFirst(args);
        },
        findMany: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.user.findMany(args); }
            catch (err) {
              console.warn('[Prisma] Falha em user.findMany no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryUserStore.findMany(args);
        },
        create: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.user.create(args); }
            catch (err) {
              console.warn('[Prisma] Falha em user.create no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryUserStore.create(args);
        },
        update: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.user.update(args); }
            catch (err) {
              console.warn('[Prisma] Falha em user.update no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryUserStore.update(args);
        },
      };
    }

    if (prop === 'restaurant') {
      return {
        findMany: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.restaurant.findMany(args); }
            catch (err) {
              console.warn('[Prisma] Falha em restaurant.findMany no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryRestaurantStore.findMany(args);
        },
        findUnique: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.restaurant.findUnique(args); }
            catch (err) {
              console.warn('[Prisma] Falha em restaurant.findUnique no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryRestaurantStore.findUnique(args);
        },
        findFirst: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.restaurant.findFirst(args); }
            catch (err) {
              console.warn('[Prisma] Falha em restaurant.findFirst no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryRestaurantStore.findFirst(args);
        },
        create: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.restaurant.create(args); }
            catch (err) {
              console.warn('[Prisma] Falha em restaurant.create no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryRestaurantStore.create(args);
        },
        update: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.restaurant.update(args); }
            catch (err) {
              console.warn('[Prisma] Falha em restaurant.update no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryRestaurantStore.update(args);
        },
        delete: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.restaurant.delete(args); }
            catch (err) {
              console.warn('[Prisma] Falha em restaurant.delete no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryRestaurantStore.delete(args);
        },
      };
    }

    if (prop === 'dish') {
      return {
        findMany: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.dish.findMany(args); }
            catch (err) {
              console.warn('[Prisma] Falha em dish.findMany no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryDishStore.findMany(args);
        },
        findUnique: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.dish.findUnique(args); }
            catch (err) {
              console.warn('[Prisma] Falha em dish.findUnique no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryDishStore.findUnique(args);
        },
        create: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.dish.create(args); }
            catch (err) {
              console.warn('[Prisma] Falha em dish.create no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryDishStore.create(args);
        },
        update: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.dish.update(args); }
            catch (err) {
              console.warn('[Prisma] Falha em dish.update no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryDishStore.update(args);
        },
        delete: async (args) => {
          if (isConnected && realPrisma) {
            try { return await realPrisma.dish.delete(args); }
            catch (err) {
              console.warn('[Prisma] Falha em dish.delete no banco real, usando fallback:', err.message);
            }
          }
          return inMemoryDishStore.delete(args);
        },
      };
    }

    if (realPrisma && typeof realPrisma[prop] === 'function') {
      return realPrisma[prop].bind(realPrisma);
    }
    return realPrisma ? realPrisma[prop] : undefined;
  },
});

/**
 * Testa a conexão com o banco via Prisma
 */
async function testConnection() {
  if (!realPrisma || !process.env.DATABASE_URL) {
    console.warn('[Prisma] Variável DATABASE_URL ausente. Usando persistência em memória (Mock).');
    isConnected = false;
    return false;
  }
  try {
    await realPrisma.$connect();
    console.log('[Prisma] Conexão estabelecida com sucesso com o banco de dados.');
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`[Prisma] Aviso de Conexão: Não foi possível conectar ao banco (${error.message}).`);
    console.warn('[Prisma] Ativando persistência em memória (Mock) para Usuários, Restaurantes e Pratos.');
    isConnected = false;
    return false;
  }
}

module.exports = {
  prisma,
  testConnection,
};
