import { MessageType } from '../enums/message-types.enum';
import { MessageStatus } from '../enums/message-status.enum';

/**
 * Interface base para opções de mensagem
 */
export interface IBaseMessageOptions {
  quoted?: {
    id: string;
    type: string;
  };
  [key: string]: any;
}

/**
 * Interface para mensagem de texto
 */
export interface ITextMessage {
  to: string;
  text: string;
  options?: IBaseMessageOptions;
}

/**
 * Interface para mensagem de mídia (imagem, vídeo, áudio, documento)
 */
export interface IMediaMessage {
  to: string;
  type: MessageType.IMAGE | MessageType.VIDEO | MessageType.AUDIO | MessageType.DOCUMENT;
  media: string | Buffer;
  caption?: string;
  options?: IBaseMessageOptions & {
    filename?: string;
    mimetype?: string;
  };
}

/**
 * Interface para mensagem de localização
 */
export interface ILocationMessage {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  options?: IBaseMessageOptions;
}

/**
 * Interface para mensagem de contato
 */
export interface IContactMessage {
  to: string;
  contact: {
    fullName: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
  };
  options?: IBaseMessageOptions;
}

/**
 * Interface para mensagem com botões
 */
export interface IButtonMessage {
  to: string;
  text: string;
  footer?: string;
  buttons: Array<{
    id: string;
    text: string;
  }>;
  options?: IBaseMessageOptions;
}

/**
 * Interface para mensagem com lista
 */
export interface IListMessage {
  to: string;
  text: string;
  footer?: string;
  title?: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  options?: IBaseMessageOptions;
}

/**
 * Interface para mensagem de reação
 */
export interface IReactionMessage {
  to: string;
  messageId: string;
  reaction: string;
  options?: IBaseMessageOptions;
}

/**
 * Interface para mensagem de sticker
 */
export interface IStickerMessage {
  to: string;
  sticker: string | Buffer;
  options?: IBaseMessageOptions;
}

/**
 * Interface para resposta de envio de mensagem
 */
export interface IMessageResponse {
  id: string;
  messageId?: string;
  sessionId: string;
  to: string;
  type: MessageType;
  status: MessageStatus;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface para evento de status de mensagem
 */
export interface IMessageStatusEvent {
  messageId: string;
  status: MessageStatus;
  to: string;
  timestamp: Date;
}

/**
 * Interface para detalhes de uma mensagem
 */
export interface IMessageDetails extends IMessageResponse {
  content: Record<string, any>;
  updatedAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}
