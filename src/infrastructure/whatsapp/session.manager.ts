import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as QRCode from 'qrcode';
import { SessionRepository } from '../database/repositories/session.repository';
import { IQRCode, ISessionInfo } from '../../domain/interfaces/session.interface';
import { SessionStatus } from '../../domain/enums/session-status.enum';
import logger from '../../utils/logger';
import { delay } from '../../utils/helpers';
import { WhatsAppError } from '../../utils/error.types';
import { messageProcessor } from './message.processor';

/**
 * Gerenciador de sessões do WhatsApp
 */
export class WhatsAppSessionManager {
  private sessions: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, { qrCode: string; expiresAt: Date }> = new Map();
  private sessionRepository: SessionRepository;
  private sessionsDir: string;

  constructor() {
    this.sessionRepository = new SessionRepository();
    this.sessionsDir = join(process.cwd(), 'sessions');

    // Garante que o diretório de sessões existe
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Inicia uma nova sessão do WhatsApp
   * @param sessionId ID da sessão
   */
  async startSession(sessionId: string): Promise<void> {
    try {
      // Verifica se a sessão já existe no banco de dados
      const sessionData = await this.sessionRepository.findById(sessionId);
      
      // Atualiza o status para inicializando
      await this.sessionRepository.updateStatus(sessionId, SessionStatus.INITIALIZING);
      
      // Diretório para armazenar os dados de autenticação da sessão
      const sessionDir = join(this.sessionsDir, sessionId);
      if (!existsSync(sessionDir)) {
        mkdirSync(sessionDir, { recursive: true });
      }
      
      // Carrega o estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      // Obtém a versão mais recente do Baileys
      const { version } = await fetchLatestBaileysVersion();
      
      // Configurações da sessão
      const socketConfig = {
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        version,
        printQRInTerminal: false,
        logger,
        browser: ['Chrome (Linux)', 'Desktop', '3.0'] as [string, string, string],
        qrTimeout: sessionData.config.qrTimeout || 60000,
        connectTimeoutMs: 120000,
        defaultQueryTimeoutMs: 60000,
        emitOwnEvents: true,
        markOnlineOnConnect: true,
        retryRequestDelayMs: 5000,
        customUploadHosts: [{ hostname: 'g.whatsapp.net', maxContentLengthBytes: 10000000 }],
        fireInitQueries: true,
        syncFullHistory: false,
        linkPreviewImageThumbnailWidth: 192,
        transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
        getMessage: async () => undefined
      };
      
      // Cria o socket do WhatsApp
      let socket;
      try {
        socket = makeWASocket(socketConfig);
      } catch (error) {
        logger.error(`Erro ao criar socket do WhatsApp para sessão ${sessionId}:`, error);
        throw new WhatsAppError(`Erro ao criar socket: ${(error as Error).message}`);
      }
      
      // Salva o socket na lista de sessões ativas
      this.sessions.set(sessionId, socket);
      
      // Configura os callbacks do socket
      socket.ev.on('connection.update', async (update) => {
        logger.info(`Atualização de conexão para sessão ${sessionId}:`, update);
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          try {
            logger.info(`Recebido novo QR code para sessão ${sessionId}`);
            const qrCode = await QRCode.toDataURL(qr, {
              errorCorrectionLevel: 'H',
              margin: 4,
              scale: 4,
              width: 256
            });
            const expiresAt = new Date(Date.now() + (sessionData.config.qrTimeout || 60000));
            this.qrCodes.set(sessionId, { qrCode, expiresAt });
            
            await this.sessionRepository.updateStatus(sessionId, SessionStatus.QR_READY);
            logger.info(`QR Code gerado para a sessão ${sessionId}`);
          } catch (error) {
            logger.error(`Erro ao gerar QR Code para a sessão ${sessionId}:`, error);
            await this.sessionRepository.updateStatus(sessionId, SessionStatus.ERROR);
            this.startSession(sessionId);
          }
        }
        
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          logger.info(`Conexão fechada para a sessão ${sessionId}. Status: ${statusCode}`);
          
          if (shouldReconnect && sessionData.config.restartOnAuthFail !== false) {
            logger.info(`Tentando reconectar sessão ${sessionId}...`);
            await this.sessionRepository.updateStatus(sessionId, SessionStatus.CONNECTING);
            await delay(5000);
            this.startSession(sessionId);
          } else {
            await this.sessionRepository.updateStatus(
              sessionId, 
              statusCode === DisconnectReason.loggedOut 
                ? SessionStatus.LOGGED_OUT 
                : SessionStatus.DISCONNECTED
            );
            this.sessions.delete(sessionId);
          }
        } else if (connection === 'open') {
          logger.info(`Sessão ${sessionId} conectada com sucesso!`);
          await this.sessionRepository.updateStatus(sessionId, SessionStatus.CONNECTED);
          this.qrCodes.delete(sessionId);
        }
      });
      
      // Salva as credenciais quando forem atualizadas
      socket.ev.on('creds.update', saveCreds);
      
      // Configura o processamento de mensagens
      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
          for (const message of messages) {
            // Ignora mensagens enviadas por nós mesmos
            if (message.key.fromMe) continue;

            // Processa a mensagem usando o messageProcessor
            await messageProcessor.processMessage(message, sessionId);
          }
        } catch (error) {
          logger.error(`Erro ao processar mensagens da sessão ${sessionId}:`, error);
        }
      });
      
    } catch (error) {
      logger.error(`Erro ao iniciar sessão ${sessionId}:`, error);
      await this.sessionRepository.updateStatus(sessionId, SessionStatus.ERROR);
      throw new WhatsAppError(`Erro ao iniciar sessão: ${(error as Error).message}`);
    }
  }

  /**
   * Obtém o QR Code de uma sessão
   * @param sessionId ID da sessão
   */
  async getQRCode(sessionId: string): Promise<IQRCode> {
    const qrData = this.qrCodes.get(sessionId);
    
    if (!qrData) {
      throw new WhatsAppError('QR Code não disponível. Inicie a sessão primeiro.');
    }
    
    const now = new Date();
    if (now > qrData.expiresAt) {
      throw new WhatsAppError('QR Code expirado. Reinicie a sessão para gerar um novo.');
    }
    
    const expiresIn = Math.floor((qrData.expiresAt.getTime() - now.getTime()) / 1000);
    
    return {
      qrcode: qrData.qrCode,
      expiresIn,
    };
  }

  /**
   * Desconecta uma sessão
   * @param sessionId ID da sessão
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const socket = this.sessions.get(sessionId);
    
    if (!socket) {
      throw new WhatsAppError(`Sessão ${sessionId} não está ativa`);
    }
    
    try {
      await socket.logout();
      this.sessions.delete(sessionId);
      await this.sessionRepository.updateStatus(sessionId, SessionStatus.DISCONNECTED);
      logger.info(`Sessão ${sessionId} desconectada com sucesso`);
    } catch (error) {
      logger.error(`Erro ao desconectar sessão ${sessionId}:`, error);
      throw new WhatsAppError(`Erro ao desconectar sessão: ${(error as Error).message}`);
    }
  }

  /**
   * Obtém informações detalhadas de uma sessão
   * @param sessionId ID da sessão
   */
  async getSessionInfo(sessionId: string): Promise<ISessionInfo> {
    const sessionData = await this.sessionRepository.findById(sessionId);
    const socket = this.sessions.get(sessionId);
    
    const info: ISessionInfo = {
      id: sessionData.id,
      name: sessionData.name,
      status: sessionData.status,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
      config: sessionData.config,
    };
    
    if (socket && sessionData.status === SessionStatus.CONNECTED) {
      const user = socket.user;
      
      if (user && user.id) {
        info.clientInfo = {
          platform: 'WhatsApp',
          phoneNumber: user.id.split('@')[0],
          deviceManufacturer: 'unknown',
          connectedAt: new Date(),
        };
      }
    }
    
    return info;
  }

  /**
   * Verifica se uma sessão está ativa
   * @param sessionId ID da sessão
   */
  isSessionActive(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Obtém o socket de uma sessão
   * @param sessionId ID da sessão
   */
  getSocket(sessionId: string): WASocket | null {
    return this.sessions.get(sessionId) || null;
  }
}

// Singleton
export const whatsAppSessionManager = new WhatsAppSessionManager();
