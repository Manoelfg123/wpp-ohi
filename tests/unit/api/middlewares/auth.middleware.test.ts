import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../../../src/api/middlewares/auth.middleware';
import { UnauthorizedError } from '../../../../src/utils/error.types';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
    process.env.API_KEY = 'test_api_key';
  });

  it('should call next() when API key is valid', () => {
    mockRequest.headers = {
      'x-api-key': 'test_api_key',
    };

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should throw UnauthorizedError when API key is missing', () => {
    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(nextFunction.mock.calls[0][0].message).toBe('API Key não fornecida');
  });

  it('should throw UnauthorizedError when API key is invalid', () => {
    mockRequest.headers = {
      'x-api-key': 'invalid_api_key',
    };

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(nextFunction.mock.calls[0][0].message).toBe('API Key inválida');
  });
});
