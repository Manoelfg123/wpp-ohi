import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../../utils/error.types';

/**
 * Middleware para validação de requisições usando Zod
 * @param schema Schema Zod para validação
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Valida o corpo, parâmetros e query da requisição
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      next();
    } catch (error) {
      // Formata os erros de validação do Zod
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const field = path.replace(/^(body|params|query)\./, '');
          
          if (!errors[field]) {
            errors[field] = [];
          }
          
          errors[field].push(err.message);
        });
        
        next(new ValidationError('Erro de validação', errors));
      } else {
        next(error);
      }
    }
  };
};
