import { Request, Response, NextFunction } from 'express';
import { validate } from '../../../../src/api/middlewares/validators';
import { ValidationError } from '../../../../src/utils/error.types';
import { z } from 'zod';

describe('Validators Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should call next() when validation passes', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    mockRequest.body = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    await validate(schema)(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should pass ValidationError to next() when validation fails', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18),
      }),
    });

    mockRequest.body = {
      name: 'Jo',
      email: 'not-an-email',
      age: 16,
    };

    await validate(schema)(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    
    const error = nextFunction.mock.calls[0][0] as ValidationError;
    expect(error.message).toBe('Erro de validação');
    expect(error.errors).toBeDefined();
    expect(Object.keys(error.errors).length).toBe(3);
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.age).toBeDefined();
  });

  it('should validate params correctly', async () => {
    const schema = z.object({
      params: z.object({
        id: z.string().uuid(),
      }),
    });

    mockRequest.params = {
      id: 'not-a-uuid',
    };

    await validate(schema)(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    
    const error = nextFunction.mock.calls[0][0] as ValidationError;
    expect(error.errors.id).toBeDefined();
  });

  it('should validate query correctly', async () => {
    const schema = z.object({
      query: z.object({
        page: z.string().regex(/^\d+$/),
        limit: z.string().regex(/^\d+$/),
      }),
    });

    mockRequest.query = {
      page: 'one',
      limit: '10',
    };

    await validate(schema)(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    
    const error = nextFunction.mock.calls[0][0] as ValidationError;
    expect(error.errors.page).toBeDefined();
    expect(error.errors.limit).toBeUndefined();
  });

  it('should pass non-Zod errors to next()', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
    });

    // Mock a non-Zod error
    const nonZodError = new Error('Non-Zod error');
    jest.spyOn(schema, 'parseAsync').mockRejectedValueOnce(nonZodError);

    await validate(schema)(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(nonZodError);
  });
});
