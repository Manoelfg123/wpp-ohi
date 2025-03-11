import { proto } from '@whiskeysockets/baileys';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { IMessageHandler } from '../../../domain/interfaces/handlers.interface';
import { messageService } from '../../../domain/services/message.service';
import logger from '../../../utils/logger';

/**
 * Handler base para processamento de mensagens
 */
export abstract class BaseMessageHandler implements IMessageHandler {
  protected supportedTypes: MessageType[] = [];

  /**
   * Processa uma mensagem recebida
   * @param message Mensagem do WhatsApp
   * @param sessionId ID da sessão
   */
  async handleMessage(message: proto.IWebMessageInfo, sessionId: string): Promise<void> {
    try {
      const messageType = this.getMessageType(message);
      
      if (!this.canHandle(messageType)) {
        logger.debug(`Handler ${this.constructor.name} não suporta mensagens do tipo ${messageType}`);
        return;
      }

      logger.debug(`Processando mensagem do tipo ${messageType} com ${this.constructor.name}`);
      await this.processMessage(message, messageType, sessionId);
    } catch (error) {
      logger.error(`Erro ao processar mensagem com ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se o handler pode processar o tipo de mensagem
   * @param messageType Tipo da mensagem
   */
  canHandle(messageType: MessageType): boolean {
    return this.supportedTypes.includes(messageType);
  }

  /**
   * Processa a mensagem de acordo com seu tipo
   * @param message Mensagem do WhatsApp
   * @param messageType Tipo da mensagem
   * @param sessionId ID da sessão
   */
  protected abstract processMessage(
    message: proto.IWebMessageInfo,
    messageType: MessageType,
    sessionId: string
  ): Promise<void>;

  /**
   * Determina o tipo da mensagem com base em seu conteúdo
   * @param message Mensagem do WhatsApp
   */
  protected getMessageType(message: proto.IWebMessageInfo): MessageType {
    const messageContent = message.message || {};
    
    // Mensagens de grupo
    if (message.key?.remoteJid?.endsWith('@g.us')) {
      // Usa messageStubType para identificar tipos de mensagens de grupo
      switch (message.messageStubType) {
        case 1: // Criação de grupo
          return MessageType.GROUP_CREATE;
        case 2: // Alteração de configurações
          return MessageType.GROUP_SETTINGS;
        case 27: // Adição de participante
          return MessageType.GROUP_PARTICIPANT_ADD;
        case 28: // Remoção de participante
          return MessageType.GROUP_PARTICIPANT_REMOVE;
        case 29: // Promoção de participante
          return MessageType.GROUP_PARTICIPANT_PROMOTE;
        case 30: // Rebaixamento de participante
          return MessageType.GROUP_PARTICIPANT_DEMOTE;
      }
    }

    // Status/Stories
    if (message.key?.remoteJid === 'status@broadcast') {
      if (messageContent.imageMessage) return MessageType.STORY_IMAGE;
      if (messageContent.videoMessage) return MessageType.STORY_VIDEO;
      if (messageContent.conversation) return MessageType.STORY_TEXT;
    }

    // Mensagens básicas
    if (messageContent.conversation) return MessageType.TEXT;
    if (messageContent.imageMessage) return MessageType.IMAGE;
    if (messageContent.videoMessage) return MessageType.VIDEO;
    if (messageContent.audioMessage) return MessageType.AUDIO;
    if (messageContent.documentMessage) return MessageType.DOCUMENT;
    if (messageContent.locationMessage) return MessageType.LOCATION;
    if (messageContent.contactMessage) return MessageType.CONTACT;
    if (messageContent.buttonsMessage) return MessageType.BUTTONS;
    if (messageContent.listMessage) return MessageType.LIST;
    if (messageContent.templateMessage) return MessageType.TEMPLATE;
    if (messageContent.reactionMessage) return MessageType.REACTION;
    if (messageContent.stickerMessage) return MessageType.STICKER;

    logger.warn('Tipo de mensagem não identificado:', messageContent);
    return MessageType.TEXT; // Fallback para texto
  }

  /**
   * Salva a mensagem no banco de dados
   * @param message Mensagem do WhatsApp
   * @param messageType Tipo da mensagem
   * @param sessionId ID da sessão
   */
  protected async saveMessage(
    message: proto.IWebMessageInfo,
    messageType: MessageType,
    sessionId: string
  ): Promise<void> {
    try {
      await messageService.createMessage({
        sessionId,
        messageId: message.key.id!,
        type: messageType,
        content: message.message || {},
        from: message.key.remoteJid!,
        to: message.key.fromMe ? message.key.remoteJid! : message.key.participant || message.key.remoteJid!,
        timestamp: message.messageTimestamp as number,
        isFromMe: message.key.fromMe || false,
      });
    } catch (error) {
      logger.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  }
}
