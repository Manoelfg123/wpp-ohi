import { Request, Response, NextFunction } from 'express';
import { messageService } from '../../domain/services/message.service';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { MessageType } from '../../domain/enums/message-types.enum';
import logger from '../../utils/logger';

/**
 * Controlador para operações com mensagens
 */
export class MessageController {
  /**
   * Envia uma mensagem de texto
   */
  async sendTextMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendTextMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia uma mensagem de mídia (imagem, vídeo, áudio, documento)
   */
  async sendMediaMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendMediaMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia uma mensagem de localização
   */
  async sendLocationMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendLocationMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia uma mensagem de contato
   */
  async sendContactMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendContactMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia uma mensagem com botões
   */
  async sendButtonMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendButtonMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia uma mensagem com lista
   */
  async sendListMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendListMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia uma reação a uma mensagem
   */
  async sendReactionMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendReactionMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia um sticker
   */
  async sendStickerMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messageService.sendStickerMessage(id, req.body);
      
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes de uma mensagem
   */
  async getMessageDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, messageId } = req.params;
      const message = await messageService.getMessageDetails(sessionId, messageId);
      
      res.status(200).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista mensagens de uma sessão
   */
  async listSessionMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, type, page, limit } = req.query;
      
      const options: {
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
      } = {};
      
      if (status) {
        options.status = status as string;
      }
      
      if (type) {
        options.type = type as string;
      }
      
      if (page) {
        options.page = Number(page);
      }
      
      if (limit) {
        options.limit = Number(limit);
      }
      
      const result = await messageService.listSessionMessages(id, {
        status: options.status as MessageStatus,
        type: options.type as MessageType,
        page: options.page,
        limit: options.limit
      });
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Singleton
export const messageController = new MessageController();
