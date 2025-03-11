import { MessageRepository } from '../../infrastructure/database/repositories/message.repository';
import { SessionRepository } from '../../infrastructure/database/repositories/session.repository';
import { whatsAppClient } from '../../infrastructure/whatsapp/whatsapp.client';
import { 
  ITextMessage, 
  IMediaMessage, 
  ILocationMessage, 
  IContactMessage, 
  IButtonMessage, 
  IListMessage, 
  IReactionMessage, 
  IStickerMessage,
  IMessageResponse,
  IMessageDetails
} from '../interfaces/message.interface';
import { SessionStatus } from '../enums/session-status.enum';
import { NotFoundError, WhatsAppError, BadRequestError } from '../../utils/error.types';
import logger from '../../utils/logger';

/**
 * Serviço para envio e gerenciamento de mensagens
 */
export class MessageService {
  private messageRepository: MessageRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
    this.sessionRepository = new SessionRepository();
  }

  /**
   * Verifica se uma sessão está ativa e conectada
   * @param sessionId ID da sessão
   */
  private async validateSession(sessionId: string): Promise<void> {
    // Verifica se a sessão existe
    const session = await this.sessionRepository.findById(sessionId);
    
    // Verifica se a sessão está conectada
    if (session.status !== SessionStatus.CONNECTED) {
      throw new WhatsAppError(`Sessão ${sessionId} não está conectada (status: ${session.status})`);
    }
  }

  /**
   * Envia uma mensagem de texto
   * @param sessionId ID da sessão
   * @param data Dados da mensagem
   */
  async sendTextMessage(sessionId: string, data: ITextMessage): Promise<IMessageResponse> {
    try {
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Envia a mensagem
      return whatsAppClient.sendTextMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar mensagem de texto na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida o tipo de mídia
      if (!data.media) {
        throw new BadRequestError('Mídia não fornecida');
      }
      
      // Envia a mensagem
      return whatsAppClient.sendMediaMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar mensagem de mídia na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida as coordenadas
      if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
        throw new BadRequestError('Coordenadas inválidas');
      }
      
      // Envia a mensagem
      return whatsAppClient.sendLocationMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar localização na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida o contato
      if (!data.contact.fullName || !data.contact.phoneNumber) {
        throw new BadRequestError('Nome e número de telefone do contato são obrigatórios');
      }
      
      // Envia a mensagem
      return whatsAppClient.sendContactMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar contato na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida os botões
      if (!data.buttons || data.buttons.length === 0) {
        throw new BadRequestError('Botões não fornecidos');
      }
      
      if (data.buttons.length > 3) {
        throw new BadRequestError('Máximo de 3 botões permitidos');
      }
      
      // Envia a mensagem
      return whatsAppClient.sendButtonMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar mensagem com botões na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida as seções
      if (!data.sections || data.sections.length === 0) {
        throw new BadRequestError('Seções não fornecidas');
      }
      
      // Envia a mensagem
      return whatsAppClient.sendListMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar mensagem com lista na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida a reação
      if (!data.messageId) {
        throw new BadRequestError('ID da mensagem não fornecido');
      }
      
      if (!data.reaction) {
        throw new BadRequestError('Reação não fornecida');
      }
      
      // Envia a reação
      return whatsAppClient.sendReactionMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar reação na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
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
      // Valida a sessão
      await this.validateSession(sessionId);
      
      // Valida o sticker
      if (!data.sticker) {
        throw new BadRequestError('Sticker não fornecido');
      }
      
      // Envia o sticker
      return whatsAppClient.sendStickerMessage(sessionId, data);
    } catch (error) {
      logger.error(`Erro ao enviar sticker na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError || error instanceof WhatsAppError || error instanceof BadRequestError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao enviar sticker: ${(error as Error).message}`);
    }
  }

  /**
   * Obtém detalhes de uma mensagem
   * @param sessionId ID da sessão
   * @param messageId ID da mensagem
   */
  async getMessageDetails(sessionId: string, messageId: string): Promise<IMessageDetails> {
    try {
      // Verifica se a sessão existe
      await this.sessionRepository.findById(sessionId);
      
      // Busca a mensagem
      const message = await this.messageRepository.findById(messageId);
      
      // Verifica se a mensagem pertence à sessão
      if (message.sessionId !== sessionId) {
        throw new NotFoundError(`Mensagem ${messageId} não encontrada na sessão ${sessionId}`);
      }
      
      return message;
    } catch (error) {
      logger.error(`Erro ao obter detalhes da mensagem ${messageId} na sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao obter detalhes da mensagem: ${(error as Error).message}`);
    }
  }

  /**
   * Lista mensagens de uma sessão
   * @param sessionId ID da sessão
   * @param options Opções de filtro e paginação
   */
  async listSessionMessages(
    sessionId: string,
    options?: {
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ messages: IMessageResponse[]; total: number; page: number; limit: number }> {
    try {
      // Verifica se a sessão existe
      await this.sessionRepository.findById(sessionId);
      
      // Converte os tipos de string para enum
      const parsedOptions: any = { ...options };
      
      // Lista as mensagens
      const { messages, total } = await this.messageRepository.findBySessionId(
        sessionId,
        parsedOptions
      );
      
      return {
        messages,
        total,
        page: options?.page || 1,
        limit: options?.limit || 20,
      };
    } catch (error) {
      logger.error(`Erro ao listar mensagens da sessão ${sessionId}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao listar mensagens: ${(error as Error).message}`);
    }
  }
}

// Singleton
export const messageService = new MessageService();
