import * as amqp from 'amqplib';
import 'dotenv/config';

/**
 * Configuração do RabbitMQ
 */
export const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  eventsQueue: process.env.RABBITMQ_EVENTS_QUEUE || 'platform_events',
  retryAttempts: 5,
  retryDelay: 5000, // 5 segundos
};

/**
 * Cria e retorna uma conexão com o RabbitMQ
 */
export const createRabbitMQConnection = async (): Promise<any> => {
  try {
    return await amqp.connect(rabbitmqConfig.url);
  } catch (error) {
    console.error('Erro ao conectar ao RabbitMQ:', error);
    throw error;
  }
};

/**
 * Cria e retorna um canal do RabbitMQ
 * @param connection Conexão com o RabbitMQ
 */
export const createRabbitMQChannel = async (connection: any): Promise<any> => {
  try {
    const channel = await connection.createChannel();
    
    // Garante que a fila de eventos existe
    await channel.assertQueue(rabbitmqConfig.eventsQueue, {
      durable: true,
    });
    
    return channel;
  } catch (error) {
    console.error('Erro ao criar canal no RabbitMQ:', error);
    throw error;
  }
};
