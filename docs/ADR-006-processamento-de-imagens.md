# ADR 006: Processamento de Imagens em Servidor Próprio (In-Process) com Sharp e Multer

## Status
Aprovado

## Contexto
Com a implementação do cardápio de pratos na EasyFood, os restaurantes podem enviar fotos para representar seus itens. No entanto, o upload de arquivos de imagem em alta resolução sem tratamento prévio acarreta sérios problemas:
- Arquivos muito pesados aumentam o consumo de banda de rede e degradam a experiência de carregamento no cliente web/mobile.
- Formatos despadronizados ou metadados de orientação incorretos (EXIF) prejudicam a apresentação visual.
- Falhas de segurança com envio de formatos inesperados ou arquivos excessivamente volumosos.

Portanto, a EasyFood necessita receber as imagens, validar o formato e o tamanho, corrigir a orientação, redimensionar para dimensões padronizadas e comprimir em um formato web moderno (WebP).

## Alternativas Consideradas

1. **Processar dentro da API EasyFood (In-Process com Sharp & Multer)**:
   - A própria aplicação Node.js recebe a imagem em memória e utiliza a biblioteca libvips/Sharp para manipulação síncrona/assíncrona no processo da aplicação.
2. **Criar um Serviço Independente / Worker de Processamento**:
   - Uma fila (ex: RabbitMQ/SQS) recebe o job de upload e um serviço dedicado faz o processamento das imagens em background.
3. **Utilizar Arquitetura Serverless / FaaS (Cloud Functions / AWS Lambda)**:
   - O upload dispara uma função Serverless acionada por eventos de bucket de armazenamento para otimizar a imagem sob demanda.

## Decisão
Decidimos **manter o processamento de imagens dentro do servidor da API EasyFood** utilizando as bibliotecas `multer` (para recepção multipart em memória até 5 MB) e `sharp` (para redimensionamento até 800px de largura e conversão para WebP com qualidade 80).

## Justificativa
- **Simplicidade**: Dispensa a configuração, deploy e monitoramento de serviços distribuídos ou infraestrutura de filas.
- **Baixo Volume Inicial de Imagens**: O escopo acadêmico e estágio atual da aplicação operam com volume moderado de cadastros.
- **Aproveitamento da Infraestrutura Existente**: Reutiliza a instância Node.js já em execução, reduzindo custos e latência de orquestração.
- **Facilidade de Implementação**: Integração direta via middleware (`upload.middleware.js`) e serviço compartilhado (`image.service.js`).
- **Contexto Acadêmico do Projeto**: Foco na consolidação dos conceitos de arquitetura modular e serviços compartilhados.

*Importante*: Nossa decisão não significa que Serverless ou workers sejam soluções inadequadas. Significa apenas que, neste momento de evolução do produto, a alternativa in-process atende melhor às necessidades com o menor custo de complexidade.

## Consequências

### Vantagens:
- **Menor Complexidade Inicial**: Não há dependência de filas, mensageria ou serviços em nuvem de terceiros.
- **Menos Componentes para Configurar**: Apenas bibliotecas de runtime Node.js padrão.
- **Resposta Imediata**: A URL da imagem otimizada é retornada imediatamente na resposta da requisição.
- **Desacoplamento Modular**: A lógica de manipulação gráfica foi isolada no módulo transversal `src/modules/shared/image.service.js`.

### Limitações:
- **Consumo de CPU e Memória**: Processamento intensivo de imagem pela biblioteca libvips consome ciclos da CPU do servidor da API.
- **Possível Impacto em Concorrência**: Requisições simultâneas de uploads grandes podem concorrer com o tráfego da API.
- **Persistência Efêmera**: No ambiente atual de container, o armazenamento local em `uploads/` é efêmero. Conforme o volume escalar, o armazenamento será migrado para um provedor externo (ex: AWS S3, Google Cloud Storage).
