# ADR 003: Persistência com Banco de Dados Relacional MySQL e Pool de Conexões

## Status
Aprovado

## Contexto
O sistema Easy Food necessita de armazenamento persistente, transacional e confiável para informações de restaurantes, cardápios, categorias e avaliações. Dados em memória são voláteis e se perdem a cada reinicialização da aplicação. Além disso, sistemas alimentícios e de pedidos dependem de integridade relacional, consistência de dados (ACID) e consultas estruturadas.

## Decisão
Decidimos adotar o **MySQL** como banco de dados relacional oficial da aplicação, integrado através da biblioteca **`mysql2/promise`** configurada com **Connection Pool (Pool de Conexões)**.

### Detalhes Técnicos:
1. **Configuração via Variáveis de Ambiente**:
   As credenciais de acesso ao MySQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` ou uma string de conexão `DATABASE_URL`) são lidas a partir de variáveis de ambiente gerenciadas pela biblioteca `dotenv`, sem que senhas fiquem hardcoded no código-fonte.

2. **Connection Pool**:
   O módulo `src/config/database.js` cria e exporta um pool (`mysql.createPool`) com limites configuráveis (`connectionLimit`, `waitForConnections`, `queueLimit`). Isso evita abrir e fechar conexões TCP a cada requisição, maximizando a taxa de transferência (*throughput*) e economizando recursos do banco.

3. **Fallback Resiliente para Desenvolvimento**:
   Para permitir que o código seja inspecionado, empacotado e testado antes que o usuário configure seu servidor MySQL local ou na nuvem, o módulo de banco de dados captura falhas de inicialização graciosamente, alertando o desenvolvedor nos logs sem derrubar o processo de forma silenciosa ou ininteligível.

## Consequências

### Positivas:
- **Confiabilidade e Integridade**: Chaves primárias auto-incrementais, tipos de dados estritos (`DECIMAL(3,1)` para notas/ratings, `VARCHAR` para nomes e categorias) e restrições de integridade.
- **Performance**: O Pool de Conexões do `mysql2` é amplamente reconhecido pela excelente performance em ambientes Node.js.
- **Segurança**: Uso obrigatório de Prepared Statements (`?`) em todos os métodos do Repository.
