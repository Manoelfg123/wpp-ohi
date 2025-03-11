import { proto } from '@whiskeysockets/baileys';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { IStatusHandler } from '../../../domain/interfaces/handlers.interface';
import { BaseMessageHandler } from './base.handler';
import logger from '../../../utils/logger';

/**
 * Handler para processamento de status (stories)
 */
export class StatusMessageHandler extends BaseMessageHandler implements IStatusHandler {
  constructor() {
    super();
    this.supportedTypes = [
      MessageType.STORY,
      MessageType.STORY_TEXT,
      MessageType.STORY_IMAGE,
      MessageType.STORY_VIDEO,
      MessageType.STORY_REACTION,
      MessageType.STORY_VIEW
    ];
  }

  /**
   * Processa uma mensagem de status
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
      // Extrai os metadados específicos do status
      const metadata = this.extractStatusMetadata(message, messageType);

      // Salva a mensagem com os metadados do status
      await this.saveMessage(message, messageType, sessionId);

      // Processa visualização de status se necessário
      if (messageType === MessageType.STORY_VIEW) {
        const statusId = this.extractStatusId(message);
        const viewer = message.key.participant || message.key.remoteJid!;
        await this.handleStatusView(statusId, viewer, sessionId);
      }

      // Processa reação a status se necessário
      if (messageType === MessageType.STORY_REACTION) {
        await this.handleStatusReaction(message, sessionId);
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de status:', error);
      throw error;
    }
  }

  /**
   * Processa uma visualização de status
   * @param statusId ID do status
   * @param viewer ID do visualizador
   * @param sessionId ID da sessão
   */
  async handleStatusView(statusId: string, viewer: string, sessionId: string): Promise<void> {
    try {
      logger.debug(`Processando visualização do status ${statusId} por ${viewer}`);
      // Aqui você pode implementar a lógica para registrar a visualização do status
      // Por exemplo, salvar em uma tabela de visualizações no banco de dados
    } catch (error) {
      logger.error(`Erro ao processar visualização do status ${statusId}:`, error);
      throw error;
    }
  }

  /**
   * Processa uma reação a um status
   * @param message Mensagem do WhatsApp
   * @param sessionId ID da sessão
   */
  private async handleStatusReaction(message: proto.IWebMessageInfo, sessionId: string): Promise<void> {
    try {
      const statusId = this.extractStatusId(message);
      const reaction = this.extractReaction(message);
      const reactor = message.key.participant || message.key.remoteJid!;

      logger.debug(`Processando reação ao status ${statusId} por ${reactor}: ${reaction}`);
      // Aqui você pode implementar a lógica para registrar a reação ao status
      // Por exemplo, salvar em uma tabela de reações no banco de dados
    } catch (error) {
      logger.error('Erro ao processar reação ao status:', error);
      throw error;
    }
  }

  /**
   * Extrai os metadados do status da mensagem
   * @param message Mensagem do WhatsApp
   * @param messageType Tipo da mensagem
   */
  private extractStatusMetadata(message: proto.IWebMessageInfo, messageType: MessageType): Record<string, any> {
    const metadata: Record<string, any> = {
      type: messageType,
      author: message.key.participant || message.key.remoteJid!,
      timestamp: message.messageTimestamp
    };

    // Adiciona metadados específicos com base no tipo de status
    switch (messageType) {
      case MessageType.STORY_TEXT:
        metadata.text = message.message?.conversation || '';
        // Status de texto não tem propriedades específicas no baileys
        // Usamos o próprio texto da mensagem
        metadata.text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
        break;

      case MessageType.STORY_IMAGE:
        metadata.caption = message.message?.imageMessage?.caption || '';
        metadata.url = message.message?.imageMessage?.url || '';
        metadata.mimetype = message.message?.imageMessage?.mimetype || '';
        break;

      case MessageType.STORY_VIDEO:
        metadata.caption = message.message?.videoMessage?.caption || '';
        metadata.url = message.message?.videoMessage?.url || '';
        metadata.mimetype = message.message?.videoMessage?.mimetype || '';
        metadata.duration = message.message?.videoMessage?.seconds || 0;
        break;

      case MessageType.STORY_REACTION:
        metadata.reaction = this.extractReaction(message);
        metadata.targetStatusId = this.extractStatusId(message);
        break;
    }

    return metadata;
  }

  /**
   * Extrai o ID do status da mensagem
   * @param message Mensagem do WhatsApp
   */
  private extractStatusId(message: proto.IWebMessageInfo): string {
    // Aqui você deve implementar a lógica para extrair o ID do status
    // da mensagem recebida
    return message.key.id!;
  }

  /**
   * Extrai a reação da mensagem
   * @param message Mensagem do WhatsApp
   */
  private extractReaction(message: proto.IWebMessageInfo): string {
    // Aqui você deve implementar a lógica para extrair a reação
    // da mensagem recebida
    return message.message?.reactionMessage?.text || '';
  }
}
