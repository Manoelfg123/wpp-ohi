import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { MessageType } from '../../../domain/enums/message-types.enum';
import { MessageStatus } from '../../../domain/enums/message-status.enum';
import { SessionEntity } from './session.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @ManyToOne(() => SessionEntity, session => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT
  })
  status: MessageStatus;

  @Column({ type: 'jsonb', default: {} })
  content: Record<string, any>;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ name: 'is_from_me', default: false })
  isFromMe: boolean;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
