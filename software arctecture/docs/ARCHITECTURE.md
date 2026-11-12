# Documentação de Arquitetura de Software - Easy Food

Este documento descreve as decisões arquiteturais, padrões de projeto, estrutura organizacional, fluxo de autenticação, serviço de e-mail e processamento de imagens do cardápio adotados no projeto **Easy Food**.

---

## 1. Visão Geral da Arquitetura: Monolito Modular

Optou-se pela arquitetura de **Monolito Modular** (*Modular Monolith*). O sistema reside em uma única base de código implantável, com **fronteiras de domínio isoladas em módulos** (`auth`, `restaurants`, `dishes` e `shared`), facilitando a manutenção, testabilidade e futura extração para microsserviços se necessário.

### Princípios Adotados:
- **Alta Coesão e Baixo Acoplamento**: Cada módulo encapsula suas rotas, controllers, serviços e regras de negócio.
- **Módulo Compartilhado (`modules/shared`)**: Funcionalidades transversais residem em serviços reutilizáveis e agnósticos:
  - `email.service.js`: Envio de e-mails via API externa (Resend).
  - `image.service.js`: Processamento, redimensionamento (máx 800px) e compressão em WebP via Sharp.
  - `upload.middleware.js`: Interceptação de arquivos multipart em memória via Multer (limite de 5 MB).
- **Independência Operacional**: Operações principais (persistência no banco de dados via Prisma) são desacopladas de ações secundárias (envio de e-mails e upload de imagens), garantindo que uma falha em uma ação secundária não cancele uma operação principal já concluída.
- **Autenticação Stateless (JWT)**: Segurança de acesso a rotas protegidas sem dependência de sessões no servidor.
- **Camada de Persistência Abstraída (Prisma ORM)**: Comunicação com o banco relacional via Prisma com suporte a migrations e persistência tolerante.

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
│   │   └── 20261110000001_add_dishes/
│   │       └── migration.sql           # DDL de criação da tabela dishes e foreign key
│   └── schema.prisma                   # Modelos de dados (User, Restaurant e Dish)
├── public/
│   └── index.html                      # Interface web do usuário (CSR)
├── src/
│   ├── app.js                          # Configuração central do Express, middlewares, estáticos e rotas
│   ├── database/
│   │   ├── index.js                    # Exportação central da camada de dados
│   │   └── prisma.js                   # Instância do Prisma Client com fallback tolerante
│   └── modules/
│       ├── auth/                       # Módulo de Autenticação e Usuários
│       │   ├── auth.service.js         # Lógica de negócio: hash bcrypt, validações e JWT
│       │   ├── auth.controller.js      # Tratamento de req/res HTTP (/register, /login, /me)
│       │   ├── auth.middleware.js      # Interceptador: valida Authorization: Bearer <token>
│       │   └── auth.routes.js          # Definição dos caminhos /auth
│       ├── restaurants/                # Módulo de Restaurantes
│       │   ├── restaurant.service.js   # Regras de negócio e integração com e-mail
│       │   ├── restaurant.controller.js# Tratamento de req/res HTTP (/restaurants)
│       │   └── restaurant.routes.js    # Definição das rotas públicas e protegidas
│       ├── dishes/                     # Módulo de Cardápio (Pratos)
│       │   ├── dish.service.js         # Regras de negócio, vínculo com restaurante e imagem
│       │   ├── dish.controller.js      # Tratamento de req/res HTTP (/dishes)
│       │   └── dish.routes.js          # Definição dos endpoints de prato e upload
│       └── shared/                     # Módulo Compartilhado Transversal
│           ├── email.service.js        # Serviço genérico de e-mail (Resend API)
│           ├── image.service.js        # Otimização e compressão de imagens com Sharp
│           └── upload.middleware.js    # Interceptador multipart/form-data com Multer
├── uploads/                            # Armazenamento local das imagens otimizadas
│   └── dishes/                         # Imagens WebP geradas pelo processamento
├── .env                                # Variáveis de ambiente locais
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
                      │          ────► upload.middleware: valida multipart e buffer em memória
                      │
                      ▼
             [ Controller ]      ────► Recebe req, extrai dados (body, params, file),
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
                                - image.service.js (Sharp / WebP)
```

---

## 4. Gerenciamento do Cardápio e Processamento de Imagens

O gerenciamento de pratos e fotos segue dois fluxos desacoplados:

### A. Cadastro de Prato (`POST /restaurants/:restaurantId/dishes`)
1. Cliente envia JSON com `name`, `description` e `price`.
2. `authMiddleware` valida o token JWT.
3. `dishService.createDish` valida a existência do restaurante no banco.
4. O prato é persistido com `imageUrl: null` inicialmente, retornando `201 Created`.

### B. Upload de Imagem do Prato (`POST /dishes/:dishId/image`)
1. Cliente envia formulário `multipart/form-data` com o campo `image`.
2. `upload.middleware.js` (Multer) intercepta a requisição, validando o tipo MIME (`image/jpeg`, `image/png`, `image/webp`) e tamanho máximo (5 MB).
3. `dishService.uploadDishImage` localiza o prato.
4. `image.service.js` (Sharp) recebe o buffer em memória, corrige orientação com `.rotate()`, redimensiona para largura máxima de 800px, converte para WebP (qualidade 80) e salva o arquivo em `uploads/dishes/<uuid>.webp`.
5. O Prisma atualiza o campo `imageUrl` do prato.
6. A imagem pode ser acessada publicamente no navegador através da rota `/uploads/dishes/<uuid>.webp`.

---

## 5. Catálogo de Endpoints da API

### Módulo de Cardápio (`/dishes` e `/restaurants/:id/dishes`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `GET` | `/restaurants/:restaurantId/dishes` | **Público** | Lista os pratos do cardápio do restaurante | `200 OK` (array de pratos) |
| `POST` | `/restaurants/:restaurantId/dishes` | **Protegido** | Cadastra um novo prato no cardápio | `201 Created` |
| `POST` | `/dishes/:dishId/image` | **Protegido** | Faz upload, otimiza com Sharp e vincula foto ao prato | `200 OK` (prato atualizado com `imageUrl`) |
| `GET` | `/uploads/dishes/:filename` | **Público** | Acesso estático direto à imagem otimizada (.webp) | `200 OK` (arquivo binário WebP) |

### Módulo de Restaurantes (`/restaurants`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `GET` | `/restaurants` | **Público** | Lista restaurantes com suporte a busca e filtros | `200 OK` |
| `GET` | `/restaurants/:id` | **Público** | Retorna detalhes de um restaurante específico | `200 OK` |
| `POST` | `/restaurants` | **Protegido** | Cadastra restaurante e dispara e-mails via Resend | `201 Created` |
| `PUT` | `/restaurants/:id` | **Protegido** | Atualiza dados cadastrais de um restaurante | `200 OK` |
| `DELETE` | `/restaurants/:id`| **Protegido** | Remove um restaurante do sistema | `200 OK` |

### Módulo de Autenticação (`/auth`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `POST` | `/auth/register` | **Público** | Cadastra novo usuário com senha hasheada (bcrypt) | `201 Created` |
| `POST` | `/auth/login` | **Público** | Valida credenciais e devolve token JWT | `200 OK` (token + dados do user) |
| `GET` | `/auth/me` | **Protegido** | Retorna os dados do usuário autenticado | `200 OK` |

### Verificação de Saúde (`/health`)

| Método | Endpoint | Acesso | Descrição | Resposta de Sucesso |
|---|---|---|---|---|
| `GET` | `/health` | **Público** | Retorna o status de execução e uptime do servidor | `200 OK` |
