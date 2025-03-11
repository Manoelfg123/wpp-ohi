import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../utils/error.types';
import logger from '../../utils/logger';
import 'dotenv/config';

/**
 * Middleware para autenticação via API Key
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const configApiKey = process.env.API_KEY;

    if (!apiKey) {
      throw new UnauthorizedError('API Key não fornecida');
    }

    if (apiKey !== configApiKey) {
      logger.warn(`Tentativa de acesso com API Key inválida: ${apiKey}`);
      throw new UnauthorizedError('API Key inválida');
    }

    next();
  } catch (error) {
    next(error);
  }
};
