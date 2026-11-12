# ADR 005: Serviço Compartilhado de Envio de E-mails com Resend

## Status
Aprovado

## Contexto
Com a expansão da Easy Food, diferentes módulos do sistema (como Restaurantes, Autenticação e futuros módulos de Pedidos ou Notificações) necessitam disparar comunicações transacionais por e-mail (por exemplo: boas-vindas ao cadastrar restaurante, confirmação de conta, alertas comerciais).

Acoplar bibliotecas ou chamadas HTTP de e-mail diretamente nos serviços de negócio gera duplicação de código, dificulta a troca de provedores e arrisca que falhas de rede no disparo de e-mails impeçam a persistência de operações principais no banco de dados.

## Decisão
Decidimos implementar um **Serviço Compartilhado Genérico** em `src/modules/shared/email.service.js` integrado à API do provedor **Resend**.

As seguintes diretrizes arquiteturais foram estabelecidas:

1. **Assinatura Genérica Reutilizável**:
   - O serviço exporta uma função padronizada `sendEmail({ to, toName, subject, header, body, footer })`.
   - Inclui montagem unificada de template HTML responsivo através da função `buildHtml()`.
   - Os módulos consumidores desconhecem os detalhes da API do Resend, dependendo unicamente da interface de `sendEmail`.

2. **Independência Operacional e Resiliência**:
   - A operação principal (persistência no banco via Prisma) sempre ocorre em primeiro lugar.
   - O disparo de e-mails é uma **ação secundária**, sempre encapsulada em blocos `try/catch`.
   - Se a API externa de e-mail oscilar, expirar cota ou falhar, o erro é registrado no console e o restaurante permanece salvo com sucesso, devolvendo `201 Created` para o cliente.

3. **Reutilização para Múltiplos Conteúdos**:
   - A mesma função `sendEmail()` é utilizada tanto para o e-mail transacional de boas-vindas ao restaurante cadastrado quanto para a notificação de alerta à equipe comercial.

4. **Configuração via Variáveis de Ambiente**:
   - As credenciais (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_TEST_TO`) são lidas do `.env` sem exposição de credenciais no código-fonte.
   - Na ausência de chave em ambiente de desenvolvimento, o serviço atua em modo simulado (log de aviso), não travando o fluxo da aplicação.

## Consequências

### Positivas:
- **Desacoplamento e Baixa Complexidade**: Módulos de domínio não conhecem detalhes do provedor de e-mail.
- **Tolerância a Falhas**: Falhas no provedor terceiro não interrompem o cadastro de restaurantes.
- **Flexibilidade**: A troca de provedor (ex: Resend para SendGrid ou MailerSend) exige manutenção em um único arquivo (`email.service.js`).

### Negativas / Mitigações:
- **Envio Síncrono no Request Cycle**: Chamadas HTTP para o Resend dentro do ciclo da requisição podem adicionar pequena latência.
  - *Mitigação*: Para o volume atual de operações, a latência do Resend (<200ms) é perfeitamente aceitável. Conforme a aplicação escalar, o serviço compartilhado poderá facilmente despachar mensagens para uma fila assíncrona (RabbitMQ/BullMQ/Redis) sem alterar os módulos consumidores.
