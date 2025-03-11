/**
 * Classe base para erros da aplicação
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro para recursos não encontrados
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
  }
}

/**
 * Erro para requisições inválidas
 */
export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida') {
    super(message, 400);
  }
}

/**
 * Erro para falhas de autenticação
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
  }
}

/**
 * Erro para operações não permitidas
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Operação não permitida') {
    super(message, 403);
  }
}

/**
 * Erro para conflitos (ex: recurso já existe)
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflito de recursos') {
    super(message, 409);
  }
}

/**
 * Erro para falhas de serviços externos
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Serviço indisponível') {
    super(message, 503);
  }
}

/**
 * Erro para falhas de validação
 */
export class ValidationError extends BadRequestError {
  public readonly errors: Record<string, string[]>;

  constructor(message = 'Erro de validação', errors: Record<string, string[]> = {}) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Erro para falhas no WhatsApp
 */
export class WhatsAppError extends AppError {
  constructor(message = 'Erro no serviço do WhatsApp') {
    super(message, 500);
  }
}
