import { CorsOptions } from 'cors';
import 'dotenv/config';

/**
 * Configuração do CORS para a API
 */
export const corsConfig: CorsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400 // 24 horas
};
