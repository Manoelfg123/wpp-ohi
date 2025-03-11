import { z } from 'zod';
import { MessageType } from '../../domain/enums/message-types.enum';
import { MessageStatus } from '../../domain/enums/message-status.enum';

/**
 * Esquema para validação de opções de mensagem
 */
const messageOptionsSchema = z.object({
  quoted: z.object({
    id: z.string(),
    type: z.string(),
  }).optional(),
}).optional();

/**
 * Esquema para validação de mensagem de texto
 */
export const textMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    text: z.string().min(1).max(4096),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem de mídia
 */
export const mediaMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    type: z.nativeEnum(MessageType).refine(
      (val: MessageType) => [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.DOCUMENT].includes(val),
      { message: 'Tipo de mídia inválido' }
    ),
    media: z.string().min(1),
    caption: z.string().max(1024).optional(),
    options: z.object({
      quoted: z.object({
        id: z.string(),
        type: z.string(),
      }).optional(),
      filename: z.string().optional(),
      mimetype: z.string().optional(),
    }).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem de localização
 */
export const locationMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().optional(),
    address: z.string().optional(),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem de contato
 */
export const contactMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    contact: z.object({
      fullName: z.string().min(1),
      phoneNumber: z.string().min(8),
      organization: z.string().optional(),
      email: z.string().email().optional(),
    }),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem com botões
 */
export const buttonMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    text: z.string().min(1).max(4096),
    footer: z.string().max(256).optional(),
    buttons: z.array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(20),
      })
    ).min(1).max(3),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem com lista
 */
export const listMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    text: z.string().min(1).max(4096),
    footer: z.string().max(256).optional(),
    title: z.string().max(256).optional(),
    buttonText: z.string().min(1).max(20),
    sections: z.array(
      z.object({
        title: z.string().min(1).max(256),
        rows: z.array(
          z.object({
            id: z.string(),
            title: z.string().min(1).max(256),
            description: z.string().max(256).optional(),
          })
        ).min(1),
      })
    ).min(1),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem de reação
 */
export const reactionMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    messageId: z.string().min(1),
    reaction: z.string().min(1).max(2),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de mensagem de sticker
 */
export const stickerMessageSchema = z.object({
  body: z.object({
    to: z.string().min(8),
    sticker: z.string().min(1),
    options: messageOptionsSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de parâmetros de ID de mensagem
 */
export const messageIdSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid(),
    messageId: z.string().uuid(),
  }),
});

/**
 * Esquema para validação de parâmetros de listagem de mensagens
 */
export const listMessagesSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    status: z.nativeEnum(MessageStatus).optional(),
    type: z.nativeEnum(MessageType).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
