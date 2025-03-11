import Redis from 'ioredis';
import 'dotenv/config';

/**
 * Configuração do cliente Redis
 */
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  keyPrefix: 'whatsapp_saas:',
  retryStrategy: (times: number) => {
    // Estratégia de reconexão com backoff exponencial
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

/**
 * Cria e exporta uma instância do cliente Redis
 */
export const createRedisClient = (): Redis => {
  return new Redis(redisConfig);
};
