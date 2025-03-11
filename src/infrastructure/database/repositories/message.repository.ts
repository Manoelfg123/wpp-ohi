import { Repository } from 'typeorm';
import { dataSource } from '../../../app';
import { MessageEntity } from '../entities/message.entity';
import { ICreateMessageDTO, IMessageResponse } from '../../../domain/interfaces/message.interface';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { MessageStatus } from '../../../domain/enums/message-status.enum';
import { NotFoundError } from '../../../utils/error.types';
import logger from '../../../utils/logger';

/**
 * Repositório para operações com mensagens no banco de dados
 */
export class MessageRepository {
  private _repository: Repository<MessageEntity>;

  private get repository(): Repository<MessageEntity> {
    if (!this._repository) {
      if (!dataSource.isInitialized) {
        throw new Error('DataSource não está inicializado');
      }
      this._repository = dataSource.getRepository(MessageEntity);
    }
    return this._repository;
  }

  /**
   * Cria uma nova mensagem
   * @param data Dados da mensagem
   */
  async create(data: ICreateMessageDTO): Promise<MessageEntity> {
    try {
      const message = this.repository.create({
        messageId: data.messageId || '',
        sessionId: data.sessionId,
        type: data.type,
        content: data.content,
        from: data.from || '',
        to: data.to,
        timestamp: data.timestamp || Date.now(),
        isFromMe: data.isFromMe || false,
        status: data.status || MessageStatus.SENT,
        metadata: data.metadata || {}
      });

      return this.repository.save(message);
    } catch (error) {
      logger.error('Erro ao criar mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca uma mensagem pelo ID
   * @param id ID da mensagem
   */
  async findById(id: string): Promise<MessageEntity> {
    try {
      const message = await this.repository.findOne({ where: { id } });

      if (!message) {
        throw new NotFoundError(`Mensagem ${id} não encontrada`);
      }

      return message;
    } catch (error) {
      logger.error(`Erro ao buscar mensagem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca uma mensagem pelo ID do WhatsApp
   * @param messageId ID da mensagem no WhatsApp
   */
  async findByMessageId(messageId: string): Promise<MessageEntity> {
    try {
      const message = await this.repository.findOne({ where: { messageId } });

      if (!message) {
        throw new NotFoundError(`Mensagem ${messageId} não encontrada`);
      }

      return message;
    } catch (error) {
      logger.error(`Erro ao buscar mensagem ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Busca mensagens de uma sessão
   * @param sessionId ID da sessão
   * @param options Opções de filtro e paginação
   */
  async findBySessionId(
    sessionId: string,
    options?: {
      status?: MessageStatus;
      type?: MessageType;
      page?: number;
      limit?: number;
    }
  ): Promise<{ messages: MessageEntity[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const queryBuilder = this.repository
        .createQueryBuilder('message')
        .where('message.sessionId = :sessionId', { sessionId });

      if (options?.status) {
        queryBuilder.andWhere('message.status = :status', { status: options.status });
      }

      if (options?.type) {
        queryBuilder.andWhere('message.type = :type', { type: options.type });
      }

      const [messages, total] = await queryBuilder
        .orderBy('message.timestamp', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return { messages, total };
    } catch (error) {
      logger.error(`Erro ao buscar mensagens da sessão ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o ID do WhatsApp de uma mensagem
   * @param id ID da mensagem
   * @param messageId Novo ID do WhatsApp
   */
  async updateMessageId(id: string, messageId: string): Promise<MessageEntity> {
    try {
      const message = await this.findById(id);
      message.messageId = messageId;
      return this.repository.save(message);
    } catch (error) {
      logger.error(`Erro ao atualizar ID da mensagem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma mensagem
   * @param id ID da mensagem
   * @param status Novo status
   */
  async updateStatus(id: string, status: MessageStatus): Promise<MessageEntity> {
    try {
      const message = await this.findById(id);
      message.status = status;
      return this.repository.save(message);
    } catch (error) {
      logger.error(`Erro ao atualizar status da mensagem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza os metadados de uma mensagem
   * @param id ID da mensagem
   * @param metadata Novos metadados
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<MessageEntity> {
    try {
      const message = await this.findById(id);
      message.metadata = { ...message.metadata, ...metadata };
      return this.repository.save(message);
    } catch (error) {
      logger.error(`Erro ao atualizar metadados da mensagem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove uma mensagem
   * @param id ID da mensagem
   */
  async delete(id: string): Promise<void> {
    try {
      const message = await this.findById(id);
      await this.repository.remove(message);
    } catch (error) {
      logger.error(`Erro ao remover mensagem ${id}:`, error);
      throw error;
    }
  }
}
