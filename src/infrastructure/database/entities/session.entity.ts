import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { SessionStatus } from '../../../domain/enums/session-status.enum';

/**
 * Entidade que representa uma sessão do WhatsApp no banco de dados
 */
@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.DISCONNECTED
  })
  status: SessionStatus;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ nullable: true })
  webhookUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
