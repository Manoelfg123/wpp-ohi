import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../../../../src/api/middlewares/error.middleware';
import { 
  AppError, 
  BadRequestError, 
  NotFoundError, 
  ValidationError 
} from '../../../../src/utils/error.types';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    nextFunction = jest.fn();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError('Erro de teste', 400);
    
    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Erro de teste',
    });
  });

  it('should handle NotFoundError correctly', () => {
    const error = new NotFoundError('Recurso não encontrado');
    
    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Recurso não encontrado',
    });
  });

  it('should handle BadRequestError correctly', () => {
    const error = new BadRequestError('Requisição inválida');
    
    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Requisição inválida',
    });
  });

  it('should handle ValidationError with errors object', () => {
    const validationErrors = {
      name: ['O nome é obrigatório'],
      email: ['Email inválido'],
    };
    
    const error = new ValidationError('Erro de validação', validationErrors);
    
    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Erro de validação',
      errors: validationErrors,
    });
  });

  it('should handle unknown errors as internal server error', () => {
    const error = new Error('Erro desconhecido');
    
    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Erro interno do servidor',
    });
  });
});
