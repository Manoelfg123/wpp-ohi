import { proto } from '@whiskeysockets/baileys';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { ICallHandler } from '../../../domain/interfaces/handlers.interface';
import { BaseMessageHandler } from './base.handler';
import logger from '../../../utils/logger';

/**
 * Handler para processamento de chamadas
 */
export class CallMessageHandler extends BaseMessageHandler implements ICallHandler {
  constructor() {
    super();
    this.supportedTypes = [
      MessageType.CALL_OFFER,
      MessageType.CALL_ACCEPT,
      MessageType.CALL_REJECT,
      MessageType.CALL_MISSED,
      MessageType.CALL_END
    ];
  }

  /**
   * Processa uma mensagem de chamada
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
      // Extrai os metadados específicos da chamada
      const metadata = this.extractCallMetadata(message, messageType);

      // Salva a mensagem com os metadados da chamada
      await this.saveMessage(message, messageType, sessionId);

      // Processa a chamada de acordo com o tipo
      switch (messageType) {
        case MessageType.CALL_OFFER:
          await this.handleIncomingCall(
            message.key.id!,
            message.key.remoteJid!,
            metadata.isVideo || false,
            sessionId
          );
          break;

        case MessageType.CALL_END:
          await this.handleCallEnd(
            message.key.id!,
            metadata.duration || 0,
            sessionId
          );
          break;

        case MessageType.CALL_MISSED:
          await this.handleCallMissed(
            message.key.id!,
            message.key.remoteJid!,
            message.messageTimestamp as number,
            sessionId
          );
          break;
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de chamada:', error);
      throw error;
    }
  }

  /**
   * Processa uma chamada recebida
   * @param callId ID da chamada
   * @param caller ID do chamador
   * @param isVideo Indica se é uma chamada de vídeo
   * @param sessionId ID da sessão
   */
  async handleIncomingCall(
    callId: string,
    caller: string,
    isVideo: boolean,
    sessionId: string
  ): Promise<void> {
    try {
      logger.debug(`Processando chamada recebida ${callId} de ${caller}`);
      // Aqui você pode implementar a lógica para lidar com chamadas recebidas
      // Por exemplo:
      // - Notificar o usuário através de webhook
      // - Registrar a chamada no banco de dados
      // - Aplicar políticas de auto-rejeição
    } catch (error) {
      logger.error(`Erro ao processar chamada recebida ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Processa o fim de uma chamada
   * @param callId ID da chamada
   * @param duration Duração da chamada em segundos
   * @param sessionId ID da sessão
   */
  async handleCallEnd(callId: string, duration: number, sessionId: string): Promise<void> {
    try {
      logger.debug(`Processando fim da chamada ${callId} (duração: ${duration}s)`);
      // Aqui você pode implementar a lógica para lidar com o fim da chamada
      // Por exemplo:
      // - Atualizar o registro da chamada no banco
      // - Enviar notificação de fim de chamada
      // - Registrar métricas de duração
    } catch (error) {
      logger.error(`Erro ao processar fim da chamada ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Processa uma chamada perdida
   * @param callId ID da chamada
   * @param caller ID do chamador
   * @param timestamp Timestamp da chamada
   * @param sessionId ID da sessão
   */
  async handleCallMissed(
    callId: string,
    caller: string,
    timestamp: number,
    sessionId: string
  ): Promise<void> {
    try {
      logger.debug(`Processando chamada perdida ${callId} de ${caller}`);
      // Aqui você pode implementar a lógica para lidar com chamadas perdidas
      // Por exemplo:
      // - Registrar a chamada perdida no banco
      // - Enviar notificação de chamada perdida
      // - Agendar retorno de chamada
    } catch (error) {
      logger.error(`Erro ao processar chamada perdida ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Extrai os metadados da chamada da mensagem
   * @param message Mensagem do WhatsApp
   * @param messageType Tipo da mensagem
   */
  private extractCallMetadata(message: proto.IWebMessageInfo, messageType: MessageType): Record<string, any> {
    const metadata: Record<string, any> = {
      type: messageType,
      caller: message.key.remoteJid!,
      timestamp: message.messageTimestamp
    };

    // Adiciona metadados específicos com base no tipo de chamada
    // TODO: Melhorar tipagem quando o baileys exportar os tipos corretamente
    const callMessage = message.message?.bcallMessage as any;
    if (callMessage) {
      metadata.isVideo = callMessage.video || false;
      metadata.duration = callMessage.duration || 0;
      metadata.status = callMessage.status;
    }

    return metadata;
  }
}
