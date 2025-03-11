import { SessionStatus } from '../enums/session-status.enum';

/**
 * Interface para configuração de uma sessão do WhatsApp
 */
export interface ISessionConfig {
  restartOnAuthFail?: boolean;
  maxRetries?: number;
  browser?: [string, string, string];
  qrTimeout?: number;
  [key: string]: any;
}

/**
 * Interface para uma sessão do WhatsApp
 */
export interface ISession {
  id: string;
  name: string;
  status: SessionStatus;
  config: ISessionConfig;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para o QR Code de uma sessão
 */
export interface IQRCode {
  qrcode: string;
  expiresIn: number;
}

/**
 * Interface para informações detalhadas de uma sessão
 */
export interface ISessionInfo {
  id: string;
  name: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  clientInfo?: {
    platform?: string;
    phoneNumber?: string;
    deviceManufacturer?: string;
    connectedAt?: Date;
  };
  config: ISessionConfig;
}

/**
 * Interface para criação de uma sessão
 */
export interface ICreateSessionDTO {
  name: string;
  config?: ISessionConfig;
  webhookUrl?: string;
}

/**
 * Interface para atualização de uma sessão
 */
export interface IUpdateSessionDTO {
  name?: string;
  config?: Partial<ISessionConfig>;
  webhookUrl?: string;
}

/**
 * Interface para resposta de status de uma sessão
 */
export interface ISessionStatusResponse {
  id: string;
  status: SessionStatus;
  message: string;
}
