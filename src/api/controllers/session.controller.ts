import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../../domain/services/session.service';
import { SessionStatus } from '../../domain/enums/session-status.enum';
import { WhatsAppError } from '../../utils/error.types';
import logger from '../../utils/logger';


/**
 * Controlador para operações com sessões
 */
export class SessionController {
  /**
   * Cria uma nova sessão e retorna o QR Code
   */
  async createSessionWithQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Cria a sessão
      const session = await sessionService.createSession(req.body);
      
      // Aguarda o QR Code com timeout
      const maxAttempts = 10;
      const interval = 1000;
      let attempts = 0;
      let qrcode = null;
      
      while (attempts < maxAttempts) {
        try {
          qrcode = await sessionService.getSessionQRCode(session.id);
          break;
        } catch (error) {
          if (error instanceof WhatsAppError && error.message.includes('Sessão já está conectada')) {
            // Se a sessão já estiver conectada, retorna sem o QR Code
            res.status(201).json({
              status: 'success',
              data: {
                session,
                message: 'Sessão já está conectada'
              }
            });
            return;
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
      
      if (!qrcode) {
        throw new WhatsAppError('Timeout ao gerar QR Code');
      }
      
      res.status(201).json({
        status: 'success',
        data: {
          session,
          qrcode
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova sessão
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await sessionService.createSession(req.body);
      
      res.status(201).json({
        status: 'success',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém uma sessão pelo ID
   */
  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionService.getSessionById(id);
      
      res.status(200).json({
        status: 'success',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém informações detalhadas de uma sessão
   */
  async getSessionInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sessionInfo = await sessionService.getSessionInfo(id);
      
      res.status(200).json({
        status: 'success',
        data: sessionInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todas as sessões
   */
  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query;
      
      const options: {
        status?: SessionStatus;
        page?: number;
        limit?: number;
      } = {};
      
      if (status) {
        options.status = status as SessionStatus;
      }
      
      if (page) {
        options.page = Number(page);
      }
      
      if (limit) {
        options.limit = Number(limit);
      }
      
      const result = await sessionService.listSessions(options);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma sessão
   */
  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionService.updateSession(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém o QR Code de uma sessão
   */
  async getSessionQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const qrCode = await sessionService.getSessionQRCode(id);
      
      res.status(200).json({
        status: 'success',
        data: qrCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desconecta uma sessão
   */
  async disconnectSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await sessionService.disconnectSession(id);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reconecta uma sessão
   */
  async reconnectSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await sessionService.reconnectSession(id);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove uma sessão
   */
  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await sessionService.deleteSession(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

// Singleton
export const sessionController = new SessionController();
