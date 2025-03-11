import { z } from 'zod';
import { SessionStatus } from '../../domain/enums/session-status.enum';

/**
 * Esquema para validação de criação de sessão com QR Code
 */
export const createSessionWithQRSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
    config: z.object({
      qrTimeout: z.number().int().min(30000).max(300000).optional(), // Entre 30s e 5min
      restartOnAuthFail: z.boolean().optional(),
      maxRetries: z.number().int().min(0).max(10).optional(),
      browser: z.tuple([z.string(), z.string(), z.string()]).optional(),
    }).optional(),
    webhookUrl: z.string().url().optional(),
  }),
});


/**
 * Esquema para validação de configuração de sessão
 */
export const sessionConfigSchema = z.object({
  restartOnAuthFail: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  browser: z.tuple([z.string(), z.string(), z.string()]).optional(),
  qrTimeout: z.number().int().min(10000).max(300000).optional(), // Entre 10s e 5min
}).optional();

/**
 * Esquema para validação de criação de sessão
 */
export const createSessionSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
    config: sessionConfigSchema,
    webhookUrl: z.string().url().optional(),
  }),
});

/**
 * Esquema para validação de atualização de sessão
 */
export const updateSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    config: sessionConfigSchema,
    webhookUrl: z.string().url().optional().nullable(),
  }),
});

/**
 * Esquema para validação de parâmetros de ID de sessão
 */
export const sessionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de parâmetros de listagem de sessões
 */
export const listSessionsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(SessionStatus).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
