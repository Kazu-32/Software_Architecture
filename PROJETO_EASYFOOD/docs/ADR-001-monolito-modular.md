# ADR 001: Adoção do Padrão Monolito Modular

## Status
Aprovado

## Contexto
O projeto **Easy Food** é uma aplicação voltada para a gestão de restaurantes, pedidos e catálogo gastronômico, desenvolvida no âmbito da disciplina de Arquitetura de Software. O projeto precisa de uma estrutura de código organizada, escalável e de fácil manutenção, que permita a adição contínua de novas funcionalidades (ex: pedidos, clientes, cardápios, entregadores) sem gerar código espaguete nem criar sobrecarga operacional prematura.

Foram avaliadas três abordagens principais:
1. **Monolito Tradicional (Camadas Globais simples)**: todas as controllers em uma pasta, todos os models em outra.
2. **Microsserviços**: múltiplos repositórios e serviços autônomos implantados separadamente.
3. **Monolito Modular**: uma única aplicação dividida em módulos autocontidos por domínio de negócio.

## Decisão
Decidimos adotar a arquitetura de **Monolito Modular** (*Modular Monolith*).

Nesta arquitetura:
- O sistema é mantido e implantado como uma unidade única.
- O código é particionado em diretórios modulares (`src/modules/<dominio>/`), onde cada módulo agrupa suas próprias rotas, controllers, serviços e repositórios.
- A comunicação entre módulos se dá por contratos e serviços bem definidos, vedando dependências circulares e acoplamento direto de persistência entre módulos distintos.

## Consequências

### Positivas:
- **Baixa Complexidade Operacional**: Deploy simples, sem necessidade de orquestradores de contêineres complexos (Kubernetes), Service Mesh ou observabilidade distribuída neste estágio.
- **Transações e Performance Local**: Comunicação in-process, eliminando latências de rede e complexidades de transações distribuídas (Sagas / 2PC).
- **Facilidade de Refatoração e Testes**: Testes automatizados unitários e de integração rápidos e determinísticos.
- **Caminho para Microsserviços**: Caso um módulo específico demande escala horizontal independente no futuro, ele já possui limites de contexto delimitados, viabilizando sua extração sem reescrever o sistema.

### Negativas / Mitigações:
- **Risco de Erosão de Fronteiras**: Desenvolvedores podem ser tentados a importar repositórios de outros módulos diretamente.
  - *Mitigação*: Estabelecer a convenção de que módulos só expõem seus Serviços públicos para outros módulos.
