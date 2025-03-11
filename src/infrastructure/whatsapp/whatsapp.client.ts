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
   * Obtém o socket de uma sessão
   * @param sessionId ID da sessão
   */
  private async getSocket(sessionId: string): Promise<WASocket> {
    const socket = whatsAppSessionManager.getSocket(sessionId);
    
    if (!socket) {
      logger.warn(`Socket não encontrado para sessão ${sessionId}. Tentando reconectar...`);
      
      // Tenta reconectar a sessão
      try {
        await whatsAppSessionManager.startSession(sessionId);
        
        // Aguarda um momento para a conexão ser estabelecida
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
    
    // Verifica se o socket está realmente conectado
    if (!socket.user || !socket.user.id) {
      logger.warn(`Socket encontrado mas não está autenticado para sessão ${sessionId}. Tentando reconectar...`);
      
      try {
        await whatsAppSessionManager.startSession(sessionId);
        
        // Aguarda um momento para a conexão ser estabelecida
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
      
      // Cria o registro da mensagem no banco de dados
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.TEXT,
        content: { text: data.text },
        metadata: data.options,
      });
      
      // Prepara as opções da mensagem
      const messageOptions: any = {};
      
      // Adiciona mensagem citada se fornecida
      if (data.options?.quoted) {
        messageOptions.quoted = {
          key: { 
            id: data.options.quoted.id,
            remoteJid: jid,
            fromMe: true
          }
        };
      }
      
      // Prepara o conteúdo da mensagem
      const content = {
        text: data.text
      };
      
      logger.debug(`Enviando mensagem via Baileys`, { 
        jid, 
        content, 
        options: messageOptions 
      });
      
      // Envia a mensagem com tratamento de erro melhorado
      const result = await socket.sendMessage(jid, content, messageOptions);
      
      if (!result) {
        throw new WhatsAppError('Não foi possível enviar a mensagem: Resposta vazia do WhatsApp');
      }
      
      logger.debug(`Mensagem enviada com sucesso`, { 
        messageId: result.key?.id,
        result 
      });
      
      // Atualiza o ID da mensagem no banco de dados com validação
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
      
      // Determina o tipo de conteúdo
      let mediaContent: Buffer | { url: string };
      
      if (typeof data.media === 'string') {
        if (isBase64(data.media)) {
          // Converte Base64 para Buffer
          mediaContent = base64ToBuffer(data.media);
        } else if (isValidUrl(data.media)) {
          // URL externa
          mediaContent = { url: data.media };
        } else {
          throw new WhatsAppError('Formato de mídia inválido. Forneça uma URL válida ou Base64.');
        }
      } else {
        // Já é um Buffer
        mediaContent = data.media;
      }
      
      // Cria o registro da mensagem no banco de dados
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: data.type,
        content: { 
          media: typeof data.media === 'string' ? data.media : '[Buffer]',
          caption: data.caption,
          filename: data.options?.filename,
          mimetype: data.options?.mimetype,
        },
        metadata: data.options,
      });
      
      // Opções para mensagem citada
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      // Prepara o conteúdo baseado no tipo
      let content: any;
      
      switch (data.type) {
        case MessageType.IMAGE:
          content = {
            image: mediaContent,
            caption: data.caption,
            mimetype: data.options?.mimetype || 'image/jpeg',
          };
          break;
          
        case MessageType.VIDEO:
          content = {
            video: mediaContent,
            caption: data.caption,
            mimetype: data.options?.mimetype || 'video/mp4',
          };
          break;
          
        case MessageType.AUDIO:
          content = {
            audio: mediaContent,
            mimetype: data.options?.mimetype || 'audio/mp4',
            ptt: true, // Reproduzir como nota de voz
          };
          break;
          
        case MessageType.DOCUMENT:
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
      
      // Envia a mensagem
      const result = await socket.sendMessage(jid, content, quoted);
      
      // Atualiza o ID da mensagem no banco de dados
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
      
      // Cria o registro da mensagem no banco de dados
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
      
      // Opções para mensagem citada
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      // Prepara o conteúdo da localização
      const content = {
        location: {
          degreesLatitude: data.latitude,
          degreesLongitude: data.longitude,
          name: data.name,
          address: data.address,
        },
      };
      
      // Envia a mensagem
      const result = await socket.sendMessage(jid, content, quoted);
      
      // Atualiza o ID da mensagem no banco de dados
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
      
      // Cria o registro da mensagem no banco de dados
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.CONTACT,
        content: { contact: data.contact },
        metadata: data.options,
      });
      
      // Opções para mensagem citada
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      // Prepara o contato no formato do WhatsApp
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${data.contact.fullName}\nTEL;type=CELL;type=VOICE;waid=${data.contact.phoneNumber}:${data.contact.phoneNumber}\n`;
      
      // Adiciona campos opcionais
      const vcardExtras = [];
      
      if (data.contact.organization) {
        vcardExtras.push(`ORG:${data.contact.organization}`);
      }
      
      if (data.contact.email) {
        vcardExtras.push(`EMAIL:${data.contact.email}`);
      }
      
      const fullVcard = `${vcard}${vcardExtras.join('\n')}\nEND:VCARD`;
      
      // Prepara o conteúdo do contato
      const content = {
        contacts: {
          displayName: data.contact.fullName,
          contacts: [{ vcard: fullVcard }],
        },
      };
      
      // Envia a mensagem
      const result = await socket.sendMessage(jid, content, quoted);
      
      // Atualiza o ID da mensagem no banco de dados
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
      
      // Cria o registro da mensagem no banco de dados
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
      
      // Opções para mensagem citada
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      // Prepara os botões no formato do Baileys
      const buttons = data.buttons.map(button => ({
        buttonId: button.id,
        buttonText: { displayText: button.text },
        type: 1,
      }));
      
      // Prepara o conteúdo da mensagem com botões
      const content = {
        text: data.text,
        footer: data.footer,
        buttons,
      };
      
      // Envia a mensagem
      const result = await socket.sendMessage(jid, content, quoted);
      
      // Atualiza o ID da mensagem no banco de dados
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
      
      // Cria o registro da mensagem no banco de dados
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
      
      // Opções para mensagem citada
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      // Prepara as seções no formato do Baileys
      const sections = data.sections.map(section => ({
        title: section.title,
        rows: section.rows.map(row => ({
          rowId: row.id,
          title: row.title,
          description: row.description || '',
        })),
      }));
      
      // Prepara o conteúdo da mensagem com lista
      const content = {
        text: data.text,
        footer: data.footer,
        title: data.title,
        buttonText: data.buttonText,
        sections,
      };
      
      // Envia a mensagem
      const result = await socket.sendMessage(jid, content, quoted);
      
      // Atualiza o ID da mensagem no banco de dados
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
      
      // Cria o registro da mensagem no banco de dados
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
      
      // Prepara o conteúdo da reação
      const content = {
        react: {
          text: data.reaction,
          key: {
            remoteJid: jid,
            id: data.messageId,
          },
        },
      };
      
      // Envia a reação
      const result = await socket.sendMessage(jid, content);
      
      // Atualiza o ID da mensagem no banco de dados
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
      
      // Determina o tipo de conteúdo
      let stickerContent: Buffer | { url: string };
      
      if (typeof data.sticker === 'string') {
        if (isBase64(data.sticker)) {
          // Converte Base64 para Buffer
          stickerContent = base64ToBuffer(data.sticker);
        } else if (isValidUrl(data.sticker)) {
          // URL externa
          stickerContent = { url: data.sticker };
        } else {
          throw new WhatsAppError('Formato de sticker inválido. Forneça uma URL válida ou Base64.');
        }
      } else {
        // Já é um Buffer
        stickerContent = data.sticker;
      }
      
      // Cria o registro da mensagem no banco de dados
      const message = await this.messageRepository.create({
        sessionId,
        to: data.to,
        type: MessageType.STICKER,
        content: { 
          sticker: typeof data.sticker === 'string' ? data.sticker : '[Buffer]',
        },
        metadata: data.options,
      });
      
      // Opções para mensagem citada
      const quoted = data.options?.quoted 
        ? { quoted: { key: { id: data.options.quoted.id } } } 
        : {};
      
      // Prepara o conteúdo do sticker
      const content = {
        sticker: stickerContent,
      };
      
      // Envia o sticker
      const result = await socket.sendMessage(jid, content, quoted);
      
      // Atualiza o ID da mensagem no banco de dados
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
