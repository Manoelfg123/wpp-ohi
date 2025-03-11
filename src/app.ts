import 'dotenv/config';
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { dbConfig } from './config/database.config';
import { corsConfig } from './config/cors.config';
import { errorMiddleware } from './api/middlewares';
import routes from './api/routes';
import logger from './utils/logger';
import { eventPublisher } from './infrastructure/messaging/publisher';

// Inicialização do Express
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware para parsing de JSON e URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração do CORS
app.use(cors(corsConfig));

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota de verificação de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Rotas da API
app.use('/api', routes);

// Middleware de tratamento de erros (deve ser o último middleware)
app.use(errorMiddleware);

// Inicialização do banco de dados
export const dataSource = new DataSource(dbConfig);

// Função para inicializar o banco de dados
const initializeDatabase = async (): Promise<void> => {
  try {
    await dataSource.initialize();
    logger.info('Conexão com o banco de dados estabelecida com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
};

// Função para inicializar o publisher de eventos
const initializePublisher = async (): Promise<void> => {
  try {
    await eventPublisher.initialize();
    logger.info('Publisher de eventos inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar o publisher de eventos:', error);
    throw error;
  }
};

const startServer = async (): Promise<void> => {
  try {
    // Inicializa o banco de dados primeiro
    await initializeDatabase();

    // Depois inicializa o publisher de eventos
    await initializePublisher();

    // Por fim, inicia o servidor
    app.listen(port, () => {
      logger.info(`Servidor rodando na porta ${port}`);
      logger.info(`Documentação disponível em http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promessa rejeitada não tratada:', reason);
});

// Tratamento de encerramento do servidor
process.on('SIGINT', async () => {
  logger.info('Encerrando servidor...');
  
  try {
    // Fecha a conexão com o banco de dados
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      logger.info('Conexão com o banco de dados fechada com sucesso');
    }
    
    // Fecha o publisher de eventos
    await eventPublisher.close();
    logger.info('Publisher de eventos fechado com sucesso');
    
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao encerrar servidor:', error);
    process.exit(1);
  }
});

// Inicia o servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export { app };
