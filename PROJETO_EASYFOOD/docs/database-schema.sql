-- =====================================================================
-- Script DDL de Inicialização do Banco de Dados Easy Food (MySQL)
-- Disciplina: Arquitetura de Software
-- =====================================================================

-- 1. Criação da base de dados (se não existir)
CREATE DATABASE IF NOT EXISTS easy_food_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE easy_food_db;

-- 2. Criação da tabela de Restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Carga inicial de dados para demonstração (Seed)
INSERT INTO restaurants (name, category, rating) VALUES
  ('LaPetitosa', 'Pizza', 4.5),
  ('Lanchonete do Zé', 'Lanches', 5.0),
  ('La Pasta', 'Massa', 3.0),
  ('Sushi Imperial', 'Japonesa', 4.8),
  ('Cantina da Nonna', 'Italiana', 4.2),
  ('Taco Loco', 'Mexicana', 4.0),
  ('Sabor Verde', 'Vegana', 4.7)
ON DUPLICATE KEY UPDATE name=name;
