import { WASocket } from '@whiskeysockets/baileys';
import { MessageRepository } from '../database/repositories/message.repository';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { eventPublisher } from './publisher';
import logger from '../../utils/logger';

/**
 * Classe para manipulação de eventos do WhatsApp
 */
export class WhatsAppEventHandlers {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  /**
   * Configura os listeners de eventos para um socket do WhatsApp
   * @param socket Socket do WhatsApp
   * @param sessionId ID da sessão
   */
  setupEventListeners(socket: WASocket, sessionId: string): void {
    // Evento de mensagem recebida
    socket.ev.on('messages.upsert', async (update) => {
      try {
        const { messages, type } = update;
        
        // Ignora mensagens de notificação
        if (type !== 'notify') return;
        
        for (const message of messages) {
          // Ignora mensagens enviadas pelo próprio usuário
          if (message.key.fromMe) {
            this.handleOutgoingMessage(message, sessionId);
            continue;
          }
          
          // Processa mensagem recebida
          await this.handleIncomingMessage(message, sessionId);
        }
      } catch (error) {
        logger.error(`Erro ao processar mensagens recebidas na sessão ${sessionId}:`, error);
      }
    });

    // Evento de atualização de status de mensagem
    socket.ev.on('message-receipt.update', async (updates) => {
      try {
        for (const update of updates) {
          await this.handleMessageStatusUpdate(update, sessionId);
        }
      } catch (error) {
        logger.error(`Erro ao processar atualizações de status na sessão ${sessionId}:`, error);
      }
    });

    // Evento de presença (online/offline, digitando, etc.)
    socket.ev.on('presence.update', async (update) => {
      try {
        await this.handlePresenceUpdate(update, sessionId);
      } catch (error) {
        logger.error(`Erro ao processar atualização de presença na sessão ${sessionId}:`, error);
      }
    });

    // Outros eventos podem ser adicionados conforme necessário
  }

  /**
   * Manipula mensagens enviadas pelo próprio usuário
   * @param message Mensagem enviada
   * @param sessionId ID da sessão
   */
  private async handleOutgoingMessage(message: any, sessionId: string): Promise<void> {
    try {
      // Verifica se a mensagem tem um ID
      if (!message.key.id) return;
      
      // Busca a mensagem no banco de dados pelo ID do WhatsApp
      const dbMessage = await this.messageRepository.findByMessageId(message.key.id);
      
      // Se a mensagem não existir no banco, pode ter sido enviada por outro cliente
      if (!dbMessage) return;
      
      // Atualiza o status da mensagem para enviada, se necessário
      if (dbMessage.status === MessageStatus.PENDING) {
        await this.messageRepository.updateStatus(dbMessage.id, MessageStatus.SENT);
        
        // Publica evento de mensagem enviada
        await eventPublisher.publishEvent({
          type: 'message_status',
          sessionId,
          messageId: message.key.id,
          status: MessageStatus.SENT,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error(`Erro ao processar mensagem enviada na sessão ${sessionId}:`, error);
    }
  }

  /**
   * Manipula mensagens recebidas
   * @param message Mensagem recebida
   * @param sessionId ID da sessão
   */
  private async handleIncomingMessage(message: any, sessionId: string): Promise<void> {
    try {
      // Extrai informações básicas da mensagem
      const messageInfo = {
        id: message.key.id,
        from: message.key.remoteJid?.split('@')[0],
        pushName: message.pushName,
        timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
        type: this.getMessageType(message.message),
        content: this.extractMessageContent(message.message),
      };
      
      // Publica evento de mensagem recebida
      await eventPublisher.publishEvent({
        type: 'message_received',
        sessionId,
        message: messageInfo,
      });
      
      logger.debug(`Mensagem recebida na sessão ${sessionId}: ${JSON.stringify(messageInfo)}`);
    } catch (error) {
      logger.error(`Erro ao processar mensagem recebida na sessão ${sessionId}:`, error);
    }
  }

  /**
   * Manipula atualizações de status de mensagem
   * @param update Atualização de status
   * @param sessionId ID da sessão
   */
  private async handleMessageStatusUpdate(update: any, sessionId: string): Promise<void> {
    try {
      // Extrai informações da atualização
      const { receiptTimestamp, receipt, key } = update;
      
      // Ignora se não tiver ID de mensagem
      if (!key.id) return;
      
      // Busca a mensagem no banco de dados
      const message = await this.messageRepository.findByMessageId(key.id);
      
      // Se a mensagem não existir no banco, pode ser de outro cliente
      if (!message) return;
      
      // Determina o novo status
      let newStatus: MessageStatus | null = null;
      
      if (receipt.receiptTimestamp) {
        // Mensagem entregue
        newStatus = MessageStatus.DELIVERED;
      }
      
      if (receipt.readTimestamp) {
        // Mensagem lida
        newStatus = MessageStatus.READ;
      }
      
      // Atualiza o status da mensagem, se necessário
      if (newStatus && message.status !== newStatus) {
        await this.messageRepository.updateStatus(
          message.id,
          newStatus,
          new Date(receiptTimestamp * 1000)
        );
        
        // Publica evento de atualização de status
        await eventPublisher.publishEvent({
          type: 'message_status',
          sessionId,
          messageId: key.id,
          status: newStatus,
          timestamp: new Date(receiptTimestamp * 1000).toISOString(),
        });
      }
    } catch (error) {
      logger.error(`Erro ao processar atualização de status na sessão ${sessionId}:`, error);
    }
  }

  /**
   * Manipula atualizações de presença
   * @param update Atualização de presença
   * @param sessionId ID da sessão
   */
  private async handlePresenceUpdate(update: any, sessionId: string): Promise<void> {
    try {
      // Extrai informações da atualização
      const { id, presences } = update;
      
      // Formata o número de telefone
      const phoneNumber = id.split('@')[0];
      
      // Obtém o estado de presença
      const presence = Object.entries(presences)[0];
      
      if (!presence) return;
      
      const [jid, status] = presence;
      
      // Publica evento de presença
      await eventPublisher.publishEvent({
        type: 'presence_update',
        sessionId,
        phoneNumber,
        status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Erro ao processar atualização de presença na sessão ${sessionId}:`, error);
    }
  }

  /**
   * Determina o tipo de mensagem
   * @param message Objeto de mensagem
   */
  private getMessageType(message: any): string {
    if (!message) return 'unknown';
    
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.contactMessage) return 'contact';
    if (message.locationMessage) return 'location';
    if (message.stickerMessage) return 'sticker';
    if (message.buttonsMessage) return 'buttons';
    if (message.listMessage) return 'list';
    if (message.reactionMessage) return 'reaction';
    
    return 'unknown';
  }

  /**
   * Extrai o conteúdo da mensagem
   * @param message Objeto de mensagem
   */
  private extractMessageContent(message: any): Record<string, any> {
    if (!message) return {};
    
    if (message.conversation) {
      return { text: message.conversation };
    }
    
    if (message.imageMessage) {
      return {
        caption: message.imageMessage.caption,
        url: message.imageMessage.url,
        mimetype: message.imageMessage.mimetype,
      };
    }
    
    if (message.videoMessage) {
      return {
        caption: message.videoMessage.caption,
        url: message.videoMessage.url,
        mimetype: message.videoMessage.mimetype,
      };
    }
    
    if (message.audioMessage) {
      return {
        url: message.audioMessage.url,
        mimetype: message.audioMessage.mimetype,
        seconds: message.audioMessage.seconds,
      };
    }
    
    if (message.documentMessage) {
      return {
        filename: message.documentMessage.fileName,
        url: message.documentMessage.url,
        mimetype: message.documentMessage.mimetype,
      };
    }
    
    if (message.contactMessage) {
      return {
        displayName: message.contactMessage.displayName,
        vcard: message.contactMessage.vcard,
      };
    }
    
    if (message.locationMessage) {
      return {
        latitude: message.locationMessage.degreesLatitude,
        longitude: message.locationMessage.degreesLongitude,
        name: message.locationMessage.name,
        address: message.locationMessage.address,
      };
    }
    
    if (message.stickerMessage) {
      return {
        url: message.stickerMessage.url,
        mimetype: message.stickerMessage.mimetype,
      };
    }
    
    // Outros tipos podem ser adicionados conforme necessário
    
    return message;
  }
}

// Singleton
export const whatsAppEventHandlers = new WhatsAppEventHandlers();
