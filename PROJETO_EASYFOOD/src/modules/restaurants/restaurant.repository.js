const { pool } = require('../../config/database');

/**
 * Camada Repository: Responsável exclusiva pela persistência e comunicação com o MySQL.
 * Todas as operações utilizam Prepared Statements (placeholders ?) para mitigar SQL Injection.
 */
class RestaurantRepository {
  /**
   * Retorna todos os restaurantes cadastrados.
   * Suporta ordenação opcional.
   */
  async findAll({ category, search, sortBy } = {}) {
    let query = 'SELECT id, name, category, CAST(rating AS FLOAT) AS rating, created_at, updated_at FROM restaurants WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search) {
      query += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sortBy === 'rating-desc') {
      query += ' ORDER BY rating DESC, name ASC';
    } else if (sortBy === 'name-asc') {
      query += ' ORDER BY name ASC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Busca um restaurante pelo seu identificador primário (ID).
   */
  async findById(id) {
    const query = 'SELECT id, name, category, CAST(rating AS FLOAT) AS rating, created_at, updated_at FROM restaurants WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Insere um novo restaurante na tabela `restaurants`.
   */
  async create({ name, category, rating }) {
    const query = 'INSERT INTO restaurants (name, category, rating) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [name, category, rating]);

    return {
      id: result.insertId,
      name,
      category,
      rating: parseFloat(rating),
    };
  }

  /**
   * Atualiza dados de um restaurante existente.
   */
  async update(id, { name, category, rating }) {
    const query = 'UPDATE restaurants SET name = ?, category = ?, rating = ? WHERE id = ?';
    const [result] = await pool.query(query, [name, category, rating, id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Remove um restaurante pelo ID.
   */
  async delete(id) {
    const query = 'DELETE FROM restaurants WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new RestaurantRepository();
