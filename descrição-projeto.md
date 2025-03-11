# Projeto: API SaaS para WhatsApp Multi-Session (TypeScript)

## Visão Geral

Este documento detalha a implementação de uma API SaaS para WhatsApp com suporte a múltiplas sessões independentes utilizando TypeScript. O sistema é projetado para ser robusto, seguro, bem estruturado e escalável, permitindo o envio e recebimento de mensagens e eventos em tempo real.

## Requisitos Funcionais

### 1. Autenticação
- Acesso à API exclusivamente através de API Key configurada no arquivo `.env`
- CORS configurável via `.env` (domínio específico ou `*`)

### 2. Gestão de Sessões (Multi-sessions SaaS)
- Suporte para 10-100 sessões ativas simultâneas
- Cada sessão possui um ID único (UUID aleatório)
- Geração de QR Code para conexão com WhatsApp (apenas código, sem armazenar imagem)
- Operações:
  - Criar sessão
  - Editar configurações de sessão
  - Excluir sessão
  - Consultar status de sessão (conectada, desconectada, aguardando QR Code, etc.)

### 3. Envio de Mensagens
- Suporte a todos os tipos de mensagens do WhatsApp:
  - Texto
  - Áudio
  - Vídeo
  - Imagem
  - Documentos
  - Contatos
  - Localização
  - Stickers
  - Botões interativos e listas (padrão Baileys)
  - Reações a mensagens
  - Mensagens temporárias
  - Edição de mensagens
  - Status/Stories
- Processamento assíncrono
- Controle de status de entrega

### 4. Recebimento de Eventos
- Processamento de eventos em tempo real do WhatsApp
- Publicação automática em filas no RabbitMQ (`platform_events`)
- Adição do parâmetro `platform` com valor `whatsapp_unofficial`

## Arquitetura Técnica

### Tecnologias

- **Backend**: Node.js com Express e TypeScript
- **Banco de Dados**: PostgreSQL com TypeORM
- **Cache**: Redis
- **Mensageria**: RabbitMQ com amqplib
- **Documentação**: Swagger/OpenAPI com swagger-jsdoc e swagger-ui-express
- **Biblioteca WhatsApp**: Baileys (@whiskeysockets/baileys)
- **Containerização**: Docker e Docker Compose
- **Validação**: Zod ou Joi
- **Logs**: Winston ou Pino

### Estrutura de Diretórios

```
whatsapp-saas-api/
│
├── src/
│   ├── config/                      # Configurações da aplicação
│   │   ├── database.config.ts       # Configuração PostgreSQL
│   │   ├── redis.config.ts          # Configuração Redis
│   │   ├── rabbitmq.config.ts       # Configuração RabbitMQ
│   │   ├── cors.config.ts           # Configuração CORS
│   │   └── index.ts                 # Exporta configurações
│   │
│   ├── api/                         # Componentes da API
│   │   ├── middlewares/             # Middlewares Express
│   │   │   ├── auth.middleware.ts   # Middleware de autenticação API Key
│   │   │   ├── error.middleware.ts  # Tratamento de erros global
│   │   │   └── validators.ts        # Validadores de entrada
│   │   │
│   │   ├── routes/                  # Rotas da API
│   │   │   ├── session.routes.ts    # Rotas de gestão de sessões
│   │   │   ├── message.routes.ts    # Rotas de envio de mensagens
│   │   │   └── index.ts             # Centraliza rotas
│   │   │
│   │   └── controllers/             # Controladores
│   │       ├── session.controller.ts
│   │       └── message.controller.ts
│   │
│   ├── domain/                      # Regras de negócio
│   │   ├── services/                # Serviços de domínio
│   │   │   ├── session.service.ts
│   │   │   └── message.service.ts
│   │   │
│   │   ├── models/                  # Modelos de dados
│   │   │   ├── session.model.ts
│   │   │   └── message.model.ts
│   │   │
│   │   ├── interfaces/              # Interfaces e tipos
│   │   │   ├── session.interface.ts
│   │   │   └── message.interface.ts
│   │   │
│   │   └── enums/                   # Enumerações e constantes
│   │       ├── session-status.enum.ts
│   │       └── message-types.enum.ts
│   │
│   ├── infrastructure/              # Implementações de infraestrutura
│   │   ├── database/                # Acesso ao banco de dados
│   │   │   ├── entities/            # Entidades TypeORM
│   │   │   │   ├── session.entity.ts
│   │   │   │   └── message.entity.ts
│   │   │   │
│   │   │   ├── repositories/        # Repositórios
│   │   │   │   ├── session.repository.ts
│   │   │   │   └── message.repository.ts
│   │   │   │
│   │   │   └── migrations/          # Migrações do TypeORM
│   │   │
│   │   ├── cache/                   # Operações com Redis
│   │   │   └── session.cache.ts
│   │   │
│   │   ├── messaging/               # Integração com RabbitMQ
│   │   │   ├── publisher.ts         # Publicador de mensagens
│   │   │   └── event.handlers.ts    # Handlers de eventos
│   │   │
│   │   └── whatsapp/                # Integração com Baileys
│   │       ├── session.manager.ts   # Gestão de sessões WhatsApp
│   │       ├── whatsapp.client.ts   # Cliente WhatsApp
│   │       └── event.listeners.ts   # Listeners de eventos WhatsApp
│   │
│   ├── utils/                       # Utilitários
│   │   ├── logger.ts                # Sistema de logs
│   │   ├── error.types.ts           # Tipos de erros
│   │   └── helpers.ts               # Funções auxiliares
│   │
│   ├── docs/                        # Documentação Swagger
│   │   ├── swagger.ts               # Configuração Swagger
│   │   └── schemas/                 # Esquemas de documentação
│   │       ├── session.schema.ts
│   │       └── message.schema.ts
│   │
│   └── app.ts                       # Configuração do Express
│
├── tests/                           # Testes unitários e de integração
│   ├── unit/                        # Testes unitários
│   └── integration/                 # Testes de integração
│
├── .env.example                     # Exemplo de variáveis de ambiente
├── docker-compose.yml               # Configuração Docker Compose
├── Dockerfile                       # Dockerfile para a API
├── package.json                     # Dependências e scripts
├── tsconfig.json                    # Configuração do TypeScript
├── .eslintrc.js                     # Configuração do ESLint
├── .prettierrc                      # Configuração do Prettier
└── README.md                        # Documentação do projeto
```

## Modelos de Dados

### Entidades TypeORM

#### SessionEntity

```typescript
// src/infrastructure/database/entities/session.entity.ts
import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { SessionStatus } from '../../../domain/enums/session-status.enum';

@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.DISCONNECTED
  })
  status: SessionStatus;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ nullable: true })
  webhookUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### MessageEntity

```typescript
// src/infrastructure/database/entities/message.entity.ts
import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { MessageStatus } from '../../../domain/enums/message-status.enum';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { SessionEntity } from './session.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: SessionEntity;

  @Column({
    type: 'enum',
    enum: MessageType
  })
  type: MessageType;

  @Column()
  toNumber: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING
  })
  status: MessageStatus;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;
}
```

### Enums

```typescript
// src/domain/enums/session-status.enum.ts
export enum SessionStatus {
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  QR_READY = 'qr_ready',
  ERROR = 'error',
  LOGGED_OUT = 'logged_out'
}

// src/domain/enums/message-types.enum.ts
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  BUTTONS = 'buttons',
  LIST = 'list',
  TEMPLATE = 'template',
  REACTION = 'reaction',
  STICKER = 'sticker',
  STORY = 'story'
}

// src/domain/enums/message-status.enum.ts
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}
```

### Interfaces

```typescript
// src/domain/interfaces/session.interface.ts
import { SessionStatus } from '../enums/session-status.enum';

export interface ISessionConfig {
  restartOnAuthFail?: boolean;
  maxRetries?: number;
  browser?: [string, string, string];
  qrTimeout?: number;
  [key: string]: any;
}

export interface ISession {
  id: string;
  name: string;
  status: SessionStatus;
  config: ISessionConfig;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQRCode {
  qrcode: string;
  expiresIn: number;
}

export interface ISessionInfo {
  id: string;
  name: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  clientInfo?: {
    platform?: string;
    phoneNumber?: string;
    deviceManufacturer?: string;
    connectedAt?: Date;
  };
  config: ISessionConfig;
}

// src/domain/interfaces/message.interface.ts
import { MessageType } from '../enums/message-types.enum';
import { MessageStatus } from '../enums/message-status.enum';

export interface IBaseMessageOptions {
  quoted?: {
    id: string;
    type: string;
  };
  [key: string]: any;
}

export interface ITextMessage {
  to: string;
  text: string;
  options?: IBaseMessageOptions;
}

export interface IMediaMessage {
  to: string;
  type: MessageType.IMAGE | MessageType.VIDEO | MessageType.AUDIO | MessageType.DOCUMENT;
  media: string | Buffer;
  caption?: string;
  options?: IBaseMessageOptions & {
    filename?: string;
    mimetype?: string;
  };
}

export interface ILocationMessage {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  options?: IBaseMessageOptions;
}

export interface IContactMessage {
  to: string;
  contact: {
    fullName: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
  };
  options?: IBaseMessageOptions;
}

export interface IButtonMessage {
  to: string;
  text: string;
  footer?: string;
  buttons: Array<{
    id: string;
    text: string;
  }>;
  options?: IBaseMessageOptions;
}

export interface IListMessage {
  to: string;
  text: string;
  footer?: string;
  title?: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  options?: IBaseMessageOptions;
}

export interface IReactionMessage {
  to: string;
  messageId: string;
  reaction: string;
  options?: IBaseMessageOptions;
}

export interface IStickerMessage {
  to: string;
  sticker: string | Buffer;
  options?: IBaseMessageOptions;
}

export interface IMessageResponse {
  id: string;
  messageId?: string;
  sessionId: string;
  to: string;
  type: MessageType;
  status: MessageStatus;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface IMessageStatusEvent {
  messageId: string;
  status: MessageStatus;
  to: string;
  timestamp: Date;
}

export interface IMessageDetails extends IMessageResponse {
  content: Record<string, any>;
  updatedAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}
```

## API Endpoints

### 1. Gestão de Sessões

#### Criar Sessão
- **Endpoint:** `POST /api/sessions`
- **Descrição:** Cria uma nova sessão do WhatsApp
- **Corpo da Requisição:**
```typescript
interface SessionCreateRequest {
  name: string;
  config?: {
    restartOnAuthFail?: boolean;
    maxRetries?: number;
    browser?: [string, string, string];
    qrTimeout?: number;
    [key: string]: any;
  };
  webhookUrl?: string;
}
```
- **Resposta:**
```typescript
interface SessionResponse {
  id: string;
  name: string;
  status: SessionStatus;
  createdAt: string;
  config: Record<string, any>;
}
```

#### Obter QR Code
- **Endpoint:** `GET /api/sessions/{id}/qrcode`
- **Descrição:** Retorna o QR Code para autenticação da sessão
- **Resposta:**
```typescript
interface QRCodeResponse {
  qrcode: string;
  expiresIn: number; // Segundos
}
```

#### Listar Sessões
- **Endpoint:** `GET /api/sessions`
- **Descrição:** Lista todas as sessões
- **Parâmetros de Query:**
  - `status`: Filtrar por status (opcional)
  - `page`: Número da página (opcional, padrão: 1)
  - `limit`: Limite por página (opcional, padrão: 10)
- **Resposta:**
```typescript
interface SessionsListResponse {
  total: number;
  page: number;
  limit: number;
  sessions: Array<{
    id: string;
    name: string;
    status: SessionStatus;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

#### Obter Detalhes da Sessão
- **Endpoint:** `GET /api/sessions/{id}`
- **Descrição:** Retorna detalhes de uma sessão específica
- **Resposta:**
```typescript
interface SessionDetailResponse {
  id: string;
  name: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  clientInfo?: {
    platform?: string;
    phoneNumber?: string;
    deviceManufacturer?: string;
    connectedAt?: string;
  };
  config: Record<string, any>;
}
```

#### Atualizar Sessão
- **Endpoint:** `PATCH /api/sessions/{id}`
- **Descrição:** Atualiza configurações de uma sessão
- **Corpo da Requisição:**
```typescript
interface SessionUpdateRequest {
  name?: string;
  config?: Record<string, any>;
  webhookUrl?: string;
}
```
- **Resposta:**
```typescript
interface SessionResponse {
  id: string;
  name: string;
  status: SessionStatus;
  updatedAt: string;
  config: Record<string, any>;
}
```

#### Desconectar Sessão
- **Endpoint:** `POST /api/sessions/{id}/disconnect`
- **Descrição:** Desconecta uma sessão ativa
- **Resposta:**
```typescript
interface SessionStatusResponse {
  id: string;
  status: SessionStatus;
  message: string;
}
```

#### Reconectar Sessão
- **Endpoint:** `POST /api/sessions/{id}/reconnect`
- **Descrição:** Reconecta uma sessão desconectada
- **Resposta:**
```typescript
interface SessionStatusResponse {
  id: string;
  status: SessionStatus;
  message: string;
}
```

#### Excluir Sessão
- **Endpoint:** `DELETE /api/sessions/{id}`
- **Descrição:** Remove uma sessão
- **Resposta:**
```typescript
interface DeleteResponse {
  message: string;
}
```

### 2. Envio de Mensagens

#### Enviar Mensagem de Texto
- **Endpoint:** `POST /api/sessions/{id}/messages/text`
- **Descrição:** Envia uma mensagem de texto
- **Corpo da Requisição:**
```typescript
interface TextMessageRequest {
  to: string;
  text: string;
  options?: {
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:**
```typescript
interface MessageResponse {
  id: string;
  messageId?: string;
  sessionId: string;
  to: string;
  type: MessageType;
  status: MessageStatus;
  createdAt: string;
}
```

#### Enviar Mensagem de Mídia (Imagem, Vídeo, Áudio, Documento)
- **Endpoint:** `POST /api/sessions/{id}/messages/media`
- **Descrição:** Envia uma mensagem com mídia
- **Corpo da Requisição:**
```typescript
interface MediaMessageRequest {
  to: string;
  type: "image" | "video" | "audio" | "document";
  media: string; // URL ou Base64
  caption?: string;
  options?: {
    filename?: string;
    mimetype?: string;
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Enviar Localização
- **Endpoint:** `POST /api/sessions/{id}/messages/location`
- **Descrição:** Envia uma localização
- **Corpo da Requisição:**
```typescript
interface LocationMessageRequest {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  options?: {
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Enviar Contato
- **Endpoint:** `POST /api/sessions/{id}/messages/contact`
- **Descrição:** Envia um contato
- **Corpo da Requisição:**
```typescript
interface ContactMessageRequest {
  to: string;
  contact: {
    fullName: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
  };
  options?: {
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Enviar Botões
- **Endpoint:** `POST /api/sessions/{id}/messages/buttons`
- **Descrição:** Envia mensagem com botões interativos
- **Corpo da Requisição:**
```typescript
interface ButtonsMessageRequest {
  to: string;
  text: string;
  footer?: string;
  buttons: Array<{
    id: string;
    text: string;
  }>;
  options?: {
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Enviar Lista
- **Endpoint:** `POST /api/sessions/{id}/messages/list`
- **Descrição:** Envia uma mensagem com lista de opções
- **Corpo da Requisição:**
```typescript
interface ListMessageRequest {
  to: string;
  text: string;
  footer?: string;
  title?: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  options?: {
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Enviar Reação
- **Endpoint:** `POST /api/sessions/{id}/messages/reaction`
- **Descrição:** Envia uma reação a uma mensagem
- **Corpo da Requisição:**
```typescript
interface ReactionMessageRequest {
  to: string;
  messageId: string;
  reaction: string;
  options?: {
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Enviar Sticker
- **Endpoint:** `POST /api/sessions/{id}/messages/sticker`
- **Descrição:** Envia um sticker
- **Corpo da Requisição:**
```typescript
interface StickerMessageRequest {
  to: string;
  sticker: string; // URL ou Base64
  options?: {
    quoted?: {
      id: string;
      type: string;
    };
    [key: string]: any;
  };
}
```
- **Resposta:** Similar à mensagem de texto

#### Consultar Status de Mensagem
- **Endpoint:** `GET /api/sessions/{sessionId}/messages/{messageId}`
- **Descrição:** Retorna o status atual de uma mensagem
- **Resposta:**
```typescript
interface MessageDetailResponse {
  id: string;
  messageId?: string;
  sessionId: string;
  to: string;
  type: MessageType;
  content: Record<string, any>;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  readAt?: string;
}
```

## Implementação Detalhada

### 1. Configuração TypeScript

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "strictPropertyInitialization": false,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. Configuração do Projeto

#### package.json
```json
{
  "name": "whatsapp-saas-api",
  "version": "1.0.0",
  "description": "API SaaS para WhatsApp com suporte a múltiplas sessões",
  "main": "dist/app.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js",
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "typeorm": "ts-node-dev ./node_modules/typeorm/cli.js",
    "migration:generate": "npm run typeorm -- migration:generate -n",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert",
    "lint": "eslint . --ext .ts",
    "test": "jest"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.5.0",
    "amqplib": "^0.10.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "ioredis": "^5.3.2",
    "pg": "^8.11.3",
    "pino": "^8.16.2",
    "pino-pretty": "^10.2.3",
    "qrcode": "^1.5.3",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "typeorm": "^0.3.17",
    "uuid": "^9.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/amqplib": "^0.10.4",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.10",
    "@types/node": "^20.10.1",
    "@types/qrcode": "^1.5.5",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.5",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.13.1",
    "@typescript-eslint/parser": "^6.13.1",
    "eslint": "^8.54.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.2"
  }
}
```

### 3. Implementação Básica do Sistema

#### Configuração da Aplicação (app.ts)
```typescript
// src/app.ts
import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { createConnection } from 'typeorm';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { dbConfig } from './config/database.config';
import routes from './api/routes';
import { errorMiddleware } from './api/middlewares/error.middleware';
import { authMiddleware } from './api/middlewares/auth.middleware';
import logger from './utils/logger';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS config
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with authentication
app.use('/api', authMiddleware, routes);

// Error handler
app.use(errorMiddleware);

// Start database connection and server
const startServer = async () => {
  try {
    await createConnection(dbConfig);
    logger.info('Database connected successfully');

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
```

#### Middleware de Autenticação
```typescript
// src/api/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { ApiError } from '../../utils/error.types';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.