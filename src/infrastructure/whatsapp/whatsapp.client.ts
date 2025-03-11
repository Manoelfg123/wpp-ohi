import { proto, WASocket } from '@whiskeysockets/baileys';
import { whatsAppSessionManager } from './session.manager';
import { MessageRepository } from '../database/repositories/message.repository';
import { MessageType } from '../../domain/enums/message-types.enum';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { 
  ITextMessage, 
  IMediaMessage, 
  ILocationMessage, 
  IContactMessage, 
  IButtonMessage, 
  IListMessage, 
  IReactionMessage, 
  IStickerMessage,
  IMessageResponse
} from '../../domain/interfaces/message.interface';
import { WhatsAppError } from '../../utils/error.types';
import { formatPhoneNumber, base64ToBuffer, isBase64, isValidUrl } from '../../utils/helpers';
import logger from '../../utils/logger';

/**
 * Cliente para envio de mensagens do WhatsApp
 */
export class WhatsAppClient {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  /**
   * Converte tipo de mídia em MessageType
   */
  private getMessageTypeFromMediaType(mediaType: 'image' | 'video' | 'audio' | 'document'): MessageType {
    switch (mediaType) {
      case 'image':
        return MessageType.IMAGE;
      case 'video':
        return MessageType.VIDEO;
      case 'audio':
        return MessageType.AUDIO;
      case 'document':
        return MessageType.DOCUMENT;
      default:
        throw new WhatsAppError(`Tipo de mídia não suportado: ${mediaType}`);
    }
  }

  /**
   * Obtém o socket de uma sessão
   * @param sessionId ID da sessão
   */
  private async getSocket(sessionId: string): Promise<WASocket> {
    const socket = whatsAppSessionManager.getSocket(sessionId);
    
    if (!socket) {
      logger.warn(`Socket não encontrado para sessão ${sessionId}. Tentando reconectar...`);
      
      try {
        await whatsAppSessionManager.startSession(sessionId);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const reconnectedSocket = whatsAppSessionManager.getSocket(sessionId);
        if (!reconnectedSocket) {
          throw new WhatsAppError(`Não foi possível reconectar a sessão ${sessionId}`);
        }
        
        return reconnectedSocket;
      } catch (error) {
        logger.error(`Erro ao reconectar sessão ${sessionId}:`, error);
        throw new WhatsAppError(`Sessão ${sessionId} não está ativa e a reconexão falhou`);
      }
    }
    
    if (!socket.user || !socket.user.id) {
      logger.warn(`Socket encontrado mas não está autenticado para sessão ${sessionId}. Tentando reconectar...`);
      
      try {
        await whatsAppSessionManager.startSession(sessionId);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const reconnectedSocket = whatsAppSessionManager.getSocket(sessionId);
        if (!reconnectedSocket || !reconnectedSocket.user || !reconnectedSocket.user.id) {
          throw new WhatsAppError(`Não foi possível autenticar a sessão ${sessionId}`);
        }
        
        return reconnectedSocket;
      } catch (error) {
        logger.error(`Erro ao reconectar sessão ${sessionId}:`, error);
        throw new WhatsAppError(`Sessão ${sessionId} não está autenticada e a reconexão falhou`);
      }
    }
    
    return socket;
  }

  /**
   * Envia uma mensagem de texto
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendTextMessage(sessionId: string, data: ITextMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      logger.debug(`Preparando para enviar mensagem de texto para ${jid}`, { 
        sessionId, 
        text: data.text 
      });
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.TEXT,
        content: { text: data.text },
        metadata: data.options,
      });
      
      const messageOptions: any = {};
      
      if (data.options?.quoted) {
        messageOptions.quoted = {
          key: { 
            id: data.options.quoted.id,
            remoteJid: jid,
            fromMe: true
          }
        };
      }
      
      const content = {
        text: data.text
      };
      
      logger.debug(`Enviando mensagem via Baileys`, { 
        jid, 
        content, 
        options: messageOptions 
      });
      
      const result = await socket.sendMessage(jid, content, messageOptions);
      
      if (!result) {
        throw new WhatsAppError('Não foi possível enviar a mensagem: Resposta vazia do WhatsApp');
      }
      
      logger.debug(`Mensagem enviada com sucesso`, { 
        messageId: result.key?.id,
        result 
      });
      
      if (result.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      } else {
        logger.warn(`Mensagem enviada mas sem ID retornado`, { result });
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem de texto para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar mensagem: ${(error as Error).message}`);
    }
  }

  /**
   * Envia uma mensagem de mídia (imagem, vídeo, áudio, documento)
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendMediaMessage(sessionId: string, data: IMediaMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      let mediaContent: Buffer | { url: string };
      
      if (typeof data.media === 'string') {
        if (isBase64(data.media)) {
          mediaContent = base64ToBuffer(data.media);
        } else if (isValidUrl(data.media)) {
          mediaContent = { url: data.media };
        } else {
          throw new WhatsAppError('Formato de mídia inválido. Forneça uma URL válida ou Base64.');
        }
      } else {
        mediaContent = data.media;
      }
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: this.getMessageTypeFromMediaType(data.type),
        content: { 
          media: typeof data.media === 'string' ? data.media : '[Buffer]',
          caption: data.caption,
          filename: data.options?.filename,
          mimetype: data.options?.mimetype,
        },
        metadata: data.options,
      });
      
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      let content: any;
      
      switch (data.type) {
        case 'image':
          content = {
            image: mediaContent,
            caption: data.caption,
            mimetype: data.options?.mimetype || 'image/jpeg',
          };
          break;
          
        case 'video':
          content = {
            video: mediaContent,
            caption: data.caption,
            mimetype: data.options?.mimetype || 'video/mp4',
          };
          break;
          
        case 'audio':
          content = {
            audio: mediaContent,
            mimetype: data.options?.mimetype || 'audio/mp4',
            ptt: true,
          };
          break;
          
        case 'document':
          content = {
            document: mediaContent,
            mimetype: data.options?.mimetype || 'application/octet-stream',
            fileName: data.options?.filename || 'document',
            caption: data.caption,
          };
          break;
          
        default:
          throw new WhatsAppError(`Tipo de mídia não suportado: ${data.type}`);
      }
      
      const result = await socket.sendMessage(jid, content, quoted);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem de mídia para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar mídia: ${(error as Error).message}`);
    }
  }

  /**
   * Envia uma mensagem de localização
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendLocationMessage(sessionId: string, data: ILocationMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.LOCATION,
        content: { 
          latitude: data.latitude,
          longitude: data.longitude,
          name: data.name,
          address: data.address,
        },
        metadata: data.options,
      });
      
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      const content = {
        location: {
          degreesLatitude: data.latitude,
          degreesLongitude: data.longitude,
          name: data.name,
          address: data.address,
        },
      };
      
      const result = await socket.sendMessage(jid, content, quoted);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar localização para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar localização: ${(error as Error).message}`);
    }
  }

  /**
   * Envia uma mensagem de contato
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendContactMessage(sessionId: string, data: IContactMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.CONTACT,
        content: { contact: data.contact },
        metadata: data.options,
      });
      
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${data.contact.fullName}\nTEL;type=CELL;type=VOICE;waid=${data.contact.phoneNumber}:${data.contact.phoneNumber}\n`;
      
      const vcardExtras = [];
      
      if (data.contact.organization) {
        vcardExtras.push(`ORG:${data.contact.organization}`);
      }
      
      if (data.contact.email) {
        vcardExtras.push(`EMAIL:${data.contact.email}`);
      }
      
      const fullVcard = `${vcard}${vcardExtras.join('\n')}\nEND:VCARD`;
      
      const content = {
        contacts: {
          displayName: data.contact.fullName,
          contacts: [{ vcard: fullVcard }],
        },
      };
      
      const result = await socket.sendMessage(jid, content, quoted);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar contato para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar contato: ${(error as Error).message}`);
    }
  }

  /**
   * Envia uma mensagem com botões
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendButtonMessage(sessionId: string, data: IButtonMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.BUTTONS,
        content: { 
          text: data.text,
          footer: data.footer,
          buttons: data.buttons,
        },
        metadata: data.options,
      });
      
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      const buttons = data.buttons.map(button => ({
        buttonId: button.id,
        buttonText: { displayText: button.text },
        type: 1,
      }));
      
      const content = {
        text: data.text,
        footer: data.footer,
        buttons,
      };
      
      const result = await socket.sendMessage(jid, content, quoted);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem com botões para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar botões: ${(error as Error).message}`);
    }
  }

  /**
   * Envia uma mensagem com lista
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendListMessage(sessionId: string, data: IListMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.LIST,
        content: { 
          text: data.text,
          footer: data.footer,
          title: data.title,
          buttonText: data.buttonText,
          sections: data.sections,
        },
        metadata: data.options,
      });
      
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      const sections = data.sections.map(section => ({
        title: section.title,
        rows: section.rows.map(row => ({
          rowId: row.id,
          title: row.title,
          description: row.description || '',
        })),
      }));
      
      const content = {
        text: data.text,
        footer: data.footer,
        title: data.title,
        buttonText: data.buttonText,
        sections,
      };
      
      const result = await socket.sendMessage(jid, content, quoted);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem com lista para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar lista: ${(error as Error).message}`);
    }
  }

  /**
   * Envia uma reação a uma mensagem
   * @param sessionId ID da sessão
   * @param data Dados da reação
   */
  async sendReactionMessage(sessionId: string, data: IReactionMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.REACTION,
        content: { 
          messageId: data.messageId,
          reaction: data.reaction,
        },
        metadata: data.options,
      });
      
      const content = {
        react: {
          text: data.reaction,
          key: {
            remoteJid: jid,
            id: data.messageId,
          },
        },
      };
      
      const result = await socket.sendMessage(jid, content);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar reação para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar reação: ${(error as Error).message}`);
    }
  }

  /**
   * Envia um sticker
   * @param sessionId ID da sessão
   * @param data Dados do sticker
   */
  async sendStickerMessage(sessionId: string, data: IStickerMessage): Promise<IMessageResponse> {
    try {
      const socket = await this.getSocket(sessionId);
      const jid = formatPhoneNumber(data.to);
      
      let stickerContent: Buffer | { url: string };
      
      if (typeof data.sticker === 'string') {
        if (isBase64(data.sticker)) {
          stickerContent = base64ToBuffer(data.sticker);
        } else if (isValidUrl(data.sticker)) {
          stickerContent = { url: data.sticker };
        } else {
          throw new WhatsAppError('Formato de sticker inválido. Forneça uma URL válida ou Base64.');
        }
      } else {
        stickerContent = data.sticker;
      }
      
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.STICKER,
        content: { 
          sticker: typeof data.sticker === 'string' ? data.sticker : '[Buffer]',
        },
        metadata: data.options,
      });
      
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      const content = {
        sticker: stickerContent,
      };
      
      const result = await socket.sendMessage(jid, content, quoted);
      
      if (result?.key?.id) {
        await this.messageRepository.updateMessageId(message.id, result.key.id);
        await this.messageRepository.updateStatus(message.id, MessageStatus.SENT);
        message.messageId = result.key.id;
        message.status = MessageStatus.SENT;
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao enviar sticker para a sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao enviar sticker: ${(error as Error).message}`);
    }
  }
}

// Singleton
export const whatsAppClient = new WhatsAppClient();
