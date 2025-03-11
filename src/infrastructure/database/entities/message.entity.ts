import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { MessageStatus } from '../../../domain/enums/message-status.enum';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { SessionEntity } from './session.entity';

/**
 * Entidade que representa uma mensagem no banco de dados
 */
@Entity('messages')
export class MessageEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: SessionEntity;

  @Column({
    type: 'enum',
    enum: MessageType
  })
  type: MessageType;

  @Column()
  toNumber: string;

  get to(): string {
    return this.toNumber;
  }

  set to(value: string) {
    this.toNumber = value;
  }

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING
  })
  status: MessageStatus;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;
}
