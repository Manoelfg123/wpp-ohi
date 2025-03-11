import { Repository } from 'typeorm';
import { SessionEntity } from '../entities/session.entity';
import { dataSource } from '../../../app';
import { ISession, ICreateSessionDTO, IUpdateSessionDTO } from '../../../domain/interfaces/session.interface';
import { SessionStatus } from '../../../domain/enums/session-status.enum';
import { NotFoundError } from '../../../utils/error.types';
import { generateUUID } from '../../../utils/helpers';

/**
 * Repositório para operações com sessões no banco de dados
 */
export class SessionRepository {
  private _repository: Repository<SessionEntity>;

  private get repository(): Repository<SessionEntity> {
    if (!this._repository) {
      this._repository = dataSource.getRepository(SessionEntity);
    }
    return this._repository;
  }

  /**
   * Cria uma nova sessão
   * @param data Dados para criação da sessão
   */
  async create(data: ICreateSessionDTO): Promise<ISession> {
    const session = this.repository.create({
      id: generateUUID(),
      name: data.name,
      status: SessionStatus.INITIALIZING,
      config: data.config || {},
      webhookUrl: data.webhookUrl,
    });

    return this.repository.save(session);
  }

  /**
   * Busca uma sessão pelo ID
   * @param id ID da sessão
   */
  async findById(id: string): Promise<ISession> {
    const session = await this.repository.findOne({ where: { id } });

    if (!session) {
      throw new NotFoundError(`Sessão com ID ${id} não encontrada`);
    }

    return session;
  }

  /**
   * Lista todas as sessões com paginação e filtros opcionais
   * @param options Opções de filtro e paginação
   */
  async findAll(options?: {
    status?: SessionStatus;
    page?: number;
    limit?: number;
  }): Promise<{ sessions: ISession[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('session');

    if (options?.status) {
      queryBuilder.where('session.status = :status', { status: options.status });
    }

    const [sessions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('session.createdAt', 'DESC')
      .getManyAndCount();

    return { sessions, total };
  }

  /**
   * Atualiza uma sessão
   * @param id ID da sessão
   * @param data Dados para atualização
   */
  async update(id: string, data: IUpdateSessionDTO): Promise<ISession> {
    const session = await this.findById(id);

    // Atualiza apenas os campos fornecidos
    if (data.name !== undefined) {
      session.name = data.name;
    }

    if (data.config !== undefined) {
      session.config = { ...session.config, ...data.config };
    }

    if (data.webhookUrl !== undefined) {
      session.webhookUrl = data.webhookUrl;
    }

    return this.repository.save(session);
  }

  /**
   * Atualiza o status de uma sessão
   * @param id ID da sessão
   * @param status Novo status
   */
  async updateStatus(id: string, status: SessionStatus): Promise<ISession> {
    const session = await this.findById(id);
    session.status = status;
    return this.repository.save(session);
  }

  /**
   * Remove uma sessão
   * @param id ID da sessão
   */
  async delete(id: string): Promise<void> {
    const session = await this.findById(id);
    await this.repository.remove(session);
  }
}
