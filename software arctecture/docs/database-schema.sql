-- =====================================================================
-- Script DDL de Inicialização do Banco de Dados Easy Food (MySQL)
-- Disciplina: Arquitetura de Software
-- =====================================================================

-- 1. Criação da base de dados (se não existir)
CREATE DATABASE IF NOT EXISTS easy_food_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE easy_food_db;

-- 2. Criação da tabela de Usuários (Autenticação)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Criação da tabela de Restaurantes
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

-- 4. Criação da tabela de Pratos (Cardápio - Atividade 7)
CREATE TABLE IF NOT EXISTS dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255) NULL,
  restaurant_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_restaurant_id (restaurant_id),
  CONSTRAINT fk_dishes_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Carga inicial de dados para demonstração (Seed de Restaurantes e Pratos)
INSERT INTO restaurants (name, category, rating) VALUES
  ('LaPetitosa', 'Pizza', 4.5),
  ('Lanchonete do Zé', 'Lanches', 5.0),
  ('La Pasta', 'Massa', 3.0),
  ('Sushi Imperial', 'Japonesa', 4.8),
  ('Cantina da Nonna', 'Italiana', 4.2),
  ('Taco Loco', 'Mexicana', 4.0),
  ('Sabor Verde', 'Vegana', 4.7)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO dishes (id, name, description, price, image_url, restaurant_id) VALUES
  (1, 'Pizza Margherita', 'Molho de tomate, queijo e manjericão', 49.90, NULL, 1)
ON DUPLICATE KEY UPDATE name=name;
