import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../utils/error.types';
import logger from '../../utils/logger';

/**
 * Middleware para tratamento global de erros
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Log do erro
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Verifica se é um erro da aplicação
  if (error instanceof AppError) {
    // Tratamento especial para erros de validação
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        errors: error.errors,
      });
      return;
    }

    // Outros erros da aplicação
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
    return;
  }

  // Erros não tratados
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  });
};
