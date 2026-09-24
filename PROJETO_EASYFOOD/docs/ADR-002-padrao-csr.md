# ADR 002: Adoção do Padrão Controller-Service-Repository (CSR)

## Status
Aprovado

## Contexto
Na implementação original, rotas, regras de validação e persistência em arrays na memória estavam condensados diretamente no arquivo principal (`server.js`). Essa mistura de responsabilidades dificulta a manutenção, impede testes isolados de regras de negócio e acopla a aplicação ao protocolo HTTP e à forma de armazenamento.

## Decisão
Decidimos estruturar a lógica interna de cada módulo seguindo rigorosamente o padrão **CSR (Controller - Service - Repository)**.

As três camadas são definidas com as seguintes atribuições exclusivas:

1. **Controller (`*.controller.js`)**:
   - Ponto de entrada das requisições HTTP gerenciadas pelo Express.
   - Responsável por coletar parâmetros de `req.body`, `req.params` e `req.query`.
   - Invoca o método correspondente da camada Service.
   - Retorna o status HTTP correto (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
   - Não contém regras de negócio nem comandos SQL.

2. **Service (`*.service.js`)**:
   - Contém a inteligência e as regras de negócio da aplicação.
   - Executa validações de domínio (ex: notas válidas entre 0.0 e 5.0, obrigatoriedade de campos semânticos, checagens de duplicidade).
   - Orquestra chamadas aos repositórios.
   - É agnóstico ao Express (não recebe nem manipula objetos `req` ou `res`), permitindo que a mesma lógica seja consumida futuramente por filas (RabbitMQ/Kafka), CLI ou tarefas agendadas (Cron).

3. **Repository (`*.repository.js`)**:
   - Responsável exclusivo pela persistência e recuperação de dados no banco MySQL.
   - Abstrai a sintaxe SQL e as interações com o driver `mysql2/promise`.
   - Retorna entidades ou objetos de dados puros (DTOs) para a camada de serviço.
   - Utiliza exclusivamente consultas parametrizadas para proteção contra SQL Injection.

## Consequências

### Positivas:
- **Separação de Preocupações (SoC)**: Cada camada tem uma única razão para mudar.
- **Testabilidade**: Os serviços podem ser testados unitariamente fornecendo mocks dos repositórios, sem necessidade de banco de dados ativo.
- **Portabilidade de Persistência**: Alterações nas tabelas do banco ou substituição do MySQL por outro banco exigem alterações apenas na camada Repository, sem impactar Services ou Controllers.

### Negativas / Mitigações:
- **Mais arquivos por módulo**: Para operações triviais (CRUDs simples), pode parecer que há camadas a mais.
  - *Justificativa*: A clareza arquitetural e o desacoplamento compensam amplamente a criação desses arquivos à medida que o sistema cresce.
