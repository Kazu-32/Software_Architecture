# ADR 004: Autenticação Stateless com JWT e Criptografia de Senhas com bcrypt

## Status
Aprovado

## Contexto
Originalmente, a API Easy Food permitia a qualquer cliente HTTP cadastrar, alterar e remover restaurantes no catálogo sem qualquer forma de identificação de identidade ou controle de acesso. Para garantir a segurança dos dados e permitir a responsabilização por operações mutativas (POST, PUT, DELETE), faz-se necessária uma camada de autenticação segura e escalável.

## Decisão
Decidimos implementar autenticação **stateless** utilizando **JSON Web Tokens (JWT)** e hashing criptográfico unidirecional de senhas com a biblioteca **bcrypt** (`bcryptjs`).

A arquitetura do fluxo de autenticação foi definida com os seguintes critérios:

1. **Armazenamento Seguro de Senhas**:
   - Nenhuma senha em texto puro é gravada no banco de dados.
   - No cadastro (`POST /auth/register`), a senha passa por `bcrypt.hash(password, 10)` com geração automática de salt criptográfico antes da persistência.
   - Na autenticação (`POST /auth/login`), a senha informada é comparada com o hash persistido via `bcrypt.compare(password, user.password)`.

2. **Emissão e Verificação de Tokens (JWT)**:
   - Uma vez validadas as credenciais, o servidor emite um token JWT contendo as informações públicas essenciais do usuário (`id`, `email`, `name`) assinado digitalmente com `JWT_SECRET`.
   - O token possui validade temporal (`expiresIn: '24h'`).

3. **Proteção de Rotas com Middleware (`auth.middleware.js`)**:
   - Rotas de leitura do catálogo (`GET /restaurants`, `GET /restaurants/:id`) permanecem **públicas** para consumo irrestrito.
   - Rotas mutativas (`POST /restaurants`, `PUT /restaurants/:id`, `DELETE /restaurants/:id`) e a consulta de perfil (`GET /auth/me`) são **protegidas**.
   - O middleware intercepta as requisições e verifica o cabeçalho `Authorization: Bearer <token>`.
   - Se o cabeçalho for ausente, malformado ou o token for inválido/expirado, o acesso é imediatamente interrompido com status `401 Unauthorized`.

4. **Isolamento Modular**:
   - Toda a responsabilidade de autenticação e gerenciamento de usuários foi encapsulada no módulo `src/modules/auth/`, contendo suas próprias camadas de rotas, controller, middleware e serviço.

## Consequências

### Positivas:
- **Stateless & Escalabilidade**: O servidor não precisa manter sessões ou estado em memória, viabilizando escalabilidade horizontal instantânea.
- **Segurança Robusta**: Senhas protegidas contra ataques de dicionário e rainbow tables graças ao algoritmo bcrypt com salting.
- **Granularidade de Acesso**: Separação clara entre operações públicas de catálogo e operações restritas a usuários autenticados.

### Negativas / Mitigações:
- **Revogação Imediata de Tokens**: Tokens JWT continuam válidos até sua expiração natural.
  - *Mitigação*: Definido prazo de expiração curto (24h), podendo no futuro incorporar listas de revogação (*token blacklisting* em Redis) se demandado por regras de negócio críticas.
