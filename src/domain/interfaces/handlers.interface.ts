import { proto, GroupMetadata } from '@whiskeysockets/baileys';
import { MessageType } from '../enums/message-types.enum';

/**
 * Interface base para handlers de mensagens
 */
export interface IMessageHandler {
  /**
   * Processa uma mensagem recebida
   * @param message Mensagem do WhatsApp
   * @param sessionId ID da sessão
   */
  handleMessage(message: proto.IWebMessageInfo, sessionId: string): Promise<void>;

  /**
   * Verifica se o handler pode processar o tipo de mensagem
   * @param messageType Tipo da mensagem
   */
  canHandle(messageType: MessageType): boolean;
}

/**
 * Interface para handlers de mensagens de grupo
 */
export interface IGroupHandler extends IMessageHandler {
  /**
   * Processa uma atualização de grupo
   * @param groupId ID do grupo
   * @param metadata Metadados do grupo
   * @param sessionId ID da sessão
   */
  handleGroupUpdate(groupId: string, metadata: GroupMetadata, sessionId: string): Promise<void>;

  /**
   * Processa uma atualização de participantes do grupo
   * @param groupId ID do grupo
   * @param participants Lista de participantes
   * @param action Ação realizada (add, remove, promote, demote)
   * @param sessionId ID da sessão
   */
  handleParticipantsUpdate(
    groupId: string,
    participants: string[],
    action: 'add' | 'remove' | 'promote' | 'demote',
    sessionId: string
  ): Promise<void>;
}

/**
 * Interface para handlers de status (stories)
 */
export interface IStatusHandler extends IMessageHandler {
  /**
   * Processa uma visualização de status
   * @param statusId ID do status
   * @param viewer ID do visualizador
   * @param sessionId ID da sessão
   */
  handleStatusView(statusId: string, viewer: string, sessionId: string): Promise<void>;
}

/**
 * Interface para handlers de chamadas
 */
export interface ICallHandler {
  /**
   * Processa uma chamada recebida
   * @param callId ID da chamada
   * @param caller ID do chamador
   * @param isVideo Indica se é uma chamada de vídeo
   * @param sessionId ID da sessão
   */
  handleIncomingCall(callId: string, caller: string, isVideo: boolean, sessionId: string): Promise<void>;

  /**
   * Processa o fim de uma chamada
   * @param callId ID da chamada
   * @param duration Duração da chamada em segundos
   * @param sessionId ID da sessão
   */
  handleCallEnd(callId: string, duration: number, sessionId: string): Promise<void>;

  /**
   * Processa uma chamada perdida
   * @param callId ID da chamada
   * @param caller ID do chamador
   * @param timestamp Timestamp da chamada
   * @param sessionId ID da sessão
   */
  handleCallMissed(callId: string, caller: string, timestamp: number, sessionId: string): Promise<void>;
}

/**
 * Interface para handlers de presença
 */
export interface IPresenceHandler {
  /**
   * Processa uma atualização de presença
   * @param jid ID do contato
   * @param presence Status de presença
   * @param sessionId ID da sessão
   */
  handlePresenceUpdate(
    jid: string,
    presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused',
    sessionId: string
  ): Promise<void>;
}
