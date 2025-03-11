import * as amqp from 'amqplib';
import { rabbitmqConfig, createRabbitMQConnection, createRabbitMQChannel } from '../../config/rabbitmq.config';
import { createRedisClient } from '../../config/redis.config';
import logger from '../../utils/logger';
import { delay } from '../../utils/helpers';

/**
 * Classe para publicação de mensagens no RabbitMQ
 */
export class EventPublisher {
  private connection: any = null;
  private channel: any = null;
  private redisClient = createRedisClient();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = rabbitmqConfig.retryAttempts;
  private readonly reconnectDelay = rabbitmqConfig.retryDelay;
  private readonly fallbackKey = 'whatsapp_saas:events:fallback';

  /**
   * Inicializa a conexão com o RabbitMQ
   */
  async initialize(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Estabelece a conexão com o RabbitMQ
      this.connection = await createRabbitMQConnection();
      
      // Cria um canal
      this.channel = await createRabbitMQChannel(this.connection);
      
      // Configura handlers para eventos de conexão
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));
      
      // Reseta o contador de tentativas
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      logger.info('Conexão com RabbitMQ estabelecida com sucesso');
      
      // Processa eventos em fallback, se houver
      this.processFallbackEvents();
    } catch (error) {
      this.isConnecting = false;
      logger.error('Erro ao conectar ao RabbitMQ:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Publica um evento na fila
   * @param event Evento a ser publicado
   */
  async publishEvent(event: Record<string, any>): Promise<void> {
    try {
      // Adiciona o parâmetro platform
      const eventWithPlatform = {
        ...event,
        platform: 'whatsapp_unofficial',
        timestamp: new Date().toISOString(),
      };
      
      // Converte o evento para buffer
      const buffer = Buffer.from(JSON.stringify(eventWithPlatform));
      
      // Se não estiver conectado, tenta reconectar
      if (!this.channel) {
        await this.reconnect();
      }
      
      // Publica o evento
      if (this.channel) {
        this.channel.publish('', rabbitmqConfig.eventsQueue, buffer, {
          persistent: true,
          contentType: 'application/json',
        });
        
        logger.debug(`Evento publicado: ${JSON.stringify(eventWithPlatform)}`);
      } else {
        // Se ainda não estiver conectado, salva no Redis como fallback
        await this.saveFallbackEvent(eventWithPlatform);
      }
    } catch (error) {
      logger.error('Erro ao publicar evento:', error);
      
      // Salva o evento no Redis como fallback
      await this.saveFallbackEvent(event);
    }
  }

  /**
   * Salva um evento no Redis como fallback
   * @param event Evento a ser salvo
   */
  private async saveFallbackEvent(event: Record<string, any>): Promise<void> {
    try {
      const eventString = JSON.stringify({
        ...event,
        fallbackTimestamp: new Date().toISOString(),
      });
      
      // Adiciona o evento à lista no Redis
      await this.redisClient.rpush(this.fallbackKey, eventString);
      
      logger.info(`Evento salvo no Redis como fallback: ${eventString}`);
    } catch (error) {
      logger.error('Erro ao salvar evento no Redis:', error);
    }
  }

  /**
   * Processa eventos em fallback
   */
  private async processFallbackEvents(): Promise<void> {
    try {
      // Verifica se há eventos em fallback
      const length = await this.redisClient.llen(this.fallbackKey);
      
      if (length > 0) {
        logger.info(`Processando ${length} eventos em fallback`);
        
        // Processa até 100 eventos por vez
        const batchSize = 100;
        let processed = 0;
        
        while (processed < length) {
          // Obtém um lote de eventos
          const events = await this.redisClient.lrange(
            this.fallbackKey,
            0,
            batchSize - 1
          );
          
          // Publica cada evento
          for (const eventString of events) {
            try {
              const event = JSON.parse(eventString);
              
              // Publica o evento
              if (this.channel) {
                const buffer = Buffer.from(JSON.stringify(event));
                
                this.channel.publish('', rabbitmqConfig.eventsQueue, buffer, {
                  persistent: true,
                  contentType: 'application/json',
                });
                
                // Remove o evento da lista
                await this.redisClient.lrem(this.fallbackKey, 1, eventString);
                processed++;
              }
            } catch (error) {
              logger.error('Erro ao processar evento em fallback:', error);
            }
          }
          
          // Aguarda um pouco para não sobrecarregar
          await delay(100);
        }
        
        logger.info(`${processed} eventos em fallback processados com sucesso`);
      }
    } catch (error) {
      logger.error('Erro ao processar eventos em fallback:', error);
    }
  }

  /**
   * Manipula erros de conexão
   * @param error Erro de conexão
   */
  private handleConnectionError(error: Error): void {
    logger.error('Erro na conexão com RabbitMQ:', error);
    this.reconnect();
  }

  /**
   * Manipula fechamento de conexão
   */
  private handleConnectionClose(): void {
    logger.warn('Conexão com RabbitMQ fechada');
    this.connection = null;
    this.channel = null;
    this.reconnect();
  }

  /**
   * Tenta reconectar ao RabbitMQ
   */
  private async reconnect(): Promise<void> {
    if (this.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    
    this.reconnectAttempts++;
    
    // Calcula o delay com backoff exponencial
    const reconnectDelay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Máximo de 30 segundos
    );
    
    logger.info(`Tentando reconectar ao RabbitMQ em ${reconnectDelay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    // Aguarda antes de tentar reconectar
    await delay(reconnectDelay);
    
    // Tenta inicializar novamente
    this.initialize();
  }

  /**
   * Fecha a conexão com o RabbitMQ
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }
      
      await this.redisClient.quit();
      
      logger.info('Conexão com RabbitMQ fechada com sucesso');
    } catch (error) {
      logger.error('Erro ao fechar conexão com RabbitMQ:', error);
    }
  }
}

// Singleton
export const eventPublisher = new EventPublisher();
