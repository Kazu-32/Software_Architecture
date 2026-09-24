# Documentação de Arquitetura de Software - Easy Food

Este documento descreve as decisões arquiteturais, padrões de projeto e estrutura organizacional adotados para o projeto **Easy Food**.

---

## 1. Visão Geral da Arquitetura: Monolito Modular

Optou-se pela arquitetura de **Monolito Modular** (*Modular Monolith*). Em vez de dividir precocemente o sistema em microsserviços distribuídos (que adicionam complexidade de rede, transações distribuídas, latência e custos operacionais desnecessários para o estágio atual), o sistema reside em uma única base de código implantável, mas com **fronteiras de domínio rigorosamente isoladas por módulos**.

### Princípios do Monolito Modular:
- **Alta Coesão e Baixo Acoplamento**: Cada módulo encapsula sua lógica de domínio, persistência e interfaces.
- **Isolamento de Domínio**: Módulos conversam através de interfaces e serviços bem definidos, sem vazamento de detalhes de persistência.
- **Pronto para Evolução**: Se um módulo no futuro demandar escalabilidade independente, sua extração para um microsserviço ou serviço independente é direta e de baixo atrito.

---

## 2. Estrutura de Diretórios

A estrutura do projeto separa a infraestrutura global dos módulos de negócio:

```
├── docs/
│   ├── ARCHITECTURE.md                 # Visão geral da arquitetura (este arquivo)
│   ├── ADR-001-monolito-modular.md     # ADR: Adoção do Monolito Modular
│   ├── ADR-002-padrao-csr.md           # ADR: Padrão Controller-Service-Repository
│   ├── ADR-003-persistencia-mysql.md   # ADR: Banco de Dados Relacional MySQL
│   └── database-schema.sql             # Scripts DDL para inicialização do MySQL
├── src/
│   ├── config/
│   │   └── database.js                 # Pool de conexões MySQL (mysql2/promise)
│   ├── modules/
│   │   └── restaurants/                # Módulo de Restaurantes
│   │       ├── restaurant.controller.js # Camada de Apresentação / HTTP
│   │       ├── restaurant.service.js    # Camada de Regras de Negócio
│   │       ├── restaurant.repository.js # Camada de Acesso a Dados (SQL)
│   │       └── restaurant.routes.js     # Definição das Rotas Express do módulo
│   └── app.js                          # Configuração central do Express & Middlewares
├── .env.example                        # Template de variáveis de ambiente
├── package.json                        # Gerenciamento de dependências e scripts
└── server.js                           # Entry point de inicialização da aplicação
```

---

## 3. Padrão Arquitetural CSR (Controller-Service-Repository)

Cada módulo do sistema adota a separação em 3 camadas de responsabilidade única:

```
[ Cliente HTTP ]
       │
       ▼
[ Router (Express) ] ────► Define rotas e verbos HTTP (GET, POST, PUT, DELETE)
       │
       ▼
[ Controller ]       ────► Extrai parâmetros (body, query, params), valida formato HTTP,
       │                   chama o Service e retorna status HTTP (200, 201, 400, 404, 500).
       │
       ▼
[ Service ]          ────► Implementa as REGRAS DE NEGÓCIO, validações de domínio
       │                   (ex: limites de notas, unicidade), orquestração e lógica pura.
       │
       ▼
[ Repository ]       ────► Responsável EXCLUSIVO pelo acesso ao banco de dados MySQL.
       │                   Executa queries SQL parametrizadas (Prepared Statements).
       ▼
[ MySQL Database ]
```

### Detalhamento das Camadas:

| Camada | Responsabilidade | O que NÃO deve conter |
|---|---|---|
| **Controller** | Lidar com protocolo HTTP, extrair dados da requisição (`req.body`, `req.params`), invocar o Service e formular a resposta (`res.status().json()`). | Queries SQL, lógicas de cálculo ou regras de validação de negócio. |
| **Service** | Regras de negócio, cálculos, garantias de integridade lógica do domínio e orquestração de múltiplos repositórios. | Objetos do Express (`req`, `res`, `next`), comandos SQL ou dependência de protocolo HTTP. |
| **Repository** | Abstração de persistência. Montagem e execução de queries SQL via pool de conexões do MySQL. | Tratamento de requisições HTTP ou decisões de negócio do sistema. |

---

## 4. Integração com Banco de Dados MySQL

### Driver e Pool de Conexões
- Utiliza a biblioteca oficial e performática **`mysql2/promise`**, permitindo o uso nativo de `async/await`.
- Conexões são gerenciadas por um **Pool de Conexões** (`createPool`), garantindo reutilização de conexões TCP, mitigando custos de handshake e suportando concorrência eficiente.

### Segurança contra SQL Injection
Todas as queries do repositório utilizam **Prepared Statements** com placeholders (`?`), garantindo sanitização nativa pelo driver:
```javascript
// Exemplo seguro com parâmetros sanitizados
const [result] = await pool.query(
  'INSERT INTO restaurants (name, category, rating) VALUES (?, ?, ?)',
  [name, category, rating]
);
```

---

## 5. Como Configurar o Acesso ao Banco de Dados

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. Abra o arquivo `.env` e preencha suas credenciais do MySQL:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=sua_senha_aqui
   DB_NAME=easy_food_db
   ```
3. Execute o script DDL em `docs/database-schema.sql` no seu servidor MySQL para criar o banco e a tabela necessária.
