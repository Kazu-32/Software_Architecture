# Documentação de Arquitetura de Software - Easy Food

Este documento descreve as decisões arquiteturais, padrões de projeto, estrutura organizacional, fluxo de autenticação, serviço de e-mail e processamento compartilhado de imagens adotados no projeto **Easy Food**.

---

## 1. Visão Geral da Arquitetura: Monolito Modular

Optou-se pela arquitetura de **Monolito Modular** (*Modular Monolith*). O sistema reside em uma única base de código implantável, com **fronteiras de domínio isoladas em módulos** (`auth`, `restaurants`, `dishes` e `shared`), facilitando a manutenção, testabilidade e futura extração para microsserviços se necessário.

### Princípios Adotados:
- **Alta Coesão e Baixo Acoplamento**: Cada módulo encapsula suas rotas, controllers, serviços e regras de negócio.
- **Módulo Compartilhado (`modules/shared`)**: Funcionalidades transversais residem em serviços reutilizáveis e agnósticos:
  - `email.service.js`: Envio de e-mails via API externa (Resend).
  - `image.service.js`: Serviço reutilizável (`optimizeImage(buffer, folder)`) de processamento, correção de orientação, redimensionamento (máx 800px) e compressão em WebP via Sharp, utilizado tanto pelo módulo `auth` (perfis de usuários) quanto pelo módulo `dishes` (pratos do cardápio).
  - `upload.middleware.js`: Interceptação de arquivos multipart em memória via Multer (formatos JPEG, PNG e WebP; limite de 5 MB).
- **Independência Operacional**: Operações principais (persistência no banco de dados via Prisma) são desacopladas de ações secundárias (envio de e-mails e otimização assíncrona), garantindo manutenibilidade e isolamento de falhas.
- **Autenticação Stateless (JWT)**: Segurança de acesso a rotas protegidas sem dependência de sessões no servidor. Nas rotas do usuário autenticado (`/auth/me` e `/auth/me/image`), o identificador é extraído exclusivamente do token JWT (`req.user.id`).
- **Camada de Persistência Abstraída (Prisma ORM)**: Comunicação com o banco relacional via Prisma com suporte a migrations e fallback em memória tolerante.

---

## 2. Estrutura de Diretórios

A estrutura do projeto está organizada da seguinte forma:

```
easy-food/
├── docs/                               # Documentação e histórico arquitetural
│   ├── ARCHITECTURE.md                 # Visão geral da arquitetura (este arquivo)
│   ├── ADR-001-monolito-modular.md     # ADR: Adoção do Monolito Modular
│   ├── ADR-002-padrao-csr.md           # ADR: Padrão Controller-Service-Repository
│   ├── ADR-003-persistencia-mysql.md   # ADR: Banco de Dados Relacional MySQL
│   ├── ADR-004-autenticacao-jwt.md     # ADR: Autenticação JWT e Hash de Senha com bcrypt
│   ├── ADR-005-servico-email-resend.md # ADR: Serviço Compartilhado de E-mail (Resend)
│   ├── ADR-006-processamento-de-imagens.md # ADR: Processamento de Imagens In-Process (Sharp)
│   └── database-schema.sql             # Scripts DDL para inicialização do banco
├── prisma/
│   ├── migrations/                     # Histórico de migrações estruturais do Prisma
│   │   ├── 20261110000000_init_auth_and_restaurants/
│   │   │   └── migration.sql           # DDL de criação das tabelas users e restaurants
│   │   ├── 20261110000001_add_dishes/
│   │   │   └── migration.sql           # DDL de criação da tabela dishes e foreign key
│   │   └── 20261112000002_add_user_image_url/
│   │       └── migration.sql           # DDL adicionando image_url em users
│   └── schema.prisma                   # Modelos de dados (User, Restaurant e Dish)
├── public/                             # Interface web estática do cliente
│   ├── index.html                      # Estrutura semântica e modais (cardápio, cadastro, perfil)
│   ├── styles.css                      # Estilização editorial responsiva
│   └── app.js                          # Integração com a API REST e upload multipart
├── src/
│   ├── app.js                          # Configuração central do Express, middlewares, estáticos e rotas
│   ├── database/
│   │   ├── index.js                    # Exportação central da camada de dados
│   │   └── prisma.js                   # Instância do Prisma Client com fallback tolerante
│   └── modules/
│       ├── auth/                       # Módulo de Autenticação e Usuários
│       │   ├── auth.service.js         # Lógica: bcrypt, JWT, perfil e foto de usuário
│       │   ├── auth.controller.js      # Tratamento HTTP (/register, /login, /me, /me/image)
│       │   ├── auth.middleware.js      # Interceptador: valida Authorization: Bearer <token>
│       │   └── auth.routes.js          # Definição dos caminhos /auth
│       ├── restaurants/                # Módulo de Restaurantes
│       │   ├── restaurant.service.js   # Regras de negócio e integração com e-mail
│       │   ├── restaurant.controller.js# Tratamento de req/res HTTP (/restaurants)
│       │   └── restaurant.routes.js    # Definição das rotas públicas e protegidas
│       ├── dishes/                     # Módulo de Cardápio (Pratos)
│       │   ├── dish.service.js         # Validações de prato, vínculo e upload de imagem
│       │   ├── dish.controller.js      # Tratamento de req/res HTTP (/dishes) com propagação de statusCode
│       │   └── dish.routes.js          # Definição dos endpoints de prato e upload
│       └── shared/                     # Módulo Compartilhado Transversal
│           ├── email.service.js        # Serviço genérico de e-mail (Resend API)
│           ├── image.service.js        # Serviço reutilizável de otimização WebP com Sharp
│           └── upload.middleware.js    # Interceptador multipart/form-data com Multer
├── tests/                              # Testes automatizados (node:test)
├── uploads/                            # Armazenamento local das imagens otimizadas
│   ├── dishes/                         # Imagens WebP dos pratos
│   └── users/                          # Imagens WebP de perfil dos usuários
├── .env.example                        # Template de variáveis de ambiente
├── package.json                        # Dependências (multer, sharp, resend, bcryptjs, etc.)
└── server.js                           # Ponto de entrada: inicializa o servidor HTTP na porta 3000
```

---

## 3. Padrão Arquitetural em Camadas

Cada módulo adota a separação de responsabilidades em camadas bem definidas:

```
[ Cliente HTTP (Browser / Postman / curl) ]
                      │
                      ▼
            [ Router (Express) ] ────► Define rotas, verbos HTTP e aplica Middlewares
                      │
                      ▼
               [ Middlewares ]   ────► authMiddleware: valida "Authorization: Bearer <token>"
                      │          ────► upload.middleware: valida MIME, tamanho e buffer em memória
                      │
                      ▼
              [ Controller ]      ────► Recebe req, extrai dados (body, params, file, req.user),
                      │                chama o Service e retorna res com status HTTP adequado.
                      │
                      ▼
               [ Service ]        ────► Regras de negócio, hashing, validações de domínio,
                      │                geração de JWT e orquestração de persistência e eventos.
                      │
          ┌───────────┴────────────────────────┐
          ▼                                    ▼
[ Database (Prisma ORM) ]       [ Shared Modules ]
(Operação Principal)            - email.service.js (Resend)
                                - image.service.js (Sharp / WebP -> dishes & users)
```

---

## 4. Fluxos de Cardápio e Upload Compartilhado de Imagens

### A. Cadastro de Prato e Validações (`POST /restaurants/:restaurantId/dishes`)
1. `authMiddleware` valida o token JWT.
2. `dishService.createDish` valida `restaurantId` como inteiro positivo (`400`), exige `name` e `description` não vazios (`400`), converte/valida `price >= 0` (`400`) e confirma a existência do restaurante no banco (`404` se inexistente).
3. `dishController` respeita `error.statusCode` ao delegar exceções de domínio para o middleware de erro/resposta HTTP.
4. O prato é persistido com `imageUrl: null` inicialmente, retornando `201 Created`.

### B. Processamento Compartilhado de Imagens (`image.service.js` + `upload.middleware.js`)
O mesmo pipeline é reutilizado por **usuários** (`POST /auth/me/image` -> `folder = 'users'`) e **pratos** (`POST /dishes/:dishId/image` -> `folder = 'dishes'`):
1. `authMiddleware` garante autenticação JWT. No upload de perfil, `req.user.id` identifica o usuário sem aceitar IDs arbitrários no corpo ou rota.
2. `upload.middleware.js` (Multer) intercepta o campo `image`, aceitando apenas `image/jpeg`, `image/png` ou `image/webp` até 5 MB.
3. O service de domínio (`authService.uploadProfileImage` ou `dishService.uploadDishImage`) confirma que o registro existe (`404` caso contrário) e chama `imageService.optimizeImage(buffer, folder)`.
4. `imageService.optimizeImage` valida o buffer, aplica `.rotate()` (EXIF), `.resize({ width: 800, withoutEnlargement: true })`, converte para `.webp({ quality: 80 })` e grava em `uploads/<folder>/<uuid>.webp` (convertendo falhas de decodificação em `400 Bad Request`).
5. O Prisma atualiza o campo `imageUrl` do usuário ou do prato e devolve o caminho `/uploads/<folder>/<uuid>.webp`, servido publicamente pelo Express.

---

## 5. Catálogo de Endpoints da API

### Módulo de Autenticação e Perfil (`/auth`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `POST` | `/auth/register` | **Público** | Cadastra novo usuário com senha hasheada (bcrypt) | `201 Created` |
| `POST` | `/auth/login` | **Público** | Valida credenciais e devolve token JWT | `200 OK` (token + dados do user) |
| `GET` | `/auth/me` | **Protegido** | Retorna os dados do usuário autenticado (incluindo `imageUrl`) | `200 OK` |
| `POST` | `/auth/me/image` | **Protegido** | Faz upload, otimiza com Sharp (`uploads/users/`) e vincula avatar ao usuário do JWT | `200 OK` (usuário atualizado com `imageUrl`) |

### Módulo de Cardápio (`/dishes` e `/restaurants/:id/dishes`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `GET` | `/restaurants/:restaurantId/dishes` | **Público** | Lista os pratos do cardápio do restaurante (com `imageUrl`) | `200 OK` (array de pratos) |
| `POST` | `/restaurants/:restaurantId/dishes` | **Protegido** | Cadastra um novo prato no cardápio | `201 Created` |
| `POST` | `/dishes/:dishId/image` | **Protegido** | Faz upload, otimiza com Sharp (`uploads/dishes/`) e vincula foto ao prato | `200 OK` (prato atualizado com `imageUrl`) |
| `GET` | `/uploads/:folder/:filename` | **Público** | Acesso estático direto às imagens otimizadas (`users` ou `dishes`) | `200 OK` (arquivo binário WebP) |

### Módulo de Restaurantes (`/restaurants`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `GET` | `/restaurants` | **Público** | Lista restaurantes com suporte a busca e filtros | `200 OK` |
| `GET` | `/restaurants/:id` | **Público** | Retorna detalhes de um restaurante específico | `200 OK` |
| `POST` | `/restaurants` | **Protegido** | Cadastra restaurante e dispara e-mails via Resend | `201 Created` |
| `PUT` | `/restaurants/:id` | **Protegido** | Atualiza dados cadastrais de um restaurante | `200 OK` |
| `DELETE` | `/restaurants/:id`| **Protegido** | Remove um restaurante do sistema | `200 OK` |

### Verificação de Saúde (`/health`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `GET` | `/health` | **Público** | Retorna o status de execução e uptime do servidor | `200 OK` |
