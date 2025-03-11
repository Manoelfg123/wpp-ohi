import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

/**
 * Configuração do Swagger para documentação da API
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SaaS para WhatsApp Multi-Session',
      version,
      description: 'API para gerenciamento de múltiplas sessões do WhatsApp',
      license: {
        name: 'Privado',
      },
      contact: {
        name: 'Suporte',
        email: 'suporte@exemplo.com',
      },
    },
    servers: [
      {
      url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Erro de validação',
            },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              example: {
                name: ['O nome é obrigatório'],
                email: ['Email inválido'],
              },
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/api/routes/*.ts', './src/docs/schemas/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
