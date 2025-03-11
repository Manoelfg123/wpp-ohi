import { SessionRepository } from '../../infrastructure/database/repositories/session.repository';
import { whatsAppSessionManager } from '../../infrastructure/whatsapp/session.manager';
import { 
  ISession, 
  ISessionInfo, 
  IQRCode, 
  ICreateSessionDTO, 
  IUpdateSessionDTO, 
  ISessionStatusResponse 
} from '../interfaces/session.interface';
import { SessionStatus } from '../enums/session-status.enum';
import { NotFoundError, WhatsAppError } from '../../utils/error.types';
import logger from '../../utils/logger';

/**
 * Serviço para gerenciamento de sessões do WhatsApp
 */
export class SessionService {
  private sessionRepository: SessionRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
  }

  /**
   * Cria uma nova sessão
   * @param data Dados para criação da sessão
   */
  async createSession(data: ICreateSessionDTO): Promise<ISession> {
    try {
      // Cria a sessão no banco de dados
      const session = await this.sessionRepository.create(data);
      
      // Inicia a sessão do WhatsApp
      await whatsAppSessionManager.startSession(session.id);
      
      return session;
    } catch (error) {
      logger.error('Erro ao criar sessão:', error);
      throw error;
    }
  }

  /**
   * Obtém uma sessão pelo ID
   * @param id ID da sessão
   */
  async getSessionById(id: string): Promise<ISession> {
    return this.sessionRepository.findById(id);
  }

  /**
   * Obtém informações detalhadas de uma sessão
   * @param id ID da sessão
   */
  async getSessionInfo(id: string): Promise<ISessionInfo> {
    try {
      // Verifica se a sessão existe
      await this.sessionRepository.findById(id);
      
      // Obtém informações detalhadas
      return whatsAppSessionManager.getSessionInfo(id);
    } catch (error) {
      logger.error(`Erro ao obter informações da sessão ${id}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao obter informações da sessão: ${(error as Error).message}`);
    }
  }

  /**
   * Lista todas as sessões com paginação e filtros opcionais
   * @param options Opções de filtro e paginação
   */
  async listSessions(options?: {
    status?: SessionStatus;
    page?: number;
    limit?: number;
  }): Promise<{ sessions: ISession[]; total: number; page: number; limit: number }> {
    const { sessions, total } = await this.sessionRepository.findAll(options);
    
    return {
      sessions,
      total,
      page: options?.page || 1,
      limit: options?.limit || 10,
    };
  }

  /**
   * Atualiza uma sessão
   * @param id ID da sessão
   * @param data Dados para atualização
   */
  async updateSession(id: string, data: IUpdateSessionDTO): Promise<ISession> {
    // Verifica se a sessão existe
    await this.sessionRepository.findById(id);
    
    // Atualiza a sessão
    return this.sessionRepository.update(id, data);
  }

  /**
   * Obtém o QR Code de uma sessão
   * @param id ID da sessão
   */
  async getSessionQRCode(id: string): Promise<IQRCode> {
    try {
      // Verifica se a sessão existe
      const session = await this.sessionRepository.findById(id);
      
      // Verifica se a sessão está no estado correto para gerar QR Code
      if (session.status !== SessionStatus.QR_READY && session.status !== SessionStatus.INITIALIZING) {
        // Se a sessão estiver desconectada, tenta iniciar novamente
        if (session.status === SessionStatus.DISCONNECTED || session.status === SessionStatus.ERROR) {
          await whatsAppSessionManager.startSession(id);
          
          // Aguarda um pouco para o QR Code ser gerado
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (session.status === SessionStatus.CONNECTED) {
          throw new WhatsAppError('Sessão já está conectada');
        }
      }
      
      // Obtém o QR Code
      return whatsAppSessionManager.getQRCode(id);
    } catch (error) {
      logger.error(`Erro ao obter QR Code da sessão ${id}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao obter QR Code: ${(error as Error).message}`);
    }
  }

  /**
   * Desconecta uma sessão
   * @param id ID da sessão
   */
  async disconnectSession(id: string): Promise<ISessionStatusResponse> {
    try {
      // Verifica se a sessão existe
      const session = await this.sessionRepository.findById(id);
      
      // Verifica se a sessão já está desconectada
      if (session.status === SessionStatus.DISCONNECTED) {
        return {
          id,
          status: SessionStatus.DISCONNECTED,
          message: 'Sessão já está desconectada',
        };
      }
      
      // Desconecta a sessão
      await whatsAppSessionManager.disconnectSession(id);
      
      return {
        id,
        status: SessionStatus.DISCONNECTED,
        message: 'Sessão desconectada com sucesso',
      };
    } catch (error) {
      logger.error(`Erro ao desconectar sessão ${id}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      // Se a sessão não estiver ativa, apenas atualiza o status
      if (error instanceof WhatsAppError && error.message.includes('não está ativa')) {
        await this.sessionRepository.updateStatus(id, SessionStatus.DISCONNECTED);
        
        return {
          id,
          status: SessionStatus.DISCONNECTED,
          message: 'Sessão marcada como desconectada',
        };
      }
      
      throw new WhatsAppError(`Erro ao desconectar sessão: ${(error as Error).message}`);
    }
  }

  /**
   * Reconecta uma sessão
   * @param id ID da sessão
   */
  async reconnectSession(id: string): Promise<ISessionStatusResponse> {
    try {
      // Verifica se a sessão existe
      const session = await this.sessionRepository.findById(id);
      
      // Verifica se a sessão já está conectada
      if (session.status === SessionStatus.CONNECTED) {
        return {
          id,
          status: SessionStatus.CONNECTED,
          message: 'Sessão já está conectada',
        };
      }
      
      // Inicia a sessão
      await whatsAppSessionManager.startSession(id);
      
      return {
        id,
        status: SessionStatus.CONNECTING,
        message: 'Reconexão iniciada',
      };
    } catch (error) {
      logger.error(`Erro ao reconectar sessão ${id}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao reconectar sessão: ${(error as Error).message}`);
    }
  }

  /**
   * Remove uma sessão
   * @param id ID da sessão
   */
  async deleteSession(id: string): Promise<void> {
    try {
      // Verifica se a sessão existe
      await this.sessionRepository.findById(id);
      
      // Tenta desconectar a sessão, se estiver ativa
      if (whatsAppSessionManager.isSessionActive(id)) {
        try {
          await whatsAppSessionManager.disconnectSession(id);
        } catch (error) {
          logger.warn(`Erro ao desconectar sessão ${id} durante exclusão:`, error);
          // Continua com a exclusão mesmo se falhar ao desconectar
        }
      }
      
      // Remove a sessão do banco de dados
      await this.sessionRepository.delete(id);
    } catch (error) {
      logger.error(`Erro ao excluir sessão ${id}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new WhatsAppError(`Erro ao excluir sessão: ${(error as Error).message}`);
    }
  }
}

// Singleton
export const sessionService = new SessionService();
