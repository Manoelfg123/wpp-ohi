import { Repository } from 'typeorm';
import { MessageEntity } from '../entities/message.entity';
import { dataSource } from '../../../app';
import { IMessageDetails, IMessageResponse } from '../../../domain/interfaces/message.interface';
import { MessageStatus } from '../../../domain/enums/message-status.enum';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { NotFoundError } from '../../../utils/error.types';
import { generateUUID } from '../../../utils/helpers';

/**
 * Repositório para operações com mensagens no banco de dados
 */
export class MessageRepository {
  private _repository: Repository<MessageEntity>;

  private get repository(): Repository<MessageEntity> {
    if (!this._repository) {
      this._repository = dataSource.getRepository(MessageEntity);
    }
    return this._repository;
  }

  /**
   * Cria uma nova mensagem
   * @param data Dados da mensagem
   */
  async create(data: {
    sessionId: string;
    to: string;
    type: MessageType;
    content: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<IMessageResponse> {
    const message = this.repository.create({
      id: generateUUID(),
      sessionId: data.sessionId,
      toNumber: data.to,
      type: data.type,
      content: data.content,
      status: MessageStatus.PENDING,
      metadata: data.metadata || {},
    });

    const savedMessage = await this.repository.save(message);
    return {
      ...savedMessage,
      to: savedMessage.toNumber
    };
  }

  /**
   * Busca uma mensagem pelo ID
   * @param id ID da mensagem
   */
  async findById(id: string): Promise<IMessageDetails> {
    const message = await this.repository.findOne({ 
      where: { id },
      relations: ['session'],
    });

    if (!message) {
      throw new NotFoundError(`Mensagem com ID ${id} não encontrada`);
    }

    return {
      ...message,
      to: message.toNumber
    };
  }

  /**
   * Busca uma mensagem pelo ID do WhatsApp
   * @param messageId ID da mensagem no WhatsApp
   */
  async findByMessageId(messageId: string): Promise<IMessageDetails | null> {
    const message = await this.repository.findOne({ 
      where: { messageId },
      relations: ['session'],
    });

    return message ? {
      ...message,
      to: message.toNumber
    } : null;
  }

  /**
   * Atualiza o ID do WhatsApp de uma mensagem
   * @param id ID da mensagem
   * @param messageId ID da mensagem no WhatsApp
   */
  async updateMessageId(id: string, messageId: string): Promise<IMessageResponse> {
    const message = await this.findById(id);
    message.messageId = messageId;
    return this.repository.save(message);
  }

  /**
   * Atualiza o status de uma mensagem
   * @param id ID da mensagem
   * @param status Novo status
   * @param timestamp Data da atualização
   */
  async updateStatus(
    id: string, 
    status: MessageStatus, 
    timestamp?: Date
  ): Promise<IMessageResponse> {
    const message = await this.findById(id);
    message.status = status;

    // Atualiza timestamps específicos baseado no status
    if (status === MessageStatus.DELIVERED) {
      message.deliveredAt = timestamp || new Date();
    } else if (status === MessageStatus.READ) {
      message.readAt = timestamp || new Date();
    }

    return this.repository.save(message);
  }

  /**
   * Lista mensagens de uma sessão com paginação
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
  ): Promise<{ messages: IMessageResponse[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId });

    if (options?.status) {
      queryBuilder.andWhere('message.status = :status', { status: options.status });
    }

    if (options?.type) {
      queryBuilder.andWhere('message.type = :type', { type: options.type });
    }

    const [messages, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('message.createdAt', 'DESC')
      .getManyAndCount();

    return { 
      messages: messages.map(message => ({
        ...message,
        to: message.toNumber
      })), 
      total 
    };
  }
}
