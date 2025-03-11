import { DataSourceOptions } from 'typeorm';
import { SessionEntity, MessageEntity } from '../infrastructure/database/entities';
import 'dotenv/config';

/**
 * Configuração do banco de dados PostgreSQL usando TypeORM
 */
export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'whatsapp_saas',
  entities: [SessionEntity, MessageEntity],
  synchronize: process.env.NODE_ENV === 'development', // Apenas para desenvolvimento
  logging: process.env.NODE_ENV === 'development',
  migrations: [__dirname + '/../infrastructure/database/migrations/*.{js,ts}'],
  migrationsRun: true,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};
