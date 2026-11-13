# EasyFood

Aplicação web e API REST para catálogo de restaurantes, autenticação de usuários com JWT, envio transacional de e-mails (Resend), gerenciamento de cardápios e processamento compartilhado de imagens (Multer + Sharp) organizada como **Monolito Modular**.

---

## Arquitetura do Projeto

- `server.js` — Ponto de entrada; inicializa o servidor HTTP na porta `3000`.
- `src/app.js` — Configuração do Express, middlewares globais, arquivos estáticos (`public/` e `uploads/`) e tratamento centralizado de erros.
- `src/database/prisma.js` — Instância do Prisma Client (MySQL) com fallback em memória automático caso `DATABASE_URL` não esteja configurado.
- `src/modules/` — Módulos isolados por domínio seguindo o padrão **Router → Middleware → Controller → Service**:
  - `auth/`: cadastro com `bcryptjs`, login com JWT, consulta de perfil (`/auth/me`) e upload de avatar (`/auth/me/image`).
  - `restaurants/`: listagem pública, consulta e operações protegidas com notificação por e-mail.
  - `dishes/`: listagem pública do cardápio, cadastro de pratos e upload de fotos (`/dishes/:dishId/image`).
  - `shared/`: serviços reutilizáveis (`email.service.js`, `image.service.js`, `upload.middleware.js`).
- `docs/` — Documentação técnica (`ARCHITECTURE.md`), ADRs (`ADR-001` a `ADR-006`) e script DDL (`database-schema.sql`).
- `tests/` — Testes unitários e de integração HTTP com `node:test`.

---

## Como Executar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o ambiente (opcional — sem `.env` o sistema opera com fallback em memória):**
   ```bash
   cp .env.example .env
   ```
   Edite `.env` com suas credenciais de banco (`DATABASE_URL`), `JWT_SECRET` e `RESEND_API_KEY`.

3. **Execute as migrações do Prisma (quando usar banco MySQL ativo):**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```
   Acesse `http://localhost:3000` no navegador.

5. **Execute os testes automatizados:**
   ```bash
   npm test
   ```

---

## Principais Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Cadastra usuário com senha hasheada (`bcrypt`) |
| `POST` | `/auth/login` | Público | Autentica credenciais e devolve JWT |
| `GET` | `/auth/me` | Protegido | Retorna perfil e `imageUrl` do usuário do token |
| `POST` | `/auth/me/image` | Protegido | Otimiza e vincula foto ao perfil autenticado |
| `GET` | `/restaurants` | Público | Lista restaurantes cadastrados |
| `POST` | `/restaurants` | Protegido | Cadastra restaurante e envia e-mail via Resend |
| `GET` | `/restaurants/:restaurantId/dishes` | Público | Lista pratos do cardápio com `imageUrl` |
| `POST` | `/restaurants/:restaurantId/dishes` | Protegido | Cadastra novo prato no cardápio |
| `POST` | `/dishes/:dishId/image` | Protegido | Otimiza e vincula foto ao prato |
| `GET` | `/uploads/:folder/:filename` | Público | Serve imagens WebP otimizadas (`users` / `dishes`) |

---

## Reflexão Arquitetural (Atividade 8 — Parte 6)

- **Por que reutilizar o mesmo serviço de imagens (`image.service.js`)?**  
  Evita duplicação de código (DRY), centraliza regras de qualidade, redimensionamento (`800px`), orientação EXIF, conversão WebP e limpeza de arquivos substituídos em um único ponto. Se amanhã o armazenamento migrar para S3/GCS ou serverless, apenas o `image.service.js` muda.
- **Responsabilidade do Controller vs. Service:**  
  O **Controller** extrai dados da requisição HTTP (`req.body`, `req.params`, `req.file`, `req.user`), verifica presença de entrada básica e devolve o status HTTP adequado. O **Service** concentra regras de negócio, validações de domínio, consistência de banco e orquestração de serviços compartilhados.
- **Por que não processar imagens diretamente nas rotas?**  
  Misturar lógica de Sharp/Multer nas rotas cria alto acoplamento com o Express, dificulta testes unitários isolados e impede reutilização por outros módulos ou filas assíncronas.
- **Como o `authMiddleware` protege a imagem de perfil?**  
  Valida o token `Authorization: Bearer <token>` antes do controller e injeta `req.user.id`. O endpoint `/auth/me/image` utiliza exclusivamente `req.user.id` para atualizar o registro no banco, impedindo que um cliente altere a foto de outro usuário via ID na URL ou no corpo.
- **O que deve acontecer se o processamento da imagem falhar?**  
  O serviço converte falhas de buffer/decodificação em erro HTTP `400 Bad Request` antes de alterar o banco de dados, preservando a imagem anterior (e os dados já salvos) sem deixar referências quebradas.
- **Extensibilidade da arquitetura:**  
  Como os módulos se comunicam por contratos claros de serviço e compartilham utilitários agnósticos em `modules/shared/`, novos recursos (como categorias, pedidos ou armazenamento em nuvem) podem ser adicionados sem reescrever os módulos existentes.
