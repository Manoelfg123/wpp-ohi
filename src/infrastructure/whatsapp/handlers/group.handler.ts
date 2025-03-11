import { proto, GroupMetadata } from '@whiskeysockets/baileys';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { IGroupHandler } from '../../../domain/interfaces/handlers.interface';
import { BaseMessageHandler } from './base.handler';
import logger from '../../../utils/logger';

/**
 * Handler para processamento de mensagens de grupo
 */
export class GroupMessageHandler extends BaseMessageHandler implements IGroupHandler {
  constructor() {
    super();
    this.supportedTypes = [
      MessageType.GROUP_CREATE,
      MessageType.GROUP_UPDATE,
      MessageType.GROUP_PARTICIPANT_ADD,
      MessageType.GROUP_PARTICIPANT_REMOVE,
      MessageType.GROUP_PARTICIPANT_PROMOTE,
      MessageType.GROUP_PARTICIPANT_DEMOTE,
      MessageType.GROUP_ANNOUNCE,
      MessageType.GROUP_DESCRIPTION,
      MessageType.GROUP_SETTINGS
    ];
  }

  /**
   * Processa uma mensagem de grupo
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
      // Extrai os metadados específicos do grupo
      const metadata = this.extractGroupMetadata(message);

      // Salva a mensagem com os metadados do grupo
      await this.saveMessage(message, messageType, sessionId);

      // Processa a atualização do grupo se necessário
      if (this.isGroupUpdateMessage(messageType)) {
        await this.handleGroupUpdate(message.key.remoteJid!, metadata, sessionId);
      }

      // Processa atualização de participantes se necessário
      if (this.isParticipantUpdateMessage(messageType)) {
        const participants = this.extractParticipants(message);
        const action = this.getParticipantAction(messageType);
        await this.handleParticipantsUpdate(message.key.remoteJid!, participants, action, sessionId);
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de grupo:', error);
      throw error;
    }
  }

  /**
   * Processa uma atualização de grupo
   * @param groupId ID do grupo
   * @param metadata Metadados do grupo
   * @param sessionId ID da sessão
   */
  async handleGroupUpdate(groupId: string, metadata: GroupMetadata, sessionId: string): Promise<void> {
    try {
      logger.debug(`Processando atualização do grupo ${groupId}`);
      // Aqui você pode implementar a lógica para atualizar os dados do grupo no banco
      // Por exemplo, atualizar nome, descrição, configurações, etc.
    } catch (error) {
      logger.error(`Erro ao processar atualização do grupo ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Processa uma atualização de participantes do grupo
   * @param groupId ID do grupo
   * @param participants Lista de participantes
   * @param action Ação realizada
   * @param sessionId ID da sessão
   */
  async handleParticipantsUpdate(
    groupId: string,
    participants: string[],
    action: 'add' | 'remove' | 'promote' | 'demote',
    sessionId: string
  ): Promise<void> {
    try {
      logger.debug(`Processando atualização de participantes do grupo ${groupId}: ${action}`);
      // Aqui você pode implementar a lógica para atualizar os participantes no banco
      // Por exemplo, adicionar/remover participantes, atualizar permissões, etc.
    } catch (error) {
      logger.error(`Erro ao processar atualização de participantes do grupo ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se é uma mensagem de atualização de grupo
   * @param messageType Tipo da mensagem
   */
  private isGroupUpdateMessage(messageType: MessageType): boolean {
    return [
      MessageType.GROUP_UPDATE,
      MessageType.GROUP_ANNOUNCE,
      MessageType.GROUP_DESCRIPTION,
      MessageType.GROUP_SETTINGS
    ].includes(messageType);
  }

  /**
   * Verifica se é uma mensagem de atualização de participantes
   * @param messageType Tipo da mensagem
   */
  private isParticipantUpdateMessage(messageType: MessageType): boolean {
    return [
      MessageType.GROUP_PARTICIPANT_ADD,
      MessageType.GROUP_PARTICIPANT_REMOVE,
      MessageType.GROUP_PARTICIPANT_PROMOTE,
      MessageType.GROUP_PARTICIPANT_DEMOTE
    ].includes(messageType);
  }

  /**
   * Obtém a ação de participante com base no tipo da mensagem
   * @param messageType Tipo da mensagem
   */
  private getParticipantAction(messageType: MessageType): 'add' | 'remove' | 'promote' | 'demote' {
    switch (messageType) {
      case MessageType.GROUP_PARTICIPANT_ADD:
        return 'add';
      case MessageType.GROUP_PARTICIPANT_REMOVE:
        return 'remove';
      case MessageType.GROUP_PARTICIPANT_PROMOTE:
        return 'promote';
      case MessageType.GROUP_PARTICIPANT_DEMOTE:
        return 'demote';
      default:
        throw new Error(`Tipo de mensagem inválido para ação de participante: ${messageType}`);
    }
  }

  /**
   * Extrai os metadados do grupo da mensagem
   * @param message Mensagem do WhatsApp
   */
  private extractGroupMetadata(message: proto.IWebMessageInfo): GroupMetadata {
    // Aqui você deve implementar a lógica para extrair os metadados do grupo
    // da mensagem recebida, como nome, descrição, configurações, etc.
    return {
      id: message.key.remoteJid!,
      subject: message.message?.groupInviteMessage?.groupJid || '',
      creation: 0,
      owner: message.key.participant || '',
      desc: message.message?.groupInviteMessage?.caption || '',
      participants: [],
      ephemeralDuration: 0
    };
  }

  /**
   * Extrai a lista de participantes da mensagem
   * @param message Mensagem do WhatsApp
   */
  private extractParticipants(message: proto.IWebMessageInfo): string[] {
    // Aqui você deve implementar a lógica para extrair a lista de participantes
    // da mensagem recebida
    return message.message?.groupInviteMessage?.inviteCode 
      ? [message.message.groupInviteMessage.inviteCode]
      : [];
  }
}
