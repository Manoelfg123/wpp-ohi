import { proto } from '@whiskeysockets/baileys';
import { messageHandlers } from './handlers';
import { MessageType } from '../../domain/enums/message-types.enum';
import logger from '../../utils/logger';

/**
 * Processador de mensagens recebidas do WhatsApp
 */
export class MessageProcessor {
  /**
   * Processa uma mensagem recebida
   * @param message Mensagem do WhatsApp
   * @param sessionId ID da sessão
   */
  async processMessage(message: proto.IWebMessageInfo, sessionId: string): Promise<void> {
    try {
      // Determina o tipo da mensagem
      const messageType = this.getMessageType(message);

      // Encontra o handler apropriado para o tipo de mensagem
      const handler = messageHandlers.find(h => h.canHandle(messageType));

      if (!handler) {
        logger.warn(`Nenhum handler encontrado para mensagem do tipo ${messageType}`);
        return;
      }

      // Processa a mensagem com o handler encontrado
      await handler.handleMessage(message, sessionId);
    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
      throw error;
    }
  }

  /**
   * Determina o tipo da mensagem com base em seu conteúdo
   * @param message Mensagem do WhatsApp
   */
  private getMessageType(message: proto.IWebMessageInfo): MessageType {
    // Verifica se é uma mensagem de grupo
    if (message.key?.remoteJid?.endsWith('@g.us')) {
      if (message.messageStubType === 27) return MessageType.GROUP_PARTICIPANT_ADD;
      if (message.messageStubType === 28) return MessageType.GROUP_PARTICIPANT_REMOVE;
      if (message.messageStubType === 29) return MessageType.GROUP_PARTICIPANT_PROMOTE;
      if (message.messageStubType === 30) return MessageType.GROUP_PARTICIPANT_DEMOTE;
      if (message.messageStubType === 32) return MessageType.GROUP_SETTINGS;
    }

    // Verifica se é uma mensagem de status/story
    if (message.key?.remoteJid === 'status@broadcast') {
      if (message.message?.imageMessage) return MessageType.STORY_IMAGE;
      if (message.message?.videoMessage) return MessageType.STORY_VIDEO;
      if (message.message?.conversation) return MessageType.STORY_TEXT;
    }

    // Verifica se é uma mensagem de chamada
    if (message.message?.bcallMessage) {
      const callMessage = message.message.bcallMessage as any;
      if (callMessage.status === 'offer') return MessageType.CALL_OFFER;
      if (callMessage.status === 'missed') return MessageType.CALL_MISSED;
      return MessageType.CALL_END;
    }

    // Verifica se é uma mensagem de presença
    if (message.messageStubType === 40) return MessageType.PRESENCE_UPDATE;
    if (message.messageStubType === 41) return MessageType.PRESENCE_AVAILABLE;
    if (message.messageStubType === 42) return MessageType.PRESENCE_UNAVAILABLE;

    // Mensagens básicas
    if (message.message?.conversation) return MessageType.TEXT;
    if (message.message?.imageMessage) return MessageType.IMAGE;
    if (message.message?.videoMessage) return MessageType.VIDEO;
    if (message.message?.audioMessage) return MessageType.AUDIO;
    if (message.message?.documentMessage) return MessageType.DOCUMENT;
    if (message.message?.locationMessage) return MessageType.LOCATION;
    if (message.message?.contactMessage) return MessageType.CONTACT;
    if (message.message?.buttonsMessage) return MessageType.BUTTONS;
    if (message.message?.listMessage) return MessageType.LIST;
    if (message.message?.templateMessage) return MessageType.TEMPLATE;
    if (message.message?.reactionMessage) return MessageType.REACTION;
    if (message.message?.stickerMessage) return MessageType.STICKER;

    logger.warn('Tipo de mensagem não identificado:', message);
    return MessageType.TEXT; // Fallback para texto
  }
}

// Singleton
export const messageProcessor = new MessageProcessor();
