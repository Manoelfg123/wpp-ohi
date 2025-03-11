import { MessageType } from '../enums/message-types.enum';
import { MessageStatus } from '../enums/message-status.enum';

/**
 * Interface para criação de mensagem
 */
export interface ICreateMessageDTO {
  sessionId: string;
  messageId?: string;
  type: MessageType;
  content: Record<string, any>;
  from?: string;
  to: string;
  timestamp?: number;
  isFromMe?: boolean;
  status?: MessageStatus;
  metadata?: Record<string, any>;
}

/**
 * Interface para mensagem de texto
 */
export interface ITextMessage {
  to: string;
  text: string;
  options?: {
    quoted?: { id: string };
    mentions?: string[];
  };
}

/**
 * Interface para mensagem de mídia
 */
export interface IMediaMessage {
  to: string;
  media: Buffer | string;
  caption?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  options?: {
    quoted?: { id: string };
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
  options?: {
    quoted?: { id: string };
  };
}

/**
 * Interface para contato
 */
export interface IContact {
  fullName: string;
  phoneNumber: string;
  organization?: string;
  email?: string;
}

/**
 * Interface para mensagem de contato
 */
export interface IContactMessage {
  to: string;
  contact: IContact;
  options?: {
    quoted?: { id: string };
  };
}

/**
 * Interface para botão
 */
export interface IButton {
  id: string;
  text: string;
}

/**
 * Interface para mensagem com botões
 */
export interface IButtonMessage {
  to: string;
  text: string;
  buttons: IButton[];
  footer?: string;
  options?: {
    quoted?: { id: string };
  };
}

/**
 * Interface para seção de lista
 */
export interface IListSection {
  title: string;
  rows: {
    id: string;
    title: string;
    description?: string;
  }[];
}

/**
 * Interface para mensagem com lista
 */
export interface IListMessage {
  to: string;
  title: string;
  text: string;
  buttonText: string;
  sections: IListSection[];
  footer?: string;
  options?: {
    quoted?: { id: string };
  };
}

/**
 * Interface para mensagem de reação
 */
export interface IReactionMessage {
  to: string;
  messageId: string;
  reaction: string;
  options?: {
    quoted?: { id: string };
  };
}

/**
 * Interface para mensagem de sticker
 */
export interface IStickerMessage {
  to: string;
  sticker: Buffer | string;
  options?: {
    quoted?: { id: string };
  };
}

/**
 * Interface para resposta de mensagem
 */
export interface IMessageResponse {
  id: string;
  messageId?: string;
  sessionId: string;
  type: MessageType;
  content: Record<string, any>;
  from?: string;
  to: string;
  timestamp: number;
  isFromMe: boolean;
  status: MessageStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para detalhes de mensagem
 */
export interface IMessageDetails extends IMessageResponse {
  quotedMessage?: IMessageResponse;
}
