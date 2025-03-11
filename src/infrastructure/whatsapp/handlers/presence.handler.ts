import { proto } from '@whiskeysockets/baileys';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { IPresenceHandler } from '../../../domain/interfaces/handlers.interface';
import { BaseMessageHandler } from './base.handler';
import logger from '../../../utils/logger';

/**
 * Handler para processamento de presença
 */
export class PresenceMessageHandler extends BaseMessageHandler implements IPresenceHandler {
  constructor() {
    super();
    this.supportedTypes = [
      MessageType.PRESENCE_UPDATE,
      MessageType.PRESENCE_AVAILABLE,
      MessageType.PRESENCE_UNAVAILABLE,
      MessageType.PRESENCE_COMPOSING,
      MessageType.PRESENCE_RECORDING,
      MessageType.PRESENCE_PAUSED
    ];
  }

  /**
   * Processa uma mensagem de presença
   * @param message Mensagem do WhatsApp
   * @param messageType Tipo da mensagem
   * @param sessionId ID da sessão
   */
  protected async processMessage(
    message: proto.IWebMessageInfo,
    messageType: MessageType,
    sessionId: string
  ): Promise<void> {
    try {
      // Extrai os metadados específicos da presença
      const metadata = this.extractPresenceMetadata(message, messageType);

      // Salva a mensagem com os metadados da presença
      await this.saveMessage(message, messageType, sessionId);

      // Processa a atualização de presença
      await this.handlePresenceUpdate(
        message.key.remoteJid!,
        this.getPresenceStatus(messageType),
        sessionId
      );
    } catch (error) {
      logger.error('Erro ao processar mensagem de presença:', error);
      throw error;
    }
  }

  /**
   * Processa uma atualização de presença
   * @param jid ID do contato
   * @param presence Status de presença
   * @param sessionId ID da sessão
   */
  async handlePresenceUpdate(
    jid: string,
    presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused',
    sessionId: string
  ): Promise<void> {
    try {
      logger.debug(`Processando atualização de presença de ${jid}: ${presence}`);
      // Aqui você pode implementar a lógica para lidar com atualizações de presença
      // Por exemplo:
      // - Atualizar o status do contato no banco
      // - Notificar sobre mudanças de status
      // - Registrar histórico de presença
    } catch (error) {
      logger.error(`Erro ao processar atualização de presença de ${jid}:`, error);
      throw error;
    }
  }

  /**
   * Extrai os metadados de presença da mensagem
   * @param message Mensagem do WhatsApp
   * @param messageType Tipo da mensagem
   */
  private extractPresenceMetadata(message: proto.IWebMessageInfo, messageType: MessageType): Record<string, any> {
    const metadata: Record<string, any> = {
      type: messageType,
      jid: message.key.remoteJid!,
      timestamp: message.messageTimestamp,
      presence: this.getPresenceStatus(messageType)
    };

    // TODO: Melhorar tipagem quando o baileys exportar os tipos corretamente
    const presence = message.messageStubParameters?.[0] || 'unavailable';
    const deviceType = message.messageStubParameters?.[1] || 'unknown';
    const lastSeen = message.messageTimestamp;

    metadata.lastSeen = lastSeen;
    metadata.deviceType = deviceType;
    metadata.presence = presence;

    return metadata;
  }

  /**
   * Obtém o status de presença com base no tipo da mensagem
   * @param messageType Tipo da mensagem
   */
  private getPresenceStatus(messageType: MessageType): 'available' | 'unavailable' | 'composing' | 'recording' | 'paused' {
    switch (messageType) {
      case MessageType.PRESENCE_AVAILABLE:
        return 'available';
      case MessageType.PRESENCE_UNAVAILABLE:
        return 'unavailable';
      case MessageType.PRESENCE_COMPOSING:
        return 'composing';
      case MessageType.PRESENCE_RECORDING:
        return 'recording';
      case MessageType.PRESENCE_PAUSED:
        return 'paused';
      default:
        return 'unavailable';
    }
  }
}
